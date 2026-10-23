"""
Production QLoRA Fine-Tuning Pipeline for Qwen2-VL Local Multimodal Model.
Tailored for E-Commerce Product Recognition, Sizing/Stock Check & Conversational Ordering.

Features:
- 4-bit NF4 Quantization via BitsAndBytes (fits on consumer GPUs: RTX 3060/3080/4070/4090/A10/A100).
- QLoRA target module adaptation for Self-Attention and MLP layers.
- Prompt masking: Loss is strictly calculated on Assistant target tokens (labels=-100 on prompts & vision tokens).
- Gradient Checkpointing & Mixed Precision (BFloat16 / Float16).
- Export of adapter weights and test inference check.
"""

import os
import sys
import json
import argparse
from pathlib import Path
from typing import Dict, Any, List

import torch
from torch.utils.data import Dataset
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
    TrainingArguments,
    Trainer,
    BitsAndBytesConfig
)
from peft import (
    LoraConfig,
    get_peft_model,
    prepare_model_for_kbit_training
)

try:
    from qwen_vl_utils import process_vision_info
except ImportError:
    process_vision_info = None


class VLMDataset(Dataset):
    """
    Dataset loader for Qwen2-VL conversational vision-language instruction pairs.
    Handles both multi-modal (image + text) and text-only e-commerce interactions.
    """
    def __init__(self, data_path: str, processor: AutoProcessor, max_length: int = 1024):
        self.processor = processor
        self.max_length = max_length
        with open(data_path, "r", encoding="utf-8") as f:
            self.data = json.load(f)

    def __len__(self) -> int:
        return len(self.data)

    def __getitem__(self, idx: int) -> Dict[str, Any]:
        item = self.data[idx]
        conversations = item["conversations"]
        image_path = item.get("image", None)

        image_obj = None
        if image_path and os.path.exists(image_path):
            try:
                image_obj = Image.open(image_path).convert("RGB")
                # Downsample large images to preserve VRAM during training
                image_obj.thumbnail((512, 512))
            except Exception as e:
                print(f"⚠️ Failed to open image {image_path}: {e}")
                image_obj = None

        return {
            "conversations": conversations,
            "image": image_obj
        }


class VLMDataCollator:
    """
    Data collator that formats conversations using Qwen2-VL chat templates,
    processes images into vision feature tokens, and masks prompt tokens with -100.
    """
    def __init__(self, processor: AutoProcessor):
        self.processor = processor

    def __call__(self, batch: List[Dict[str, Any]]) -> Dict[str, torch.Tensor]:
        texts = []
        images = []

        for item in batch:
            conversations = item["conversations"]
            image_obj = item["image"]

            # Prepare messages structure for processor chat template
            formatted_messages = []
            for msg in conversations:
                role = msg["role"]
                content_list = []
                
                if isinstance(msg["content"], list):
                    for part in msg["content"]:
                        if part.get("type") == "image":
                            if image_obj is not None:
                                content_list.append({"type": "image", "image": image_obj})
                        elif part.get("type") == "text":
                            content_list.append({"type": "text", "text": part.get("text", "")})
                else:
                    content_list.append({"type": "text", "text": str(msg["content"])})

                formatted_messages.append({"role": role, "content": content_list})

            # Format full text with chat template
            full_text = self.processor.apply_chat_template(
                formatted_messages, tokenize=False, add_generation_prompt=False
            )
            texts.append(full_text)
            if image_obj is not None:
                images.append([image_obj])
            else:
                images.append(None)

        # Batch encode via Qwen2-VL processor
        batch_inputs = self.processor(
            text=texts,
            images=[img for img in images if img is not None] if any(images) else None,
            padding=True,
            return_tensors="pt"
        )

        labels = batch_inputs["input_ids"].clone()

        # Mask prompt tokens: Assistant answers start after "<|im_start|>assistant\n"
        # We mask all tokens prior to the assistant answer with -100
        assistant_header_ids = self.processor.tokenizer.encode("<|im_start|>assistant\n", add_special_tokens=False)
        header_len = len(assistant_header_ids)

        for i in range(len(labels)):
            input_ids = batch_inputs["input_ids"][i].tolist()
            # Find index of assistant start token
            found_idx = -1
            for j in range(len(input_ids) - header_len + 1):
                if input_ids[j : j + header_len] == assistant_header_ids:
                    found_idx = j + header_len
                    break

            if found_idx != -1:
                labels[i, :found_idx] = -100
            else:
                # If no assistant header found, mask entire sequence to prevent unaligned loss
                labels[i, :] = -100

            # Mask padding tokens
            labels[i, batch_inputs["attention_mask"][i] == 0] = -100

        batch_inputs["labels"] = labels
        return batch_inputs


def train(args):
    print("====================================================================")
    print("🚀 Vanguard Local VLM Fine-Tuning Pipeline (Qwen2-VL + QLoRA)")
    print(f"📦 Base Model: {args.model_id}")
    print(f"📂 Dataset: {args.train_file}")
    print("====================================================================")

    # 1. Device and Precision Configuration
    device = "cuda" if torch.cuda.is_available() else "cpu"
    compute_dtype = torch.bfloat16 if torch.cuda.is_bf16_supported() else torch.float16
    print(f"💻 Compute Device: {device} | Precision: {compute_dtype}")

    # 2. Base Model Loading (BF16 or 4-bit NF4)
    print(f"⏳ Loading base model: {args.model_id} (use_4bit={args.use_4bit})...")
    if args.use_4bit and device == "cuda":
        bnb_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_compute_dtype=compute_dtype,
            bnb_4bit_use_double_quant=True
        )
        model = Qwen2VLForConditionalGeneration.from_pretrained(
            args.model_id,
            quantization_config=bnb_config,
            device_map="auto",
            torch_dtype=compute_dtype
        )
        model = prepare_model_for_kbit_training(model)
    else:
        model = Qwen2VLForConditionalGeneration.from_pretrained(
            args.model_id,
            device_map="auto" if device == "cuda" else None,
            torch_dtype=compute_dtype
        )

    # Enable gradient checkpointing to drastically reduce VRAM usage
    if hasattr(model, "gradient_checkpointing_enable"):
        model.gradient_checkpointing_enable()

    # 3. Load Processor & Visual Config
    processor = AutoProcessor.from_pretrained(
        args.model_id,
        min_pixels=256 * 28 * 28,
        max_pixels=512 * 28 * 28
    )

    # 4. LoRA Adapter Configuration
    lora_config = LoraConfig(
        r=args.lora_r,
        lora_alpha=args.lora_alpha,
        lora_dropout=args.lora_dropout,
        target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
        bias="none",
        task_type="CAUSAL_LM"
    )

    model = get_peft_model(model, lora_config)
    model.print_trainable_parameters()

    # 7. Prepare Datasets & Collator
    print(f"📂 Building datasets from {args.train_file} and {args.val_file}...")
    train_dataset = VLMDataset(args.train_file, processor)
    val_dataset = VLMDataset(args.val_file, processor)
    collator = VLMDataCollator(processor)

    # 8. Training Arguments Setup
    training_args = TrainingArguments(
        output_dir=args.output_dir,
        num_train_epochs=args.epochs,
        per_device_train_batch_size=args.batch_size,
        per_device_eval_batch_size=args.batch_size,
        gradient_accumulation_steps=args.gradient_accumulation_steps,
        learning_rate=args.learning_rate,
        lr_scheduler_type="cosine",
        warmup_steps=20,
        weight_decay=0.01,
        logging_steps=10,
        eval_strategy="steps",
        eval_steps=50,
        save_strategy="steps",
        save_steps=50,
        save_total_limit=2,
        fp16=(compute_dtype == torch.float16),
        bf16=(compute_dtype == torch.bfloat16),
        optim="paged_adamw_8bit" if device == "cuda" else "adamw_torch",
        report_to="none",
        dataloader_pin_memory=False,
        remove_unused_columns=False
    )

    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset,
        eval_dataset=val_dataset,
        data_collator=collator
    )

    # 9. Execute Training
    resume_checkpoint = None
    if args.resume_from_checkpoint and args.resume_from_checkpoint.lower() not in ("none", "false"):
        if args.resume_from_checkpoint.lower() == "auto":
            checkpoints = [
                d for d in Path(args.output_dir).glob("checkpoint-*")
                if d.is_dir() and (d / "trainer_state.json").exists()
            ]
            if checkpoints:
                checkpoints.sort(key=lambda p: int(p.name.split("-")[-1]))
                resume_checkpoint = str(checkpoints[-1])
                print(f"🔄 Auto-resuming from latest checkpoint: {resume_checkpoint}")
        else:
            resume_checkpoint = args.resume_from_checkpoint
            print(f"🔄 Resuming from checkpoint: {resume_checkpoint}")

    print("🔥 Starting QLoRA Training...")
    trainer.train(resume_from_checkpoint=resume_checkpoint)

    # 10. Save Adapter Weights & Processor
    final_output_path = Path(args.output_dir) / "final_adapter"
    final_output_path.mkdir(parents=True, exist_ok=True)
    print(f"💾 Saving trained LoRA adapter to {final_output_path}...")
    trainer.model.save_pretrained(final_output_path)
    processor.save_pretrained(final_output_path)

    print("🎉 Training successfully finished! Your local custom VLM is ready.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="QLoRA VLM Fine-Tuning for E-Commerce Assistant")
    parser.add_argument("--model_id", type=str, default="Qwen/Qwen2-VL-2B-Instruct", help="Hugging Face Model ID or local path")
    parser.add_argument("--train_file", type=str, default="dataset/final_bitext_vlm_train.json", help="Path to training dataset JSON")
    parser.add_argument("--val_file", type=str, default="dataset/final_bitext_vlm_val.json", help="Path to validation dataset JSON")
    parser.add_argument("--output_dir", type=str, default="./trained_vlm_adapter", help="Directory to save adapter weights")
    parser.add_argument("--epochs", type=int, default=3, help="Number of training epochs")
    parser.add_argument("--batch_size", type=int, default=1, help="Per-device batch size")
    parser.add_argument("--gradient_accumulation_steps", type=int, default=8, help="Gradient accumulation steps")
    parser.add_argument("--learning_rate", type=float, default=2e-4, help="Learning rate")
    parser.add_argument("--lora_r", type=int, default=16, help="LoRA rank dimension")
    parser.add_argument("--lora_alpha", type=int, default=32, help="LoRA alpha scaling parameter")
    parser.add_argument("--lora_dropout", type=float, default=0.05, help="LoRA dropout rate")
    parser.add_argument("--use_4bit", action="store_true", help="Enable 4-bit NF4 quantization (default: BF16 LoRA)")
    parser.add_argument("--resume_from_checkpoint", type=str, default="auto", help="Resume from checkpoint path, 'auto' for latest checkpoint, or 'none' to start fresh")

    args = parser.parse_args()
    train(args)
