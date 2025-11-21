import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

const connectDB = async () => {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/testApp"); // o tu URI
    console.log("MongoDB Connected");

    // Create admin only if not exists
    const exists = await User.findOne({ username: "admin" });

    if (!exists) {
      const hashed = await bcrypt.hash("admin", 10);
      await User.create({
        username: "admin",
        password: hashed
      });
      console.log("Admin user created");
    }

  } catch (error) {
    console.error("DB Connection Error:", error);
    process.exit(1);
  }
};

export default connectDB;