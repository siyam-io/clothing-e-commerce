import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, select: false }, // Optional for social auth
  avatar: { type: String, default: "" },
  role: { type: mongoose.Schema.Types.ObjectId, ref: "Role" },
  phone: { type: String, default: "" },
  bio: { type: String, default: "" },
  addresses: { type: Array, default: [] },
  isEmailVerified: { type: Boolean, default: false },
  emailVerificationToken: { type: String, select: false },
  passwordResetToken: { type: String, select: false },
  passwordResetExpires: { type: Date, select: false },
  provider: { 
    type: String, 
    enum: ["custom", "google", "facebook"], 
    default: "custom" 
  },
  googleId: { type: String, default: "" },
  facebookId: { type: String, default: "" },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

userSchema.index({ createdAt: -1 });
userSchema.index({ name: 1 });


// Async pre-save hook for password hashing
userSchema.pre("save", async function() {
  if (!this.password || !this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.models.User || mongoose.model("User", userSchema);