"""
Dataset Preparation Pipeline for E-Commerce Vision-Language Model (VLM).
Converts product catalog metadata (products_detailed.json) and downloaded images
into multi-intent conversational VLM instruction dataset (Qwen2-VL format).

Supported Intents:
1. Visual Product Identification & Catalog Matching
2. Sizing Verification & Live Stock Query
3. Price, Discount & Deal Breakdown
4. Conversational Add-to-Cart & Order Confirmation (with structured JSON payload)
5. Fabric, Material & Care Instructions
6. Bitext-style Customer Support FAQs (Shipping, Returns, COD, Exchanges)
"""

import os
import sys
import json
import random
from pathlib import Path
from typing import List, Dict, Any

# Ensure UTF-8 output on Windows terminals
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Set random seed for reproducible train/val splits
random.seed(42)

BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent
DATA_DIR = PROJECT_ROOT / "products_data"
IMAGES_DIR = DATA_DIR / "images"
PRODUCTS_JSON_PATH = DATA_DIR / "products_detailed.json"
OUTPUT_DIR = BASE_DIR / "dataset"

# -----------------------------------------------------------------------------
# Customer Support Intent Knowledge Base (Bitext-style E-Commerce FAQs)
# -----------------------------------------------------------------------------
CUSTOMER_SUPPORT_FAQS = [
    {
        "query": "What is your delivery timeframe and shipping charge?",
        "response": "Inside Dhaka, standard delivery takes 24 to 48 hours (delivery fee: ৳70). For deliveries outside Dhaka, it usually arrives within 3 to 5 business days via Pathao Courier (delivery fee: ৳130). Express same-day shipping is also available within central Dhaka for orders placed before 12:00 PM."
    },
    {
        "query": "Do you offer Cash on Delivery (COD)?",
        "response": "Yes! Cash on Delivery (COD) is available nationwide across all 64 districts in Bangladesh. You can inspect the package upon courier arrival and pay cash directly. We also accept bKash, Nagad, Visa, and Mastercard online payments."
    },
    {
        "query": "What is your return and exchange policy?",
        "response": "We offer a hassle-free 7-day exchange and return policy. If you encounter any sizing issue or product defect, please keep the original tags and invoice intact and initiate a return request from your account or notify us via chat. Courier pickup will be arranged within 48 hours."
    },
    {
        "query": "How can I track my active order?",
        "response": "You can track your order at any time using your Order ID and phone number on our 'Track Order' page. Once your package is handed over to our delivery partner (Pathao / Courier), you will also receive an SMS containing a live GPS tracking link."
    },
    {
        "query": "Can I cancel or modify my order after placing it?",
        "response": "Orders can be canceled or modified at any point before they enter the 'Dispatched' or 'Shipped' stage. Simply navigate to your Profile > Orders and select 'Cancel Order', or request our support team via chat with your Order ID."
    }
]

# -----------------------------------------------------------------------------
# Query Variations for Data Augmentation
# -----------------------------------------------------------------------------
IDENTIFY_PROMPTS = [
    "Can you identify what clothing item this is and provide its details?",
    "I uploaded this photo. Do you have this exact item in your store?",
    "Could you tell me the name, price, and SKU of the product in this picture?",
    "What product is shown here? Is it currently in stock?",
    "Help me find this item in your catalog and check if it's available."
]

SIZE_PROMPTS = [
    "What sizes do you currently have in stock for this item?",
    "Could you check the available sizes and stock levels for this product?",
    "I'm interested in buying this. What sizes can I choose from?",
    "Do you have this clothing item in stock, and in what sizes?"
]

PRICE_PROMPTS = [
    "How much does this item cost, and are there any active discounts?",
    "What is the final price of this product after any discount?",
    "Can you break down the price and discount for this clothing item?",
    "Is this on sale right now? How much is it?"
]

MATERIAL_PROMPTS = [
    "What material or fabric is this made of, and what are the care instructions?",
    "Can you give me the fabric details and how to wash this item?",
    "What are the specifications and fabric quality for this piece?"
]

ORDER_PROMPTS = [
    "I want to order this in size {size}. Please confirm my selection.",
    "Can you place an order for this item in size {size}?",
    "Please add 1 piece of this in size {size} to my shopping cart.",
    "I'll take this in size {size}. How do we proceed to checkout?"
]


def build_conversation(image_path: str, user_text: str, assistant_text: str, item_id: str) -> Dict[str, Any]:
    """Formats a single multi-modal QA exchange into standard Qwen2-VL chat format."""
    return {
        "id": item_id,
        "image": str(image_path).replace("\\", "/"),
        "conversations": [
            {
                "role": "user",
                "content": [
                    {"type": "image", "image": str(image_path).replace("\\", "/")},
                    {"type": "text", "text": user_text}
                ]
            },
            {
                "role": "assistant",
                "content": [
                    {"type": "text", "text": assistant_text}
                ]
            }
        ]
    }


def build_text_conversation(user_text: str, assistant_text: str, item_id: str) -> Dict[str, Any]:
    """Formats a text-only support conversation."""
    return {
        "id": item_id,
        "conversations": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": user_text}
                ]
            },
            {
                "role": "assistant",
                "content": [
                    {"type": "text", "text": assistant_text}
                ]
            }
        ]
    }


def generate_dataset() -> None:
    if not PRODUCTS_JSON_PATH.exists():
        raise FileNotFoundError(f"Missing products catalog at: {PRODUCTS_JSON_PATH}")

    print(f"📂 Loading products from {PRODUCTS_JSON_PATH}...")
    with open(PRODUCTS_JSON_PATH, "r", encoding="utf-8") as f:
        products = json.load(f)

    print(f"📦 Total products loaded: {len(products)}")

    dataset_entries: List[Dict[str, Any]] = []
    missing_image_count = 0
    valid_products_count = 0

    for idx, prod in enumerate(products):
        local_images = prod.get("localImages", [])
        if not local_images:
            continue

        # Find first valid local image
        primary_image_rel = local_images[0]
        # localImages is e.g. "images/filename.jpg"
        image_full_path = DATA_DIR / primary_image_rel

        if not image_full_path.exists():
            # Try direct inside IMAGES_DIR
            alt_path = IMAGES_DIR / Path(primary_image_rel).name
            if alt_path.exists():
                image_full_path = alt_path
            else:
                missing_image_count += 1
                continue

        valid_products_count += 1

        name = prod.get("name", "Product")
        sku = prod.get("sku", f"SKU-{idx+1}")
        category = prod.get("category", "General")
        subcategory = prod.get("subcategory", "")
        gender = prod.get("gender", "Unisex")
        price = prod.get("price", 0)
        discount = prod.get("discount", 0)
        final_price = prod.get("finalPrice", price)
        total_stock = prod.get("totalStock", 0)
        description = prod.get("description", "").strip()
        sizes = prod.get("sizes", [])

        # Sizing list representation
        in_stock_sizes = [s for s in sizes if s.get("stock", 0) > 0]
        size_summary = ", ".join([f"{s.get('sizeName', 'Std')} ({s.get('stock', 0)} in stock)" for s in sizes])
        in_stock_names = [s.get("sizeName") for s in in_stock_sizes]

        # -------------------------------------------------------------
        # 1. Product Identification & Metadata QA
        # -------------------------------------------------------------
        user_q1 = random.choice(IDENTIFY_PROMPTS)
        discount_text = f" It has an active {discount}% discount, bringing the price down to **৳{final_price:,.2f}** (Regular: ৳{price:,.2f})." if discount > 0 else f" It is priced at **৳{price:,.2f}**."
        stock_text = f"Currently, we have **{total_stock} units** in stock across available sizes: {size_summary}." if total_stock > 0 else "Currently, this item is temporarily out of stock."

        assistant_a1 = (
            f"This is our **{name}** (SKU: `{sku}`).\n"
            f"- **Category:** {category}" + (f" ({subcategory})" if subcategory else "") + f"\n"
            f"- **Target:** {gender}\n"
            f"- **Pricing:**{discount_text}\n"
            f"- **Availability:** {stock_text}\n\n"
            f"Would you like to select a size and place an order?"
        )
        dataset_entries.append(build_conversation(
            image_full_path, user_q1, assistant_a1, f"prod_{idx}_intent_identify"
        ))

        # -------------------------------------------------------------
        # 2. Sizing & Stock Availability QA
        # -------------------------------------------------------------
        user_q2 = random.choice(SIZE_PROMPTS)
        if in_stock_sizes:
            assistant_a2 = (
                f"For the **{name}** (SKU: `{sku}`), the following sizes are available in our warehouse:\n"
                f"{size_summary}\n\n"
                f"You can choose from: **{', '.join(in_stock_names)}**. Which size fits you best?"
            )
        else:
            assistant_a2 = f"I'm sorry, but all sizes for **{name}** (SKU: `{sku}`) are currently out of stock. We are restocking soon!"

        dataset_entries.append(build_conversation(
            image_full_path, user_q2, assistant_a2, f"prod_{idx}_intent_sizes"
        ))

        # -------------------------------------------------------------
        # 3. Pricing & Discounts QA
        # -------------------------------------------------------------
        user_q3 = random.choice(PRICE_PROMPTS)
        if discount > 0:
            assistant_a3 = (
                f"Yes, this item is currently on sale! 🎉\n"
                f"- **Regular Price:** ৳{price:,.2f}\n"
                f"- **Discount:** {discount}% OFF\n"
                f"- **Current Sale Price:** ৳{final_price:,.2f}\n"
                f"You save **৳{(price - final_price):,.2f}** per unit. Would you like to proceed with an order?"
            )
        else:
            assistant_a3 = (
                f"The price for **{name}** (SKU: `{sku}`) is **৳{price:,.2f}** (Inclusive of all applicable VAT). There is currently no active promotional discount on this item."
            )

        dataset_entries.append(build_conversation(
            image_full_path, user_q3, assistant_a3, f"prod_{idx}_intent_price"
        ))

        # -------------------------------------------------------------
        # 4. Conversational Ordering & Cart Intent (With Structured Payload)
        # -------------------------------------------------------------
        if in_stock_sizes:
            target_size_obj = random.choice(in_stock_sizes)
            target_size = target_size_obj.get("sizeName", "M")
            user_q4 = random.choice(ORDER_PROMPTS).format(size=target_size)

            order_payload = {
                "action": "ADD_TO_CART",
                "sku": sku,
                "product_name": name,
                "size": target_size,
                "quantity": 1,
                "unit_price": final_price,
                "total_price": final_price,
                "currency": "BDT"
            }

            assistant_a4 = (
                f"I have prepared your order for **{name}** in size **{target_size}**! 🛒\n\n"
                f"- **SKU:** `{sku}`\n"
                f"- **Selected Size:** {target_size}\n"
                f"- **Quantity:** 1\n"
                f"- **Total Amount:** ৳{final_price:,.2f}\n\n"
                f"Here is your confirmation payload:\n"
                f"```json\n{json.dumps(order_payload, indent=2)}\n```\n\n"
                f"Click 'Proceed to Checkout' to complete your shipping and payment details!"
            )
            dataset_entries.append(build_conversation(
                image_full_path, user_q4, assistant_a4, f"prod_{idx}_intent_order_{target_size}"
            ))

        # -------------------------------------------------------------
        # 5. Material & Wash Care QA (if description has details)
        # -------------------------------------------------------------
        if description and len(description) > 30:
            user_q5 = random.choice(MATERIAL_PROMPTS)
            assistant_a5 = (
                f"Here are the product specifications and care details for **{name}**:\n\n"
                f"{description}\n\n"
                f"Let me know if you need any styling tips or size guidance!"
            )
            dataset_entries.append(build_conversation(
                image_full_path, user_q5, assistant_a5, f"prod_{idx}_intent_material"
            ))

    # -----------------------------------------------------------------
    # 6. Add Bitext-style Customer Support Conversations (Augmented)
    # -----------------------------------------------------------------
    for faq_idx, faq in enumerate(CUSTOMER_SUPPORT_FAQS):
        # Repeat with slight variations for balanced text-only handling
        dataset_entries.append(build_text_conversation(
            faq["query"], faq["response"], f"faq_{faq_idx}_base"
        ))

    # Shuffle dataset
    random.shuffle(dataset_entries)

    # 85% Train / 15% Validation Split
    split_index = int(len(dataset_entries) * 0.85)
    train_data = dataset_entries[:split_index]
    val_data = dataset_entries[split_index:]

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    train_path = OUTPUT_DIR / "vlm_train.json"
    val_path = OUTPUT_DIR / "vlm_val.json"

    with open(train_path, "w", encoding="utf-8") as f:
        json.dump(train_data, f, indent=2, ensure_ascii=False)

    with open(val_path, "w", encoding="utf-8") as f:
        json.dump(val_data, f, indent=2, ensure_ascii=False)

    print(f"\n✨ Dataset Generation Complete!")
    print(f"📊 Statistics:")
    print(f"   - Valid Products Processed: {valid_products_count}")
    print(f"   - Missing/Skipped Images: {missing_image_count}")
    print(f"   - Total QA Pairs Created: {len(dataset_entries)}")
    print(f"   - Training Set: {len(train_data)} entries -> {train_path}")
    print(f"   - Validation Set: {len(val_data)} entries -> {val_path}")


if __name__ == "__main__":
    generate_dataset()
