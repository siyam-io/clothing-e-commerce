import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
      index: true,
    },
    userName: {
      type: String,
      trim: true,
      default: "System",
    },
    userEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    userRole: {
      type: String,
      trim: true,
      default: "admin",
    },
    action: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      enum: [
        "CREATE",
        "UPDATE",
        "DELETE",
        "STATUS_CHANGE",
        "DISPATCH",
        "LOGIN",
        "LOGOUT",
        "CONFIG_UPDATE",
        "BULK_ACTION",
        "REFUND",
        "CANCEL",
        "EXPORT",
        "SYSTEM",
      ],
      index: true,
    },
    module: {
      type: String,
      required: true,
      trim: true,
      enum: [
        "Order",
        "Product",
        "Category",
        "Subcategory",
        "Settings",
        "User",
        "Role",
        "Coupon",
        "FlashSale",
        "Banner",
        "Blog",
        "Auth",
        "Chat",
        "System",
      ],
      index: true,
    },
    resourceId: {
      type: String,
      trim: true,
      index: true,
    },
    resourceName: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    status: {
      type: String,
      enum: ["SUCCESS", "FAILED", "WARNING"],
      default: "SUCCESS",
      index: true,
    },
    ipAddress: {
      type: String,
      trim: true,
      default: "127.0.0.1",
    },
    userAgent: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for performant query filtering and sorting
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ module: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ status: 1, createdAt: -1 });

const AuditLog = mongoose.model("AuditLog", auditLogSchema);
export default AuditLog;

