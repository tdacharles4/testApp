import express from "express";
import Venta from "../models/Ventas.js";
import requireAuth from "../middleware/requireAuth.js";

const router = express.Router();

// Get all sales
router.get("/", async (req, res) => {
  try {
    const ventas = await Venta.find().populate("user", "name username email");
    res.json(ventas);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new sale
router.post("/crear", requireAuth, async (req, res) => {
  try {
    const { store, item, amount, originalPrice, discountAmount, discountPercentage, discountType, date, amountEfectivo, amountTarjeta, amountTransferencia } = req.body;

    const venta = new Venta({
      store,
      item,
      user: req.user._id,
      amount,
      originalPrice: originalPrice || amount,
      discountAmount: discountAmount || 0,
      discountPercentage: discountPercentage || 0,
      discountType: discountType || "none",
      amountEfectivo: amountEfectivo || 0,
      amountTarjeta: amountTarjeta || 0,
      amountTransferencia: amountTransferencia || 0,
      date: date || new Date().toLocaleDateString("es-MX")
    });

    await venta.save();
    
    // Populate user data in the response
    await venta.populate("user", "name username email");
    
    res.status(201).json(venta);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete sale
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const venta = await Venta.findById(req.params.id);
    
    if (!venta) {
      return res.status(404).json({ message: "Venta no encontrada" });
    }

    await Venta.findByIdAndDelete(req.params.id);
    res.json({ message: "Venta eliminada exitosamente" });
  } catch (error) {
    console.error("Error deleting sale:", error);
    res.status(500).json({ message: "Error al eliminar la venta" });
  }
});

export default router;