import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.js";
import tiendaRoutes from "./routes/tiendaRoutes.js";

const app = express();

// middlewares
app.use(cors());
app.use(express.json());

// connect DB
connectDB();

// routes
app.use("/api", authRoutes);
app.use("/api/tiendas", tiendaRoutes);

app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});

