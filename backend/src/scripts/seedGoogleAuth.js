import mongoose from "mongoose";
import dotenv from "dotenv";
import ApiKey from "../modules/settings/apiKey.model.js";
import { encrypt } from "../utils/encryption.js";

dotenv.config();

const clientId = process.env.GOOGLE_CLIENT_ID || "";
const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";

const run = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/clothing-ecommerce";
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB...");

    let apiKeys = await ApiKey.findOne();
    if (!apiKeys) {
      apiKeys = new ApiKey();
    }

    apiKeys.googleClientId = clientId;
    apiKeys.googleClientSecret = encrypt(clientSecret);
    await apiKeys.save();

    console.log(" Google OAuth Credentials configured successfully!");
    console.log("Client ID:", apiKeys.googleClientId);
    console.log("Client Secret: [Encrypted & Saved]");

    process.exit(0);
  } catch (error) {
    console.error(" Error configuring Google OAuth:", error);
    process.exit(1);
  }
};

run();

