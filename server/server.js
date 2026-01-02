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

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to DB
connectDB();

// Routes
app.use("/api", authRoutes);
app.use("/api/tiendas", tiendaRoutes);
app.use("/api/ventas", ventaRoutes);
app.use("/api/salidas", salidaRoutes);
app.use('/api/users', userRoutes);
app.use('/api/cortes', corteRoutes);

// Serve uploads statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Health check endpoint (required for Vercel)
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected"
  });
});

// Serve frontend if you have it in the same project
// If not, you can remove or modify this
if (process.env.NODE_ENV === "production") {
  // Serve static frontend files
  app.use(express.static(path.join(__dirname, "../client/dist")));
  
  // Handle SPA routing
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../client/dist/index.html"));
  });
}

// Use Vercel's port or default to 5000
const PORT = process.env.PORT || 5000;

// Only listen locally (not on Vercel)
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// Export for Vercel serverless
export default app;