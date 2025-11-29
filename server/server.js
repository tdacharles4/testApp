import express from "express";
import cors from "cors";

import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.js";
import tiendaRoutes from "./routes/tiendaRoutes.js";
import ventaRoutes from "./routes/ventaRoutes.js";
import salidaRoutes from "./routes/salidaRoutes.js";


import path from "path";
import { fileURLToPath } from "url";

import dotenv from "dotenv";

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// middlewares
app.use(cors());
app.use(express.json());

// connect DB
connectDB();

// routes
app.use("/api", authRoutes);
app.use("/api/tiendas", tiendaRoutes);
app.use("/api/ventas", ventaRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/salidas", salidaRoutes);

app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});

