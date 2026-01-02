import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.js";
import tiendaRoutes from "./routes/tiendaRoutes.js";
import ventaRoutes from "./routes/ventaRoutes.js";
import salidaRoutes from "./routes/salidaRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import corteRoutes from "./routes/corteRoutes.js";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose"; // Add this import

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === "production" 
    ? [
        process.env.CLIENT_URL || "https://your-frontend.vercel.app",
        "http://localhost:3000"
      ]
    : "http://localhost:3000",
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", authRoutes);
app.use("/api/tiendas", tiendaRoutes);
app.use("/api/ventas", ventaRoutes);
app.use("/api/salidas", salidaRoutes);
app.use('/api/users', userRoutes);
app.use('/api/cortes', corteRoutes);

app.use("/uploads", (req, res) => {
  res.status(501).json({ 
    error: "File uploads not available on Vercel", 
    message: "Use cloud storage like Cloudinary or AWS S3 for production" 
  });
});

// Health check endpoint (required for Vercel)
app.get("/api/health", async (req, res) => {
  try {
    // Try to connect to DB if not already connected
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
      environment: process.env.NODE_ENV || "development"
    });
  } catch (error) {
    res.status(500).json({ 
      status: "error", 
      timestamp: new Date().toISOString(),
      database: "connection failed",
      error: error.message,
      environment: process.env.NODE_ENV || "development"
    });
  }
});

if (process.env.NODE_ENV === "production") {
  try {
    // Only serve static files if the build directory exists
    const frontendPath = path.join(__dirname, "../client/dist");
    app.use(express.static(frontendPath));
    
    app.get("*", (req, res) => {
      res.sendFile(path.join(frontendPath, "index.html"));
    });
  } catch (error) {
    console.warn("Frontend build not found, API only mode");
  }
}

export default app;