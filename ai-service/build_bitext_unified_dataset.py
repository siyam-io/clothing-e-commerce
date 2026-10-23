"""
Builds the final combined VLM training dataset merging:
1. Local E-Commerce Product Vision Catalog (259 products, 989 images, SKUs, sizing, pricing, order payloads).
2. Official Bitext GenAI Chatbot Customer Support Dataset (26,872 examples sampled for diverse e-commerce intents).
3. Human Support Takeover escalation dialogues.

Outputs:
- ai-service/dataset/final_bitext_vlm_train.json
- ai-service/dataset/final_bitext_vlm_val.json
"""

import sys
import json
import random
import re
from pathlib import Path
from datasets import load_dataset

# Ensure UTF-8 output on Windows terminals
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

random.seed(42)

BASE_DIR = Path(__file__).resolve().parent
DATASET_DIR = BASE_DIR / "dataset"
PRODUCT_DATASET_FILE = DATASET_DIR / "vlm_train.json"
TRAIN_OUTPUT_FILE = DATASET_DIR / "final_bitext_vlm_train.json"
VAL_OUTPUT_FILE = DATASET_DIR / "final_bitext_vlm_val.json"


def clean_template_placeholders(text: str) -> str:
    """Replaces {{Order Number}}, {{User Name}}, etc. with realistic e-commerce values."""
    order_num = f"#{random.randint(10200, 99800)}"
    text = re.sub(r"\{\{Order Number\}\}", order_num, text, flags=re.IGNORECASE)
    text = re.sub(r"\{\{Refund Amount\}\}", f"৳{random.randint(1200, 4500)}", text, flags=re.IGNORECASE)
    text = re.sub(r"\{\{Delivery Date\}\}", "tomorrow by 5:00 PM", text, flags=re.IGNORECASE)
    text = re.sub(r"\{\{Tracking Number\}\}", f"PATHAO-{random.randint(100000, 999999)}", text, flags=re.IGNORECASE)
    text = re.sub(r"\{\{User Name\}\}", "valued customer", text, flags=re.IGNORECASE)
    return text.strip()


def build_final_dataset(bitext_sample_size: int = 1500):
    # 1. Load Local Product Vision Dataset
    if not PRODUCT_DATASET_FILE.exists():
        raise FileNotFoundError(f"Missing product dataset at {PRODUCT_DATASET_FILE}")

    print(f"📦 Loading Local Product Vision Dataset from {PRODUCT_DATASET_FILE}...")
    with open(PRODUCT_DATASET_FILE, "r", encoding="utf-8") as f:
        product_entries = json.load(f)
    print(f"✅ Loaded {len(product_entries)} Product Vision samples with local images!")

    # 2. Load Official Bitext Customer Support Dataset
    print("🌐 Downloading & Streaming Bitext GenAI Customer Support Dataset...")
    hf_dataset = load_dataset("bitext/Bitext-customer-support-llm-chatbot-training-dataset", split="train")
    print(f"✅ Loaded {len(hf_dataset)} total Bitext records from Hugging Face!")

    # Sample balanced entries across intents
    intents_pool = {}
    for row in hf_dataset:
        intent = row.get("intent", "general")
        if intent not in intents_pool:
            intents_pool[intent] = []
        intents_pool[intent].append(row)

    print(f"📊 Identified {len(intents_pool)} distinct customer support intent categories.")

    # Evenly sample up to target count
    per_intent_count = max(10, bitext_sample_size // len(intents_pool))
    bitext_entries = []

    for intent, rows in intents_pool.items():
        sampled_rows = random.sample(rows, min(len(rows), per_intent_count))
        for r_idx, r in enumerate(sampled_rows):
            clean_q = clean_template_placeholders(r["instruction"])
            clean_a = clean_template_placeholders(r["response"])

            entry = {
                "id": f"bitext_{intent}_{r_idx}",
                "conversations": [
                    {
                        "role": "user",
                        "content": [{"type": "text", "text": clean_q}]
                    },
                    {
                        "role": "assistant",
                        "content": [{"type": "text", "text": clean_a}]
                    }
                ]
            }
            bitext_entries.append(entry)

    print(f"✅ Curated {len(bitext_entries)} high-quality Bitext customer support conversations.")

    # 3. Add Dedicated Human Admin Takeover / Escalation Dialogues
    admin_takeover_dialogues = [
        ("Can I speak with a real human agent?", "Certainly! I am alerting our live support team right now. A human customer support executive is taking over this chat momentarily."),
        ("I want to talk to an admin, not a robot.", "Understood! I've flagged this conversation for admin takeover. One of our support executives will join the chat right away."),
        ("Please transfer me to human support.", "Transferring you to our live support desk now. An agent will be with you in just a moment!"),
        ("Can an admin take over this conversation?", "Right away! I'm pausing automated responses for this session so our human support team can assist you directly."),
        ("I need to speak to your manager or supervisor.", "I have notified our supervisory support team. An administrator will review your conversation and take over shortly.")
    ]

    for h_idx, (uq, ar) in enumerate(admin_takeover_dialogues * 10):
        bitext_entries.append({
            "id": f"admin_handover_{h_idx}",
            "conversations": [
                {"role": "user", "content": [{"type": "text", "text": uq}]},
                {"role": "assistant", "content": [{"type": "text", "text": ar}]}
            ]
        })

    # 4. Merge Multi-Task Dataset (Product Vision + Bitext Support)
    unified_dataset = product_entries + bitext_entries
    random.shuffle(unified_dataset)

    # 88% Train / 12% Validation Split
    split_index = int(len(unified_dataset) * 0.88)
    train_split = unified_dataset[:split_index]
    val_split = unified_dataset[split_index:]

    DATASET_DIR.mkdir(parents=True, exist_ok=True)
    with open(TRAIN_OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(train_split, f, indent=2, ensure_ascii=False)

    with open(VAL_OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(val_split, f, indent=2, ensure_ascii=False)

    print("\n====================================================================")
    print("🎉 FINAL UNIFIED MULTI-MODAL DATASET READY FOR TRAINING!")
    print(f"   - Product Vision Samples: {len(product_entries)}")
    print(f"   - Bitext Customer Support Samples: {len(bitext_entries)}")
    print(f"   - Total Combined Training Examples: {len(train_split)} -> {TRAIN_OUTPUT_FILE}")
    print(f"   - Total Combined Validation Examples: {len(val_split)} -> {VAL_OUTPUT_FILE}")
    print("====================================================================")


if __name__ == "__main__":
    build_final_dataset(bitext_sample_size=1500)
