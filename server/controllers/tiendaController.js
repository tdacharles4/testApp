import Tienda from "../models/Tienda.js";

const createStore = async (req, res) => {
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
      tarjeta
    } = req.body;

    const productClaves = req.body.productClaves || [];
    const productDescriptions = req.body.productDescriptions || [];
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
        description: productDescriptions[i] || "",
        imageUrl: productImages[i] ? `/uploads/${productImages[i].filename}` : "",
        price: price,
        quantity: quantity,
        fechaRecepcion: new Date(productFechasRecepcion[i] || Date.now())
        // fechaSubida is automatically set by the model default
      });
    }

    // Prepare store data with new fields
    const storeData = {
      tag: normalizedTag,
      name: storeName,
      description: storeDescription || "",
      contractType: contractType,
      products,
      createdBy: req.user._id
    };

    // Add contract value if applicable
    if (contractType === "Porcentaje" || contractType === "Piso") {
      storeData.contractValue = parseFloat(contractValue) || 0;
    }

    // Add contact and bank information
    if (contacto) storeData.contacto = contacto;
    if (banco) storeData.banco = banco;
    if (numeroCuenta) storeData.numeroCuenta = numeroCuenta;
    if (clabe) storeData.clabe = clabe;
    if (tarjeta) storeData.tarjeta = tarjeta;

    const tienda = await Tienda.create(storeData);

    res.json({ message: "Tienda creada", tienda });

  } catch (err) {
    console.error("Error creating store:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

export default { createStore };