import express from "express";
import Venta from "../models/Ventas.js";
import Tienda from "../models/Tienda.js";
import requireAuth from "../middleware/requireAuth.js";
import connectDB from "../config/db.js";

const router = express.Router();

router.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error("Database connection error:", error);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

const generateSaleId = async () => {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const datePrefix = `${year}${month}`;
  
  // Buscar la última venta del mes actual basada en saleId
  const lastSale = await Venta.findOne({
    saleId: { $regex: `^${datePrefix}` }
  }).sort({ saleId: -1 }).limit(1);
  
  let sequenceNumber = 1;
  if (lastSale && lastSale.saleId) {
    // Extraer el número de secuencia del saleId (últimos 4 dígitos)
    const lastSequence = parseInt(lastSale.saleId.slice(-4));
    if (!isNaN(lastSequence)) {
      sequenceNumber = lastSequence + 1;
    }
  }
  
  return `${datePrefix}${sequenceNumber.toString().padStart(4, '0')}`;
};

router.get("/stock/:storeTag/:productClave", async (req, res) => {
  try {
    const { storeTag, productClave } = req.params;
    
    const store = await Tienda.findOne({ tag: storeTag });
    
    if (!store) {
      return res.status(404).json({ message: "Marca no encontrada" });
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

router.get("/stock/:storeTag", async (req, res) => {
  try {
    const { storeTag } = req.params;
    
    const store = await Tienda.findOne({ tag: storeTag });
    
    if (!store) {
      return res.status(404).json({ message: "Marca no encontrada" });
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

router.get("/historial", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    console.log("HISTORIAL API - Fetching sales...");

    let allVentas = await Venta.find()
      .populate('user', 'name username')
      .sort({ createdAt: -1 });
    
    console.log(`HISTORIAL API - Found ${allVentas.length} total sales`);
    
    if (startDate && endDate) {
      try {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        
        console.log("HISTORIAL API - Filtering between:", start, "and", end);
        
        allVentas = allVentas.filter(venta => {
          try {
            let ventaDate;
            if (venta.createdAt) {
              ventaDate = new Date(venta.createdAt);
            } else if (venta.date) {
              const [day, month, year] = venta.date.split('/').map(Number);
              ventaDate = new Date(year, month - 1, day);
            } else {
              return false;
            }
            
            return ventaDate >= start && ventaDate <= end;
          } catch (error) {
            console.error("Error parsing date for venta:", venta._id, venta.date);
            return false;
          }
        });
      } catch (parseError) {
        console.error("Error parsing filter dates:", parseError);
      }
    }
    
    console.log(`HISTORIAL API - Returning ${allVentas.length} filtered sales`);
    res.json(allVentas);
  } catch (err) {
    console.error("Error in GET /ventas/historial:", err);
    res.status(500).json({ 
      error: err.message,
      details: "Error fetching sales history" 
    });
  }
});

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
      return res.status(404).json({ message: "Producto o marca no encontrados" });
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

router.get("/generar-saleid", requireAuth, async (req, res) => {
  try {
    const saleId = await generateSaleId();
    res.json({ saleId });
  } catch (error) {
    console.error("Error generando saleId:", error);
    res.status(500).json({ message: error.message });
  }
});

router.post("/crear", requireAuth, async (req, res) => {
  const session = await Venta.startSession();
  session.startTransaction();
  
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
      // NO recibir saleId desde el frontend
    } = req.body;

    // Find the store and product
    const currentStore = await Tienda.findOne({ tag: store });
    if (!currentStore) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Marca no encontrada" });
    }
    
    const currentItem = currentStore.products.find(p => p.clave === item);
    if (!currentItem) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    // Check if product has sufficient stock
    if (currentItem.quantity <= 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "No hay suficiente stock para este producto" });
    }

    // Generar saleId ÚNICO para esta venta individual
    const saleId = await generateSaleId();

    const venta = new Venta({
      saleId, // SaleId único por venta
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
      date: date || new Date().toLocaleDateString("es-MX"),
      createdAt: new Date() // Añadir timestamp para ordenación
    });

    await venta.save({ session });

    // Update product quantity in the store (reduce by 1)
    await Tienda.findOneAndUpdate(
      { 
        "tag": store,
        "products.clave": item 
      },
      { 
        $inc: { "products.$.quantity": -1 } 
      },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    await venta.populate("user", "name username email");
    
    res.status(201).json({
      success: true,
      venta,
      message: "Venta registrada y stock actualizado exitosamente"
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error creating sale:", error);
    
    // Manejo específico de error de duplicado
    if (error.code === 11000 && error.keyPattern && error.keyPattern.saleId) {
      return res.status(409).json({ 
        message: "Error de duplicado en saleId. Por favor, intente nuevamente.",
        retry: true
      });
    }
    
    res.status(500).json({ message: error.message });
  }
});

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