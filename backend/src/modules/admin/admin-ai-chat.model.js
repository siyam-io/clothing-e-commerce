import mongoose from "mongoose";

const adminAiSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: "New Chat",
      trim: true,
    },
    lastMessage: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

adminAiSessionSchema.index({ user: 1, updatedAt: -1 });

const adminAiMessageSchema = new mongoose.Schema(
  {
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminAiSession",
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ["user", "model"],
      required: true,
    },
    content: {
      type: String,
      default: "",
    },
    image: {
      type: String,
      default: null,
    },
    toolExecutions: {
      type: mongoose.Schema.Types.Mixed,
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

adminAiMessageSchema.index({ session: 1, createdAt: 1 });
adminAiMessageSchema.index({ user: 1, createdAt: 1 });

export const AdminAiSession = mongoose.model("AdminAiSession", adminAiSessionSchema);
export const AdminAiMessage = mongoose.model("AdminAiMessage", adminAiMessageSchema);
export default AdminAiMessage;
