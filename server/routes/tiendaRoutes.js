import express from "express";
import { createRequire } from "module";

import requireAuth from "../middleware/requireAuth.js";
import requireAdmin from "../middleware/requireAdmin.js";
import tiendaController from "../controllers/tiendaController.js";
import Tienda from "../models/Tienda.js";

const require = createRequire(import.meta.url);
const multer = require("multer");

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// Create store
router.post(
  "/",
  requireAuth,
  requireAdmin,
  upload.array("productImages", 10),
  tiendaController.createStore
);

// Get all stores
router.get("/", async (req, res) => {
  try {
    const tiendas = await Tienda.find(); 
    res.json(tiendas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get store by tag or name
router.get("/:identifier", async (req, res) => {
  try {
    const { identifier } = req.params;
    
    // Try to find by tag first, then by name
    const store = await Tienda.findOne({
      $or: [
        { tag: identifier.toUpperCase() },
        { name: new RegExp(identifier, 'i') }
      ]
    });
    
    if (!store) {
      return res.status(404).json({ message: 'Tienda no encontrada' });
    }
    
    res.json(store);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete store
router.delete("/:storeId", requireAuth, requireAdmin, async (req, res) => {
  try {
    const store = await Tienda.findByIdAndDelete(req.params.storeId);
    if (!store) {
      return res.status(404).json({ message: 'Tienda no encontrada' });
    }
    res.json({ message: 'Tienda eliminada exitosamente' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update store
router.put("/:storeId", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { storeId } = req.params;
    const { name, tag, location, description } = req.body;

    const store = await Tienda.findById(storeId);
    if (!store) {
      return res.status(404).json({ message: 'Tienda no encontrada' });
    }

    // Update store fields
    store.name = name;
    store.tag = tag.toUpperCase();
    store.location = location || "";
    store.description = description || "";

    await store.save();
    res.json(store);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update product in a store
router.put("/:storeId/products/:productId", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { storeId, productId } = req.params;
    const { quantity, price } = req.body;

    const store = await Tienda.findById(storeId);
    if (!store) {
      return res.status(404).json({ message: 'Tienda no encontrada' });
    }

    const product = store.products.id(productId);
    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    // Update product fields
    if (quantity !== undefined) product.quantity = quantity;
    if (price !== undefined) product.price = price;

    await store.save();
    res.json(store);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add product to store
router.post("/:storeId/products", requireAuth, requireAdmin, upload.single("productImage"), async (req, res) => {
  try {
    const { storeId } = req.params;
    const { productClave, productPrice, productQuantity } = req.body;
    
    const store = await Tienda.findById(storeId);
    if (!store) {
      return res.status(404).json({ message: 'Tienda no encontrada' });
    }

    const finalClave = `${store.tag}-${productClave.toUpperCase()}`;
    const price = parseFloat(productPrice) || 0;
    const quantity = parseInt(productQuantity) || 0;

    const newProduct = {
      clave: finalClave,
      name: productClave.toUpperCase(),
      imageUrl: `/uploads/${req.file?.filename || ""}`,
      price: price,
      quantity: quantity
    };

    store.products.push(newProduct);
    await store.save();

    res.json(store);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


export default router;