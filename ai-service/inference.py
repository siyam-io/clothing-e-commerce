"""
FastAPI Local Inference Server for Qwen2-VL E-Commerce Shopping Assistant.
Listens on port 8000:
- Endpoint: POST /api/vlm/chat (receives user message + optional image)
- Handles dynamic image loading & chat template formatting.
- Parses natural language and structured action payloads (ADD_TO_CART, CREATE_ORDER).
"""

import os
import sys
import io
import json
import re
from pathlib import Path
from typing import Optional, Dict, Any, List

import torch
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from PIL import Image

# Ensure UTF-8 output on Windows terminals
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

from transformers import (
    Qwen2VLForConditionalGeneration,
    AutoProcessor,
    BitsAndBytesConfig
)
from peft import PeftModel

app = FastAPI(
    title="Vanguard Local VLM Inference Engine",
    description="Local Qwen2-VL multimodal conversational assistant with conversational ordering",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------------------------------------------------------
# Model Initialization
# -----------------------------------------------------------------------------
BASE_MODEL_ID = os.getenv("VLM_BASE_MODEL", "Qwen/Qwen2-VL-2B-Instruct")
ADAPTER_PATH = os.getenv("VLM_ADAPTER_PATH", "./trained_vlm_adapter/final_adapter")

device = "cuda" if torch.cuda.is_available() else "cpu"
compute_dtype = torch.bfloat16 if (torch.cuda.is_available() and torch.cuda.is_bf16_supported()) else torch.float16

model = None
processor = None


def load_model_pipeline():
    global model, processor
    print("====================================================================")
    print("⏳ Initializing Local VLM Model Engine...")
    print(f"📦 Base Model: {BASE_MODEL_ID}")
    print(f"💻 Device: {device} | Precision: {compute_dtype}")
    print("====================================================================")

    bnb_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_compute_dtype=compute_dtype,
        bnb_4bit_use_double_quant=True
    ) if device == "cuda" else None

    # Load Base Model
    base_model = Qwen2VLForConditionalGeneration.from_pretrained(
        BASE_MODEL_ID,
        quantization_config=bnb_config,
        device_map="auto" if device == "cuda" else None,
        torch_dtype=compute_dtype
    )

    # Check for fine-tuned LoRA adapter
    adapter_dir = Path(ADAPTER_PATH)
    if not adapter_dir.exists():
        adapter_dir = Path("./trained_vlm_adapter")

    if adapter_dir.exists() and (adapter_dir / "adapter_model.safetensors").exists():
        print(f"✅ Loading fine-tuned LoRA adapter from: {adapter_dir}")
        model = PeftModel.from_pretrained(base_model, str(adapter_dir))
    else:
        print("ℹ️ No trained adapter found yet. Running base instruction model in inference mode.")
        model = base_model

    model.eval()

    # Load Processor
    processor = AutoProcessor.from_pretrained(
        BASE_MODEL_ID,
        min_pixels=256 * 28 * 28,
        max_pixels=512 * 28 * 28
    )
    print("🚀 Local VLM Model Engine Ready!")


@app.on_event("startup")
async def startup_event():
    try:
        load_model_pipeline()
    except Exception as e:
        print(f"⚠️ Model startup warning (will lazy-load or use fallback): {e}")


# -----------------------------------------------------------------------------
# Structured Action Payload Extractor
# -----------------------------------------------------------------------------
def extract_action_payload(reply_text: str) -> Optional[Dict[str, Any]]:
    """
    Extracts structured action blocks (```json ... ```) embedded in model responses,
    or falls back to regex pattern matching for order/cart requests.
    """
    # 1. Check for markdown JSON code blocks
    json_blocks = re.findall(r"```json\s*(\{.*?\})\s*```", reply_text, re.DOTALL)
    for block in json_blocks:
        try:
            data = json.loads(block)
            if "action" in data:
                return data
        except Exception:
            continue

    # 2. Check for direct JSON objects
    direct_json = re.search(r'(\{\s*"action"\s*:\s*"[A-Z_]+".*?\})', reply_text, re.DOTALL)
    if direct_json:
        try:
            return json.loads(direct_json.group(1))
        except Exception:
            pass

    return None


# -----------------------------------------------------------------------------
# VLM Chat Endpoint
# -----------------------------------------------------------------------------
@app.get("/health")
def health():
    return {
        "status": "online",
        "service": "VLM Inference Engine",
        "model_loaded": model is not None,
        "device": device
    }


@app.post("/api/vlm/chat")
async def vlm_chat_endpoint(
    message: str = Form(...),
    image: Optional[UploadFile] = File(None),
    history: Optional[str] = Form(None)
):
    """
    Multimodal Chat Endpoint:
    - Accepts user message and optional image.
    - Runs Qwen2-VL inference locally.
    - Returns natural text reply and parsed action payload.
    """
    global model, processor

    if model is None or processor is None:
        try:
            load_model_pipeline()
        except Exception as e:
            raise HTTPException(
                status_code=503,
                detail=f"Local VLM model is still initializing or unavailable: {str(e)}"
            )

    try:
        # Load and resize image if present
        image_obj = None
        if image and image.filename:
            image_bytes = await image.read()
            if len(image_bytes) > 0:
                image_obj = Image.open(io.BytesIO(image_bytes)).convert("RGB")
                image_obj.thumbnail((512, 512))

        # Parse conversational history if provided
        history_list = []
        if history:
            try:
                history_list = json.loads(history)
            except Exception:
                history_list = []

        # Construct messages
        messages = []
        for prev in history_list[-4:]:  # Keep recent context
            role = prev.get("role", "user")
            content = prev.get("content", "")
            messages.append({"role": role, "content": [{"type": "text", "text": content}]})

        current_content = []
        if image_obj is not None:
            current_content.append({"type": "image", "image": image_obj})
        current_content.append({"type": "text", "text": message})

        messages.append({"role": "user", "content": current_content})

        # Apply Qwen2-VL chat template
        prompt_text = processor.apply_chat_template(
            messages,
            tokenize=False,
            add_generation_prompt=True
        )

        inputs = processor(
            text=[prompt_text],
            images=[[image_obj]] if image_obj is not None else None,
            padding=True,
            return_tensors="pt"
        )

        if device == "cuda":
            inputs = {k: v.to("cuda") for k, v in inputs.items()}

        # Generate response
        with torch.inference_mode():
            generated_ids = model.generate(
                **inputs,
                max_new_tokens=384,
                temperature=0.7,
                top_p=0.9,
                repetition_penalty=1.05
            )

        # Slice off prompt tokens
        generated_ids_trimmed = [
            out_ids[len(in_ids) :] for in_ids, out_ids in zip(inputs["input_ids"], generated_ids)
        ]
        reply = processor.batch_decode(
            generated_ids_trimmed,
            skip_special_tokens=True,
            clean_up_tokenization_spaces=True
        )[0].strip()

        # Extract structured action payload if present
        action_payload = extract_action_payload(reply)

        return {
            "success": True,
            "reply": reply,
            "action_payload": action_payload,
            "has_image": image_obj is not None
        }

    except Exception as e:
        print(f"❌ Error during VLM inference: {e}")
        raise HTTPException(status_code=500, detail=f"Inference failure: {str(e)}")


@app.post("/api/vlm/embed")
async def extract_image_embedding_endpoint(image: UploadFile = File(...)):
    """
    Extracts a normalized dense vector embedding from an uploaded product image.
    Used by the backend to index products into MongoDB Atlas Vector Search ($vectorSearch).
    """
    global model, processor

    if model is None or processor is None:
        try:
            load_model_pipeline()
        except Exception as e:
            raise HTTPException(
                status_code=503,
                detail=f"Local VLM model is unavailable: {str(e)}"
            )

    try:
        image_bytes = await image.read()
        image_obj = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        image_obj.thumbnail((512, 512))

        inputs = processor(images=[[image_obj]], return_tensors="pt")
        if device == "cuda":
            inputs = {k: v.to("cuda") for k, v in inputs.items()}

        with torch.inference_mode():
            # Extract visual tokens from Qwen2-VL visual tower
            base = model.base_model if hasattr(model, "base_model") else model
            visual_tower = getattr(base, "visual", None) or getattr(base.model, "visual", None)

            if visual_tower is not None:
                features = visual_tower(inputs["pixel_values"], grid_thw=inputs["image_grid_thw"])
                pooled = features.mean(dim=0)
            else:
                # Fallback: flatten and average features
                pooled = inputs["pixel_values"].mean(dim=[0, 2, 3])

            normalized = torch.nn.functional.normalize(pooled, p=2, dim=-1)
            embedding_list = normalized.cpu().tolist()

        return {
            "success": True,
            "dimensions": len(embedding_list),
            "embedding": embedding_list
        }
    except Exception as e:
        print(f"❌ Error during vector embedding extraction: {e}")
        raise HTTPException(status_code=500, detail=f"Embedding extraction failure: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("inference:app", host="0.0.0.0", port=8000, reload=False)
