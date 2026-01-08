import express from "express";
import requireAuth from "../middleware/requireAuth.js";
import requireAdmin from "../middleware/requireAdmin.js";
import Tienda from "../models/Tienda.js";
import connectDB from "../config/db.js"; // Add this import

const router = express.Router();

// Middleware to ensure DB connection for tienda routes
const ensureDB = async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error("Database connection error in tienda (marcas) routes:", error);
    res.status(500).json({ 
      error: "Error de conexión con la base de datos" 
    });
  }
};

// Apply DB connection middleware to all tienda routes
router.use(ensureDB);

// IMPORTANT: File uploads don't work on Vercel's filesystem
// We need to handle images differently - using base64 or cloud storage

// Get all stores
router.get("/", async (req, res) => {
  try {
    const tiendas = await Tienda.find().populate('products');
    res.json({
      success: true,
      count: tiendas.length,
      tiendas
    });
  } catch (err) {
    console.error("Error fetching marcas:", err);
    res.status(500).json({ 
      success: false,
      error: "Error al obtener las marcas",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined 
    });
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
    }).populate('products');
    
    if (!store) {
      return res.status(404).json({ 
        success: false,
        message: 'Marca no encontrada' 
      });
    }
    
    res.json({
      success: true,
      store
    });
  } catch (error) {
    console.error("Error fetching marca:", error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener la marca',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
});

// Create store (Vercel Blob compatible)
router.post("/", requireAuth, requireAdmin, async (req, res) => {
  try {
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
      tarjeta,
      products = [] 
    } = req.body;

    // Validate required fields
    if (!storeName || !storeTag) {
      return res.status(400).json({ 
        success: false,
        message: "Nombre y clave de marca son obligatorios" 
      });
    }

    if (storeTag.length !== 4) {
      return res.status(400).json({ 
        success: false,
        message: "La clave de marca debe tener exactamente 4 caracteres" 
      });
    }

    // Check if store already exists
    const existingStore = await Tienda.findOne({ 
      $or: [{ name: storeName }, { tag: storeTag.toUpperCase() }] 
    });
    
    if (existingStore) {
      return res.status(400).json({ 
        success: false,
        message: "Ya existe una marca con este nombre o clave" 
      });
    }

    // Process contractValue - convert to number or set to 0
    let processedContractValue = 0;
    if (contractValue !== undefined && contractValue !== null && contractValue !== "") {
      processedContractValue = parseFloat(contractValue) || 0;
    }

    // Process products (if any)
    const processedProducts = Array.isArray(products) ? products.map((product, index) => ({
      clave: `${storeTag.toUpperCase()}-${product.clave || `PROD${(index + 1).toString().padStart(3, '0')}`}`,
      name: product.nombre || product.clave || `Producto ${index + 1}`,
      description: product.description || "",
      // Use Vercel Blob URL or placeholder
      imageUrl: product.imageUrl || "/logo192.png",
      price: parseFloat(product.price) || 0,
      quantity: parseInt(product.quantity) || 0,
      fechaRecepcion: product.fechaRecepcion || new Date().toISOString().split('T')[0]
    })) : [];

    // Create store
    const store = new Tienda({
      name: storeName,
      tag: storeTag.toUpperCase(),
      description: storeDescription || "",
      contractType: contractType,
      contractValue: processedContractValue,
      contacto: contacto || "",
      banco: banco || "",
      numeroCuenta: numeroCuenta || "",
      clabe: clabe || "",
      tarjeta: tarjeta || "",
      products: processedProducts,
      createdBy: req.user._id
    });

    await store.save();

    res.status(201).json({
      success: true,
      message: "Marca creada exitosamente",
      store
    });
  } catch (error) {
    console.error("Error creating marca:", error);
    
    // Log detailed validation errors
    if (error.name === 'ValidationError') {
      console.error("Validation errors:", error.errors);
    }
    
    let errorMessage = "Error al crear la marca";
    let statusCode = 500;
    
    if (error.name === 'ValidationError') {
      errorMessage = "Datos de marca inválidos";
      statusCode = 400;
    } else if (error.code === 11000) {
      errorMessage = "Ya existe una marca con esta clave o nombre";
      statusCode = 400;
    }
    
    res.status(statusCode).json({ 
      success: false,
      message: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
});

// Update store
router.put("/:storeId", requireAuth, requireAdmin, async (req, res) => {
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
      return res.status(404).json({ 
        success: false,
        message: 'Marca no encontrada' 
      });
    }

    // Check if new tag conflicts with another store
    if (storeTag && storeTag.toUpperCase() !== store.tag) {
      const existingWithTag = await Tienda.findOne({ 
        tag: storeTag.toUpperCase(),
        _id: { $ne: storeId }
      });
      
      if (existingWithTag) {
        return res.status(400).json({ 
          success: false,
          message: 'Ya existe otra marca con esta clave' 
        });
      }
    }

    // Update store fields
    if (storeName !== undefined) store.name = storeName;
    if (storeTag !== undefined) store.tag = storeTag.toUpperCase();
    if (storeDescription !== undefined) store.description = storeDescription;
    if (contractType !== undefined) store.contractType = contractType;
    if (contractValue !== undefined) store.contractValue = contractValue;
    if (contacto !== undefined) store.contacto = contacto;
    if (banco !== undefined) store.banco = banco;
    if (numeroCuenta !== undefined) store.numeroCuenta = numeroCuenta;
    if (clabe !== undefined) store.clabe = clabe;
    if (tarjeta !== undefined) store.tarjeta = tarjeta;

    await store.save();
    
    res.json({
      success: true,
      message: "Marca actualizada exitosamente",
      store
    });
  } catch (error) {
    console.error("Error updating marca:", error);
    
    let errorMessage = "Error al actualizar la marca";
    let statusCode = 500;
    
    if (error.name === 'ValidationError') {
      errorMessage = "Datos de marca inválidos";
      statusCode = 400;
    } else if (error.name === 'CastError') {
      errorMessage = "ID de marca inválido";
      statusCode = 400;
    }
    
    res.status(statusCode).json({ 
      success: false,
      message: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
});

// Delete store
router.delete("/:storeId", requireAuth, requireAdmin, async (req, res) => {
  try {
    const store = await Tienda.findById(req.params.storeId);
    
    if (!store) {
      return res.status(404).json({ 
        success: false,
        message: 'Marca no encontrada' 
      });
    }

    await Tienda.findByIdAndDelete(req.params.storeId);
    
    res.json({ 
      success: true,
      message: 'Marca eliminada exitosamente',
      storeName: store.name,
      storeTag: store.tag
    });
  } catch (error) {
    console.error("Error deleting marca:", error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        success: false,
        message: "ID de marca inválido" 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Error al eliminar la marca',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
});

// Update product in a store (Vercel compatible - no file upload)
router.put("/:storeId/products/:productId", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { storeId, productId } = req.params;
    const { 
      productClave, 
      productNombre, 
      productDescription, 
      productPrice, 
      productQuantity,
      productFechaRecepcion,
      imageBase64 // Optional: new base64 image
    } = req.body;

    const store = await Tienda.findById(storeId);
    if (!store) {
      return res.status(404).json({ 
        success: false,
        message: 'Marca no encontrada' 
      });
    }

    const product = store.products.id(productId);
    if (!product) {
      return res.status(404).json({ 
        success: false,
        message: 'Producto no encontrado' 
      });
    }

    // Update product fields
    if (productClave !== undefined) {
      product.clave = productClave;
    }
    if (productNombre !== undefined) product.name = productNombre;
    if (productDescription !== undefined) product.description = productDescription;
    if (productPrice !== undefined) product.price = parseFloat(productPrice) || 0;
    if (productQuantity !== undefined) product.quantity = parseInt(productQuantity) || 0;
    if (productFechaRecepcion !== undefined) product.fechaRecepcion = productFechaRecepcion;
    
    // Update image if provided as base64
    if (imageBase64) {
      product.imageUrl = `data:image/jpeg;base64,${imageBase64}`;
    }

    await store.save();
    
    res.json({
      success: true,
      message: "Producto actualizado exitosamente",
      store
    });
  } catch (error) {
    console.error("Error updating product:", error);
    
    let errorMessage = "Error al actualizar el producto";
    let statusCode = 500;
    
    if (error.name === 'CastError') {
      errorMessage = "ID de marca o producto inválido";
      statusCode = 400;
    }
    
    res.status(statusCode).json({ 
      success: false,
      message: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
});

// Add product to store (Vercel compatible - no file upload)
router.post("/:storeId/products", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { storeId } = req.params;
    const { 
      productClave, 
      productNombre, 
      productDescription, 
      productPrice, 
      productQuantity,
      productFechaRecepcion,
      imageBase64 
    } = req.body;
    
    const store = await Tienda.findById(storeId);
    if (!store) {
      return res.status(404).json({ 
        success: false,
        message: 'Marca no encontrada' 
      });
    }

    if (!productClave || !productNombre) {
      return res.status(400).json({ 
        success: false,
        message: 'Clave y nombre del producto son requeridos' 
      });
    }

    // Generate final clave with store prefix
    const finalClave = `${store.tag}-${productClave.toUpperCase()}`;
    const price = parseFloat(productPrice) || 0;
    const quantity = parseInt(productQuantity) || 0;

    const newProduct = {
      clave: finalClave,
      name: productNombre,
      description: productDescription || "",
      // Store base64 image or use placeholder
      imageUrl: imageBase64 ? `data:image/jpeg;base64,${imageBase64}` : null,
      price: price,
      quantity: quantity,
      fechaRecepcion: productFechaRecepcion || new Date().toISOString().split('T')[0]
    };

    store.products.push(newProduct);
    await store.save();

    res.status(201).json({
      success: true,
      message: "Producto agregado exitosamente",
      store
    });
  } catch (error) {
    console.error("Error adding product:", error);
    
    let errorMessage = "Error al agregar el producto";
    let statusCode = 500;
    
    if (error.name === 'CastError') {
      errorMessage = "ID de marca inválido";
      statusCode = 400;
    } else if (error.name === 'ValidationError') {
      errorMessage = "Datos de producto inválidos";
      statusCode = 400;
    }
    
    res.status(statusCode).json({ 
      success: false,
      message: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
});

// Delete product from store
router.delete("/:storeId/products/:productId", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { storeId, productId } = req.params;
    
    const store = await Tienda.findById(storeId);
    if (!store) {
      return res.status(404).json({ 
        success: false,
        message: 'Marca no encontrada' 
      });
    }

    const product = store.products.id(productId);
    if (!product) {
      return res.status(404).json({ 
        success: false,
        message: 'Producto no encontrado' 
      });
    }

    // Remove the product
    store.products.pull(productId);
    await store.save();
    
    res.json({
      success: true,
      message: "Producto eliminado exitosamente",
      productName: product.name,
      productClave: product.clave
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        success: false,
        message: "ID de marca o producto inválido" 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: "Error al eliminar el producto",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
});

// Optional: Search products across stores
router.get("/search/products", async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.status(400).json({ 
        success: false,
        message: "Término de búsqueda muy corto (mínimo 2 caracteres)" 
      });
    }

    const stores = await Tienda.find({
      $or: [
        { 'products.name': new RegExp(q, 'i') },
        { 'products.clave': new RegExp(q, 'i') },
        { 'products.description': new RegExp(q, 'i') }
      ]
    }).select('name tag products');

    // Flatten results
    const results = stores.flatMap(store => 
      store.products
        .filter(product => 
          product.name.match(new RegExp(q, 'i')) || 
          product.clave.match(new RegExp(q, 'i')) ||
          product.description?.match(new RegExp(q, 'i'))
        )
        .map(product => ({
          ...product.toObject(),
          storeName: store.name,
          storeTag: store.tag
        }))
    );

    res.json({
      success: true,
      count: results.length,
      results
    });
  } catch (error) {
    console.error("Error searching products:", error);
    res.status(500).json({ 
      success: false,
      message: "Error al buscar productos",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
});

export default router;