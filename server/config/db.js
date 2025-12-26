import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

const connectDB = async () => {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/testApp");
    console.log("MongoDB Connected");

    // Optional: Clean up invalid admin user first
    try {
      const invalidAdmin = await User.findOne({ 
        username: "admin", 
        name: { $exists: false } 
      });
      
      if (invalidAdmin) {
        await User.deleteOne({ _id: invalidAdmin._id });
        console.log("Removed invalid admin user (missing name)");
      }
    } catch (cleanupError) {
      console.log("Cleanup not needed or failed:", cleanupError.message);
    }

    // Create admin only if not exists
    const exists = await User.findOne({ username: "admin" });

    if (!exists) {
      const hashed = await bcrypt.hash("admin", 10);
      await User.create({
        username: "admin",
        password: hashed,
        name: "Administrador", // REQUIRED FIELD
        role: "admin",
        permissions: {
          administrador: true,
          tienda: true
        }
      });
      console.log("Admin user created with username: 'admin', password: 'admin'");
    } else {
      console.log("Admin user already exists");
    }

  } catch (error) {
    console.error("DB Connection Error:", error);
    process.exit(1);
  }
};

export default connectDB;