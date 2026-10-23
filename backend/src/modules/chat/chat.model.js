import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  conversationId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Conversation", 
    required: true,
    index: true // 🚀 Fast lookup for history
  },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
  senderName: { type: String, default: "User" },
  isAi: { type: Boolean, default: false },
  actionPayload: { type: mongoose.Schema.Types.Mixed },
  matchedProducts: { type: mongoose.Schema.Types.Mixed },
  text: { type: String },
  image: { type: String },
  isRead: { type: Boolean, default: false },
  isEdited: { type: Boolean, default: false },
}, { timestamps: true });

// 🚀 Compound index for super-fast sorted retrieval
messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ conversationId: 1, isRead: 1 });
messageSchema.index({ isRead: 1, sender: 1 });

const conversationSchema = new mongoose.Schema({
  participants: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User",
    index: true 
  }],
  lastMessage: {
    text: String,
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    senderName: String,
    createdAt: Date
  },
  status: { type: String, enum: ["open", "closed"], default: "open" },
  type: { type: String, enum: ["support", "direct"], default: "support" },
  mode: { type: String, enum: ["ai", "agent"], default: "ai" },
  isHandedOver: { type: Boolean, default: false }
}, { timestamps: true });

// Indexing for performance
conversationSchema.index({ "lastMessage.createdAt": -1 });

export const Message = mongoose.model("Message", messageSchema);
export const Conversation = mongoose.model("Conversation", conversationSchema);