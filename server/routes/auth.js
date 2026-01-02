import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();

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
    res.status(500).json({ message: "Error en el servidor" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: "Usuario no encontrado" });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: "Contraseña incorrecta" });
    }

    // --- CREATE JWT TOKEN ---
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
      token,   // IMPORTANT
      user: {
        id: user._id,
        username: user.username,
        role: user.role
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error en el servidor" });
  }
});

export default router;