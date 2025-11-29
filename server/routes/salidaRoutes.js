import express from "express";
import Salida from "../models/Salidas.js";
import requireAuth from "../middleware/requireAuth.js";

const router = express.Router();

// Helper function to generate salida ID
const generateSalidaId = async () => {
  const count = await Salida.countDocuments();
  return `OUT${(count + 1).toString().padStart(3, '0')}`;
};

// Get all exits
router.get("/", async (req, res) => {
  try {
    const salidas = await Salida.find().populate("user", "name username").sort({ fecha: -1 });
    res.json(salidas);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new exit
router.post("/crear", requireAuth, async (req, res) => {
  try {
    const { monto, concepto, pago, fecha } = req.body;

    const salidaId = await generateSalidaId();

    const salida = new Salida({
      salidaId,
      monto,
      concepto,
      pago,
      fecha,
      user: req.user._id
    });

    await salida.save();
    await salida.populate("user", "name username");

    res.status(201).json({
      success: true,
      salida,
      message: "Salida registrada exitosamente"
    });
  } catch (error) {
    console.error("Error creating exit:", error);
    res.status(500).json({ message: error.message });
  }
});

// Delete exit
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const salida = await Salida.findById(req.params.id);
    
    if (!salida) {
      return res.status(404).json({ message: "Salida no encontrada" });
    }

    await Salida.findByIdAndDelete(req.params.id);
    res.json({ message: "Salida eliminada exitosamente" });
  } catch (error) {
    console.error("Error deleting exit:", error);
    res.status(500).json({ message: "Error al eliminar la salida" });
  }
});

export default router;