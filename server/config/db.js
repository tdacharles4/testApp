import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

// MongoDB connection cached for serverless
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  // Return cached connection if available and healthy
  if (cached.conn && mongoose.connection.readyState === 1) {
    console.log("✅ Using cached MongoDB connection");
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10, // Limit connections for serverless
      serverSelectionTimeoutMS: 5000, // Timeout after 5s
      socketTimeoutMS: 45000, // Close sockets after 45s inactivity
      maxIdleTimeMS: 10000 // Close idle connections after 10s
    };

    const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI;
    
    if (!mongoURI) {
      throw new Error("Please define MONGO_URI or MONGODB_URI environment variable");
    }

    console.log("🌐 Creating new MongoDB connection...");
    cached.promise = mongoose.connect(mongoURI, opts).then((mongoose) => {
      console.log("✅ MongoDB Atlas Connected (Serverless)");
      return mongoose;
    }).catch((error) => {
      console.error("❌ MongoDB connection failed:", error.message);
      cached.promise = null;
      throw error;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

// Admin creation function - call manually if needed
async function createAdminIfNeeded() {
  try {
    // Only run if explicitly enabled
    if (process.env.CREATE_DEFAULT_ADMIN !== "true") {
      console.log("⏭️ Skipping admin creation (not enabled)");
      return;
    }
    
    await connectDB();
    
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminExists = await User.findOne({ username: adminUsername });
    
    if (!adminExists) {
      const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
      const hashed = await bcrypt.hash(adminPassword, 10);
      
      await User.create({
        username: adminUsername,
        password: hashed,
        name: process.env.ADMIN_NAME || 'Administrador',
        role: 'admin',
        permissions: {
          administrador: true,
          tienda: true
        }
      });
      console.log(`👑 Admin user created: ${adminUsername}`);
    } else {
      console.log(`👑 Admin user already exists: ${adminUsername}`);
    }
  } catch (error) {
    console.error("Admin creation error:", error.message);
    // Don't throw error, just log it
  }
}

// Export both functions
export { connectDB, createAdminIfNeeded };

// Default export is connectDB for backward compatibility
export default connectDB;