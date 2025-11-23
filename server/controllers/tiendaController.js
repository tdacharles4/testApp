import Tienda from "../models/Tienda.js";

async function createStore(req, res) {
  try {
    const { storeName, storeTag } = req.body;

    const productNames = req.body.productNames;
    const productImages = req.files;

    const products = [];

    for (let i = 0; i < productImages.length; i++) {
      products.push({
        name: Array.isArray(productNames) ? productNames[i] : productNames,
        imageUrl: `/uploads/${productImages[i].filename}`,
      });
    }

    const tienda = await Tienda.create({
      name: storeName,
      tag: storeTag,
      products,
      createdBy: req.user._id,
    });

    res.json({ message: "Tienda creada", tienda });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error interno" });
  }
}

export default { createStore };