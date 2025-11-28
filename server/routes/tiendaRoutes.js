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

// Update store - ENHANCED to include all store fields
router.put("/:storeId", requireAuth, requireAdmin, upload.none(), async (req, res) => {
  try {
    const { storeId } = req.params;
    const { 
      storeName, 
      storeTag, 
      storeDescription, 
      contractType, 
      contractValue,
      contacto, 
      banco, 
      numeroCuenta, 
      clabe, 
      tarjeta 
    } = req.body;

    const store = await Tienda.findById(storeId);
    if (!store) {
      return res.status(404).json({ message: 'Tienda no encontrada' });
    }

    // Update store fields with new data structure
    store.name = storeName;
    store.tag = storeTag.toUpperCase();
    store.description = storeDescription || "";
    store.contractType = contractType || "";
    store.contractValue = contractValue || "";
    store.contacto = contacto || "";
    store.banco = banco || "";
    store.numeroCuenta = numeroCuenta || "";
    store.clabe = clabe || "";
    store.tarjeta = tarjeta || "";

    await store.save();
    res.json(store);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update product in a store - ENHANCED to include all product fields
router.put("/:storeId/products/:productId", requireAuth, requireAdmin, upload.single("productImage"), async (req, res) => {
  try {
    const { storeId, productId } = req.params;
    const { 
      productClave, 
      productNombre, 
      productDescription, 
      productPrice, 
      productQuantity,
      productFechaRecepcion 
    } = req.body;

    const store = await Tienda.findById(storeId);
    if (!store) {
      return res.status(404).json({ message: 'Tienda no encontrada' });
    }

    const product = store.products.id(productId);
    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    // Update product fields with new data structure
    if (productClave !== undefined) {
      product.clave = productClave;
      product.name = productNombre || productClave;
    }
    if (productNombre !== undefined) product.name = productNombre;
    if (productDescription !== undefined) product.description = productDescription;
    if (productPrice !== undefined) product.price = parseFloat(productPrice) || 0;
    if (productQuantity !== undefined) product.quantity = parseInt(productQuantity) || 0;
    if (productFechaRecepcion !== undefined) product.fechaRecepcion = productFechaRecepcion;
    
    // Update image if provided
    if (req.file) {
      product.imageUrl = `/uploads/${req.file.filename}`;
    }

    await store.save();
    res.json(store);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add product to store - ENHANCED to include all product fields
router.post("/:storeId/products", requireAuth, requireAdmin, upload.single("productImage"), async (req, res) => {
  try {
    const { storeId } = req.params;
    const { 
      productClave, 
      productNombre, 
      productDescription, 
      productPrice, 
      productQuantity,
      productFechaRecepcion 
    } = req.body;
    
    const store = await Tienda.findById(storeId);
    if (!store) {
      return res.status(404).json({ message: 'Tienda no encontrada' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'La imagen del producto es requerida' });
    }

    const finalClave = `${store.tag}-${productClave.toUpperCase()}`;
    const price = parseFloat(productPrice) || 0;
    const quantity = parseInt(productQuantity) || 0;

    const newProduct = {
      clave: finalClave,
      name: productNombre || productClave.toUpperCase(),
      description: productDescription || "",
      imageUrl: `/uploads/${req.file.filename}`,
      price: price,
      quantity: quantity,
      fechaRecepcion: productFechaRecepcion || new Date().toISOString().split('T')[0]
    };

    store.products.push(newProduct);
    await store.save();

    res.json(store);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;