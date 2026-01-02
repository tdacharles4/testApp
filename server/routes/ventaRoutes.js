import express from "express";
import Venta from "../models/Ventas.js";
import Tienda from "../models/Tienda.js";
import requireAuth from "../middleware/requireAuth.js";
import connectDB from "../config/db.js"; // ESSENTIAL: Add this import

const router = express.Router();

// ESSENTIAL: DB connection middleware for Vercel (adds 7 lines)
router.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error("Database connection error:", error);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// Keep your original helper function
const generateSaleId = async () => {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  
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
    const lastSequence = parseInt(lastSale.saleId.slice(-4));
    sequenceNumber = lastSequence + 1;
  }
  
  return `${year}${month}${sequenceNumber.toString().padStart(4, '0')}`;
};

// Get current stock for a specific product in a store
router.get("/stock/:storeTag/:productClave", async (req, res) => {
  try {
    const { storeTag, productClave } = req.params;
    
    const store = await Tienda.findOne({ tag: storeTag });
    
    if (!store) {
      return res.status(404).json({ message: "Tienda no encontrada" });
    }
    
    const product = store.products.find(p => p.clave === productClave);
    
    if (!product) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }
    
    res.json({
      store: store.name,
      product: product.name,
      clave: product.clave,
      quantity: product.quantity,
      price: product.price
    });
  } catch (error) {
    console.error("Error in stock by product:", error);
    res.status(500).json({ message: error.message });
  }
});

// Get stock for all products in a store
router.get("/stock/:storeTag", async (req, res) => {
  try {
    const { storeTag } = req.params;
    
    const store = await Tienda.findOne({ tag: storeTag });
    
    if (!store) {
      return res.status(404).json({ message: "Tienda no encontrada" });
    }
    
    res.json({
      store: store.name,
      products: store.products.map(product => ({
        name: product.name,
        clave: product.clave,
        quantity: product.quantity,
        price: product.price
      }))
    });
  } catch (error) {
    console.error("Error in stock by store:", error);
    res.status(500).json({ message: error.message });
  }
});

// Default monthly date filtering (Required for dashboard)
router.get("/", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    console.log("Received dates:", { startDate, endDate });
    
    // If no dates provided, default to current month
    let start = new Date();
    let end = new Date();
    
    if (startDate && endDate) {
      // Parse YYYY-MM-DD dates
      start = new Date(startDate);
      end = new Date(endDate);
    } else {
      // Default to current month
      start = new Date(start.getFullYear(), start.getMonth(), 1);
      end = new Date(end.getFullYear(), end.getMonth() + 1, 0);
    }
    
    // Set end date to end of day
    end.setHours(23, 59, 59, 999);
    
    console.log("Filtering between:", start, "and", end);
    
    // Get all sales and filter manually
    const allVentas = await Venta.find().populate('user', 'name username');
    
    const filteredVentas = allVentas.filter(venta => {
      // Parse the es-MX string date from database
      const [day, month, year] = venta.date.split('/').map(Number);
      const ventaDate = new Date(year, month - 1, day);
      
      return ventaDate >= start && ventaDate <= end;
    });
    
    console.log("Found", filteredVentas.length, "sales out of", allVentas.length, "total");
    res.json(filteredVentas);
  } catch (err) {
    console.error("Error in GET /ventas:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get all sales (Required for Historial de Ventas)
router.get("/historial", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    console.log("HISTORIAL API - Received dates:", { startDate, endDate });
    
    let allVentas = await Venta.find().populate('user', 'name username');
    
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      console.log("HISTORIAL API - Filtering between:", start, "and", end);
      
      allVentas = allVentas.filter(venta => {
        try {
          const [day, month, year] = venta.date.split('/').map(Number);
          const ventaDate = new Date(year, month - 1, day);
          
          return ventaDate >= start && ventaDate <= end;
        } catch (error) {
          console.error("Error parsing date for venta:", venta._id, venta.date);
          return false;
        }
      });
    }
    
    console.log("HISTORIAL API - Returning", allVentas.length, "sales");
    res.json(allVentas);
  } catch (err) {
    console.error("Error in GET /ventas/historial:", err);
    res.status(500).json({ error: err.message });
  }
});

// Update stock for a product (requires authentication)
router.put("/stock/update", requireAuth, async (req, res) => {
  try {
    const { storeTag, productClave, newQuantity } = req.body;
    
    if (!storeTag || !productClave || newQuantity === undefined) {
      return res.status(400).json({ message: "Faltan parámetros requeridos" });
    }
    
    const result = await Tienda.findOneAndUpdate(
      { 
        "tag": storeTag,
        "products.clave": productClave 
      },
      { 
        $set: { "products.$.quantity": parseInt(newQuantity) } 
      },
      { new: true }
    );
    
    if (!result) {
      return res.status(404).json({ message: "Producto o tienda no encontrados" });
    }
    
    const updatedProduct = result.products.find(p => p.clave === productClave);
    
    res.json({
      success: true,
      message: "Stock actualizado exitosamente",
      product: {
        name: updatedProduct.name,
        clave: updatedProduct.clave,
        quantity: updatedProduct.quantity
      }
    });
  } catch (error) {
    console.error("Error updating stock:", error);
    res.status(500).json({ message: error.message });
  }
});

// Create new sale
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
      storeContractType,
      storeContractValue
    } = req.body;

    // Find the store and product
    const currentStore = await Tienda.findOne({ tag: store });
    if (!currentStore) {
      return res.status(404).json({ message: "Tienda no encontrada" });
    }
    
    const currentItem = currentStore.products.find(p => p.clave === item);
    if (!currentItem) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    // Check if product has sufficient stock
    if (currentItem.quantity <= 0) {
      return res.status(400).json({ message: "No hay suficiente stock para este producto" });
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
      storeContractType: storeContractType || currentStore.contractType,
      storeContractValue: storeContractValue || currentStore.contractValue || 0,
      date: date || new Date().toLocaleDateString("es-MX")
    });

    await venta.save();

    // Update product quantity in the store (reduce by 1)
    await Tienda.findOneAndUpdate(
      { 
        "tag": store,
        "products.clave": item 
      },
      { 
        $inc: { "products.$.quantity": -1 } 
      }
    );

    await venta.populate("user", "name username email");
    
    res.status(201).json({
      success: true,
      venta,
      message: "Venta registrada y stock actualizado exitosamente"
    });
  } catch (error) {
    console.error("Error creating sale:", error);
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