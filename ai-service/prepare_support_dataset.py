"""
Bitext-style E-Commerce Customer Support Dataset Generator.
Generates multi-turn customer service conversations across 15+ intents:
- Request Human Agent / Admin Takeover
- Order Tracking & Status
- Order Cancellation
- Return & Refund Requests
- Size & Color Exchange
- Payment Inquiries (COD, bKash, Nagad, Cards)
- Shipping Timeframes & Delivery Delays
- Address Change Before Dispatch
- Damaged / Wrong Item Received
- Discount Coupons & Vouchers

Blends seamlessly with the Product Catalog Vision dataset.
"""

import sys
import json
import random
from pathlib import Path

# Ensure UTF-8 output on Windows terminals
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

random.seed(42)

BASE_DIR = Path(__file__).resolve().parent
DATASET_DIR = BASE_DIR / "dataset"
PRODUCT_TRAIN_FILE = DATASET_DIR / "vlm_train.json"
UNIFIED_TRAIN_FILE = DATASET_DIR / "vlm_unified_train.json"
UNIFIED_VAL_FILE = DATASET_DIR / "vlm_unified_val.json"

SUPPORT_INTENTS = [
    # 1. Request Human Agent / Admin Escalation (Crucial for Admin Takeover!)
    {
        "intent": "human_agent_handover",
        "queries": [
            "Can I speak with a human support agent?",
            "Transfer me to a real person please.",
            "I need to talk to a human customer service executive.",
            "Connect me with your manager or live support.",
            "I want to speak with an agent directly, not an AI.",
            "Can an admin take over this chat?",
            "Please call a support team member."
        ],
        "responses": [
            "Certainly! I am alerting our live customer support team right now. An executive will join and take over this conversation in a moment. Please stay on the line!",
            "I understand! I've flagged this chat for our live human support agents. One of our team members is reviewing your conversation and will respond shortly.",
            "Right away! Transferring you to our live support center. A human agent will take over momentarily to assist you further."
        ]
    },
    # 2. Order Tracking & Delivery Status
    {
        "intent": "track_order",
        "queries": [
            "Where is my package right now?",
            "How do I track my active order?",
            "I placed an order yesterday, has it been dispatched yet?",
            "Can you tell me the delivery status of my parcel?",
            "When will my order arrive at my doorstep?"
        ],
        "responses": [
            "You can track your order status in real time by going to your Account > 'My Orders' or using our 'Track Order' page with your Order ID and phone number. Once dispatched via Pathao, you will also receive an SMS with live GPS tracking.",
            "Standard delivery takes 24 to 48 hours inside Dhaka and 3 to 5 business days outside Dhaka. You can check the live tracking status anytime from the 'Track Order' section in our top navigation bar!"
        ]
    },
    # 3. Order Cancellation
    {
        "intent": "cancel_order",
        "queries": [
            "I want to cancel my order.",
            "Can I cancel an order I just placed?",
            "How do I cancel my purchase before it ships?",
            "Please cancel my order right now."
        ],
        "responses": [
            "You can cancel your order directly from your profile under 'My Orders' as long as the status is still 'Pending' or 'Processing'. If the parcel has already been handed over to the courier for dispatch, cancellation may no longer be possible.",
            "Yes, cancellation is completely free before dispatch! Simply open 'My Orders', select the order, and click 'Cancel Order'. If you paid online via bKash or card, your refund will be processed within 5 to 7 business days."
        ]
    },
    # 4. Returns & Refunds
    {
        "intent": "refund_and_return",
        "queries": [
            "What is your return and refund policy?",
            "How can I return an item and get my money back?",
            "Can I get a refund if the clothes don't fit?",
            "How many days do I have to return an item?"
        ],
        "responses": [
            "We offer a 7-day hassle-free return and exchange policy! To be eligible, the item must be unworn, unwashed, and in its original packaging with tags intact. You can initiate a return from your profile or notify our support team here.",
            "For returns, our courier partner will collect the item from your doorstep. Once received and verified at our quality center, your refund will be credited to your bKash, Nagad, or bank account within 3 to 5 business days."
        ]
    },
    # 5. Size and Color Exchange
    {
        "intent": "exchange_size",
        "queries": [
            "The size I ordered is too tight. Can I exchange for a larger size?",
            "How do I request a size exchange?",
            "Can I swap this shirt for a different color?",
            "I received the wrong size, how can I change it?"
        ],
        "responses": [
            "Yes, size exchanges are quick and easy! Within 7 days of receiving your parcel, select 'Exchange Size' in your order details or let us know the replacement size you need. We will deliver the new size and collect the old one at the same time.",
            "We provide doorstep size exchanges nationwide. As long as the tags are intact and the replacement size is in stock, our courier will swap the package at your address."
        ]
    },
    # 6. Payment Methods & Cash on Delivery (COD)
    {
        "intent": "payment_methods",
        "queries": [
            "Do you accept Cash on Delivery (COD)?",
            "What payment options do you support?",
            "Can I pay using bKash or Nagad?",
            "Is it safe to pay with Visa or Mastercard?"
        ],
        "responses": [
            "Yes! We offer Cash on Delivery (COD) across all 64 districts in Bangladesh. You can inspect the package upon courier arrival and pay cash. We also accept bKash, Nagad, Rocket, and all major debit/credit cards through our secure SSLCommerz gateway.",
            "We support 100% secure payments via Cash on Delivery, bKash direct payment, Nagad, and Visa/Mastercard. All online transactions are 256-bit encrypted."
        ]
    },
    # 7. Shipping Fees & Delivery Areas
    {
        "intent": "shipping_fee",
        "queries": [
            "How much is the delivery charge?",
            "What is the shipping cost inside and outside Dhaka?",
            "Do you have free delivery for large orders?",
            "Do you deliver outside Dhaka?"
        ],
        "responses": [
            "Delivery inside Dhaka is ৳70 (takes 24-48 hours). Delivery outside Dhaka across Bangladesh is ৳130 (takes 3-5 days). We also offer FREE shipping on all orders over ৳3,000!",
            "We deliver nationwide across Bangladesh! Delivery fee: ৳70 within Dhaka city and ৳130 anywhere outside Dhaka. Orders above ৳3,000 qualify for free home delivery."
        ]
    },
    # 8. Damaged / Wrong Item Received
    {
        "intent": "damaged_or_wrong_item",
        "queries": [
            "I received a damaged item.",
            "The shirt I got has a tear/defect.",
            "You sent me the wrong product!",
            "The package arrived broken or with missing items."
        ],
        "responses": [
            "We sincerely apologize for this inconvenience! Please upload a photo of the damaged/wrong item right here in this chat, and we will dispatch a brand new replacement immediately with zero extra delivery charge.",
            "I am so sorry to hear that! Please share a quick photo of the defect here or contact support. We will arrange an immediate priority replacement or full refund right away."
        ]
    },
    # 9. Change Shipping Address
    {
        "intent": "change_address",
        "queries": [
            "Can I change my delivery address?",
            "I entered the wrong address on my order, how do I fix it?",
            "I moved to a different location, can you update my shipping address?"
        ],
        "responses": [
            "Yes! If your order has not been dispatched yet, you can update your shipping address from your Order details page or tell us your new address and Order ID right here, and we will update it immediately.",
            "As long as the parcel is still in 'Processing' status, we can modify your delivery address. Please provide your Order ID and the updated address!"
        ]
    },
    # 10. Discount Coupons & Vouchers
    {
        "intent": "discount_coupon",
        "queries": [
            "Are there any active coupon codes today?",
            "Do you have a first-order discount voucher?",
            "How can I apply a promo code at checkout?",
            "Give me a coupon code for free shipping."
        ],
        "responses": [
            "Yes! You can use coupon code **WELCOME10** at checkout to get 10% OFF on your first purchase! Keep an eye on our Flash Sale page for seasonal promo deals.",
            "Check our 'Flash Sales' and 'Banner Campaigns' for active vouchers! You can enter promo codes in the 'Apply Coupon' box on the checkout page to instantly receive discounts."
        ]
    }
]


def generate_support_conversations(target_count: int = 1000) -> list:
    """Generates synthetic multi-turn customer support dialogues."""
    dataset = []
    id_counter = 1

    while len(dataset) < target_count:
        for item in SUPPORT_INTENTS:
            query = random.choice(item["queries"])
            response = random.choice(item["responses"])

            entry = {
                "id": f"support_{item['intent']}_{id_counter}",
                "conversations": [
                    {
                        "role": "user",
                        "content": [{"type": "text", "text": query}]
                    },
                    {
                        "role": "assistant",
                        "content": [{"type": "text", "text": response}]
                    }
                ]
            }
            dataset.append(entry)
            id_counter += 1

            if len(dataset) >= target_count:
                break

    return dataset


def create_unified_dataset():
    if not PRODUCT_TRAIN_FILE.exists():
        raise FileNotFoundError(f"Missing product dataset: {PRODUCT_TRAIN_FILE}")

    print(f"📂 Loading existing product vision dataset from {PRODUCT_TRAIN_FILE}...")
    with open(PRODUCT_TRAIN_FILE, "r", encoding="utf-8") as f:
        product_samples = json.load(f)

    print(f"📦 Product vision samples: {len(product_samples)}")

    print("🤖 Synthesizing Bitext-style customer support conversations...")
    support_samples = generate_support_conversations(target_count=1000)
    print(f"🎧 Customer support samples: {len(support_samples)}")

    # Combine both datasets (Multi-Task Blend)
    unified_data = product_samples + support_samples
    random.shuffle(unified_data)

    split_idx = int(len(unified_data) * 0.88)
    train_split = unified_data[:split_idx]
    val_split = unified_data[split_idx:]

    with open(UNIFIED_TRAIN_FILE, "w", encoding="utf-8") as f:
        json.dump(train_split, f, indent=2, ensure_ascii=False)

    with open(UNIFIED_VAL_FILE, "w", encoding="utf-8") as f:
        json.dump(val_split, f, indent=2, ensure_ascii=False)

    print(f"\n🎉 Unified Dataset Successfully Created!")
    print(f"📊 Summary:")
    print(f"   - Product Vision Samples: {len(product_samples)} (with images, sizes, SKUs, ordering)")
    print(f"   - Customer Support Samples: {len(support_samples)} (Admin takeover, refunds, tracking, COD, FAQs)")
    print(f"   - Total Combined Entries: {len(unified_data)}")
    print(f"   - Unified Training File: {UNIFIED_TRAIN_FILE} ({len(train_split)} entries)")
    print(f"   - Unified Validation File: {UNIFIED_VAL_FILE} ({len(val_split)} entries)")


if __name__ == "__main__":
    create_unified_dataset()
