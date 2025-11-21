import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // 1. Check if user exists
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({ message: "Usuario no encontrado" });
    }

    // 2. Compare hashed password
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ message: "Contraseña incorrecta" });
    }

    // 3. Login successful — return user
    return res.json({
      message: "Login exitoso",
      user: {
        id: user._id,
        username: user.username
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error en el servidor" });
  }
});

export default router;