import express from "express";
import Venta from "../models/Ventas.js";
import requireAuth from "../middleware/requireAuth.js";

const router = express.Router();

// Helper function to generate sale ID
const generateSaleId = async () => {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2); // Last 2 digits of year
  const month = (now.getMonth() + 1).toString().padStart(2, '0'); // Month with leading zero
  
  // Find the last sale of current month to get the sequence number
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  const lastSale = await Venta.findOne({
    date: {
      $gte: firstDayOfMonth.toLocaleDateString("es-MX"),
      $lte: lastDayOfMonth.toLocaleDateString("es-MX")
    }
  }).sort({ saleId: -1 });
  
  let sequenceNumber = 1;
  if (lastSale && lastSale.saleId) {
    // Extract sequence number from last sale ID (last 4 digits)
    const lastSequence = parseInt(lastSale.saleId.slice(-4));
    sequenceNumber = lastSequence + 1;
  }
  
  // Format: YYMMXXXX (4-digit sequence)
  return `${year}${month}${sequenceNumber.toString().padStart(4, '0')}`;
};

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
// In VentaRoutes.js - update the create sale endpoint
router.post("/crear", requireAuth, async (req, res) => {
  try {
    const { 
      store, 
      item, 
      amount, 
      originalPrice, 
      discountAmount, 
      discountPercentage, 
      discountType, 
      date, 
      amountEfectivo, 
      amountTarjeta, 
      amountTransferencia,
      storeContractType,  // Make sure this is included
      storeContractValue  // Make sure this is included
    } = req.body;

    // Get the complete product and store information
    const storesRes = await fetch("http://localhost:5000/api/tiendas");
    const storesData = await storesRes.json();
    
    // Find the current store info
    const currentStore = storesData.find(s => s.tag === store);
    if (!currentStore) {
      return res.status(404).json({ message: "Tienda no encontrada" });
    }
    
    // Find the current product info
    const allItems = storesData.flatMap(store => 
      (store.products || []).map(product => ({
        ...product,
        storeTag: store.tag
      }))
    );
    
    const currentItem = allItems.find(i => i.clave === item);
    if (!currentItem) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    // Generate sale ID
    const saleId = await generateSaleId();

    const venta = new Venta({
      saleId,
      store: {
        tag: currentStore.tag,
        name: currentStore.name
      },
      item: {
        clave: currentItem.clave,
        name: currentItem.name,
        price: currentItem.price
      },
      user: req.user._id,
      amount,
      originalPrice: originalPrice || amount,
      discountAmount: discountAmount || 0,
      discountPercentage: discountPercentage || 0,
      discountType: discountType || "none",
      amountEfectivo: amountEfectivo || 0,
      amountTarjeta: amountTarjeta || 0,
      amountTransferencia: amountTransferencia || 0,
      // Store the contract information - use the data from request or fallback to store data
      storeContractType: storeContractType || currentStore.contractType,
      storeContractValue: storeContractValue || currentStore.contractValue || 0,
      date: date || new Date().toLocaleDateString("es-MX")
    });

    await venta.save();
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