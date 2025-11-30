import express from "express";
import Venta from "../models/Ventas.js";
import Tienda from "../models/Tienda.js"; // Make sure to import Tienda
import requireAuth from "../middleware/requireAuth.js";

const router = express.Router();

// Generate sale ID
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

// Get all sales
router.get("/", async (req, res) => {
  try {
    const ventas = await Venta.find().populate("user", "name username email");
    res.json(ventas);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// NEW ROUTES FOR STOCK MANAGEMENT

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
    res.status(500).json({ message: error.message });
  }
});

// Handling date filtering
router.get("/", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let query = {};
    
    if (startDate && endDate) {
      query.date = {
        $gte: startDate,
        $lte: endDate
      };
    }
    
    const ventas = await Venta.find(query).populate('user', 'name username');
    res.json(ventas);
  } catch (err) {
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