import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

// MongoDB connection cached for serverless
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    const mongoURI = process.env.MONGO_URI;
    
    if (!mongoURI) {
      throw new Error("Please define MONGO_URI environment variable");
    }

    cached.promise = mongoose.connect(mongoURI, opts).then((mongoose) => {
      console.log("✅ MongoDB Atlas Connected (Serverless)");
      return mongoose;
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

// Admin creation (run once)
async function createAdminIfNeeded() {
  try {
    // Only create admin in production if explicitly enabled
    const shouldCreateAdmin = process.env.NODE_ENV === "development" || 
                             process.env.CREATE_DEFAULT_ADMIN === "true";
    
    if (shouldCreateAdmin) {
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
      }
    }
  } catch (error) {
    console.error("Admin creation error:", error.message);
  }
}

// Call on cold start
connectDB().then(() => {
  createAdminIfNeeded();
}).catch(console.error);

export default connectDB;