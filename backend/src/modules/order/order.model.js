import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: false,
  },
  name: { type: String, required: true }, 
  size: { type: mongoose.Schema.Types.ObjectId, ref: "Size", required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  image: String,
});

const orderSchema = new mongoose.Schema(
  {
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: false,
      index: true,
    },
    isGuest: { 
      type: Boolean, 
      default: false 
    },
    guestId: {
      type: String,
      required: false,
      index: true
    },
    orderItems: [orderItemSchema],
    shippingAddress: {
      name: { type: String, required: true }, 
      email: { type: String, required: false },
      phone: { type: String, required: true },
      address: { type: String, required: true }, // Single line address
    },
    paymentMethod: { type: String, required: true },
    paymentResult: {
      transactionId: String,
      val_id: String,
      bkashPaymentID: String,
      status: {
        type: String,
        enum: ["Pending", "Completed", "Failed", "Cancelled", "COD"],
        default: "Pending",
      },
    },
    itemsPrice: { type: Number, default: 0 },
    shippingPrice: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    totalPrice: { type: Number, required: true },
    couponCode: String,
    orderStatus: {
      type: String,
      enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"],
      default: "Pending",
    },
    pathaoConsignmentId: String,
    pathaoStatus: { type: String, default: "Not Synced" },
    isDirectBuy: { type: Boolean, default: false },
    note: { type: String, default: "" },
  },
  { timestamps: true },
);

// Index for sorted retrieval and payment status queries
orderSchema.index({ createdAt: -1 });
orderSchema.index({ "paymentResult.status": 1, createdAt: -1 });

export default mongoose.models.Order || mongoose.model("Order", orderSchema);