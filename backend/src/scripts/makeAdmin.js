import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../modules/user/user.model.js";
import Role from "../modules/role/role.model.js";

dotenv.config();

const upgradeToAdmin = async (email) => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB...");

    // 1. Find the SuperAdmin role
    const superAdminRole = await Role.findOne({ name: "superadmin" });
    if (!superAdminRole) {
      console.log(" SuperAdmin role not found. Please run seedRoles.js first.");
      process.exit(1);
    }

    // 2. Find and update the user
    const user = await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      { role: superAdminRole._id },
      { new: true }
    );

    if (!user) {
      console.log(` User with email ${email} not found.`);
    } else {
      console.log(` Successfully upgraded ${email} to SuperAdmin!`);
    }

    process.exit();
  } catch (error) {
    console.error(" Error:", error);
    process.exit(1);
  }
};

// Replace with your email
const emailToUpgrade = "nayeemlisan@gmail.com"; 
upgradeToAdmin(emailToUpgrade);
