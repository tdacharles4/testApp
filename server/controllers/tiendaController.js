import Tienda from "../models/Tienda.js";

const createStore = async (req, res) => {
  try {
    const { storeName, storeTag, storeLocation, storeDescription } = req.body;

    const productClaves = req.body.productClaves || [];  // updated name
    const productPrices = req.body.productPrices || [];
    const productQuantities = req.body.productQuantities || [];
    const productImages = req.files;

    if (!storeTag || storeTag.length > 4) {
      return res.status(400).json({ error: "Tag inválido (máx 4 letras)" });
    }

    const normalizedTag = storeTag.toUpperCase();

    // Prevent duplicate store
    const exists = await Tienda.findOne({ tag: normalizedTag });
    if (exists) {
      return res.status(400).json({ error: "Ese tag de tienda ya existe" });
    }

    const products = [];

    for (let i = 0; i < productClaves.length; i++) {
      const claveInput = productClaves[i].toUpperCase();
      const finalClave = `${normalizedTag}-${claveInput}`;
      
      // Parse price and quantity with default values
      const price = parseFloat(productPrices[i]) || 0;
      const quantity = parseInt(productQuantities[i]) || 0;

      products.push({
        clave: finalClave,
        name: claveInput,
        imageUrl: `/uploads/${productImages[i]?.filename || ""}`,
        price: price,
        quantity: quantity
      });
    }

    const tienda = await Tienda.create({
      tag: normalizedTag,
      name: storeName,
      location: storeLocation || "",
      description: storeDescription || "",
      products,
      createdBy: req.user._id
    });

    res.json({ message: "Tienda creada", tienda });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error interno" });
  }
};

export default { createStore };