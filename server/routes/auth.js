import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import connectDB from "../config/db.js"; // Add this import

const router = express.Router();

// Middleware to ensure DB connection for auth routes
const ensureDB = async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error("Database connection error in auth:", error);
    res.status(500).json({ 
      message: "Error de conexión con la base de datos" 
    });
  }
};

// Apply DB connection middleware to all auth routes
router.use(ensureDB);

router.post("/register", async (req, res) => {
  try {
    const { username, password, name, role, tiendaId, tiendaName } = req.body;

    // Validation
    if (!username || !password || !name) {
      return res.status(400).json({ 
        message: "Username, password y nombre son obligatorios" 
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: "El usuario ya existe" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user WITH ALL REQUIRED FIELDS
    const user = new User({
      username,
      password: hashedPassword,
      name,  // ← THIS WAS MISSING
      role: role || "user",
      tiendaId: tiendaId || null,
      tiendaName: tiendaName || "",
      permissions: {
        administrador: role === "admin",
        tienda: false
      }
    });

    await user.save();

    // Create token
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "Usuario registrado exitosamente",
      token,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        role: user.role
      }
    });

  } catch (err) {
    console.error("Registration error:", err);
    
    // More specific error responses
    if (err.name === 'ValidationError') {
      return res.status(400).json({ 
        message: "Datos de usuario inválidos",
        details: err.errors 
      });
    }
    
    res.status(500).json({ 
      message: "Error en el servidor",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined 
    });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Basic validation
    if (!username || !password) {
      return res.status(400).json({ 
        message: "Username y password son obligatorios" 
      });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    // Create JWT token
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      message: "Login exitoso",
      token,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        role: user.role,
        tiendaId: user.tiendaId,
        tiendaName: user.tiendaName,
        permissions: user.permissions
      }
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ 
      message: "Error en el servidor",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined 
    });
  }
});

// Optional: Add token validation endpoint
router.post("/validate", async (req, res) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    
    if (!token) {
      return res.status(401).json({ valid: false, message: "Token no proporcionado" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user still exists
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ valid: false, message: "Usuario no encontrado" });
    }

    res.json({
      valid: true,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        role: user.role
      }
    });

  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ valid: false, message: "Token inválido o expirado" });
    }
    
    console.error("Token validation error:", err);
    res.status(500).json({ 
      valid: false, 
      message: "Error validando token" 
    });
  }
});

export default router;