import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.js";

const app = express();

// middlewares
app.use(cors());
app.use(express.json());

// connect DB
connectDB();

// routes
app.use("/api", authRoutes);

app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});

