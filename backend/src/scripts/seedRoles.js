import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "dns";
import path from "path";
import { fileURLToPath } from "url";
import Role from "../modules/role/role.model.js";

// Windows DNS override for MongoDB Atlas SRV lookup
try {
  dns.setServers(["8.8.8.8", "8.8.4.4"]);
} catch (e) {
  // ignore
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config();

const roles = [
  {
    name: "superadmin",
    description: "Has full access to all system modules and actions.",
    permissions: ["all"],
    isEditable: false,
  },
  {
    name: "admin",
    description: "Full access to dashboard, products, and orders.",
    permissions: [
      "dashboard:view",
      "products:view", "products:create", "products:update", "products:delete",
      "orders:view", "orders:update",
      "users:view", "users:update",
      "categories:view", "categories:manage",
      "ai-chat:view",
      "audit:view",
      "settings:view"
    ],
  },
  {
    name: "customer",
    description: "Standard customer role with no admin access.",
    permissions: [],
    isSystem: true,
    isEditable: false
  }
];

const seedRoles = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for seeding...");

    for (const roleData of roles) {
      await Role.findOneAndUpdate(
        { name: roleData.name },
        roleData,
        { upsert: true, new: true }
      );
      console.log(` Seeded role: ${roleData.name}`);
    }

    console.log(" All roles seeded successfully!");
    process.exit();
  } catch (error) {
    console.error(" Seeding failed:", error);
    process.exit(1);
  }
};

seedRoles();
