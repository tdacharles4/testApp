import express from "express";
import Salida from "../models/Salidas.js";
import requireAuth from "../middleware/requireAuth.js";
import connectDB from "../config/db.js"; // Add this import

const router = express.Router();

// Middleware to ensure DB connection for salida routes
const ensureDB = async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error("Database connection error in salida routes:", error);
    res.status(500).json({ 
      message: "Error de conexión con la base de datos" 
    });
  }
};

// Apply DB connection middleware to all salida routes
router.use(ensureDB);

// Helper function to generate salida ID
const generateSalidaId = async () => {
  const count = await Salida.countDocuments();
  return `OUT${(count + 1).toString().padStart(3, '0')}`;
};

// Get all exits
router.get("/", async (req, res) => {
  try {
    // Optional: Add pagination for better performance
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    
    // Optional: Add date filtering
    const { startDate, endDate } = req.query;
    const filter = {};
    
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      filter.fecha = {
        $gte: start,
        $lte: end
      };
    }
    
    const [salidas, total] = await Promise.all([
      Salida.find(filter)
        .populate("user", "name username")
        .sort({ fecha: -1 })
        .skip(skip)
        .limit(limit),
      Salida.countDocuments(filter)
    ]);
    
    res.json({
      salidas,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching salidas:", error);
    res.status(500).json({ 
      message: "Error al obtener las salidas",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
});

// Create new exit
router.post("/crear", requireAuth, async (req, res) => {
  try {
    const { monto, concepto, pago, fecha } = req.body;

    // Validate required fields
    if (!monto || !concepto || !pago || !fecha) {
      return res.status(400).json({ 
        success: false,
        message: "Todos los campos son obligatorios: monto, concepto, pago, fecha" 
      });
    }

    // Validate monto is a positive number
    const montoNum = parseFloat(monto);
    if (isNaN(montoNum) || montoNum <= 0) {
      return res.status(400).json({ 
        success: false,
        message: "El monto debe ser un número positivo" 
      });
    }

    // Validate pago method
    const validPagos = ['Efectivo', 'Tarjeta', 'Transferencia', 'Mixto'];
    if (!validPagos.includes(pago)) {
      return res.status(400).json({ 
        success: false,
        message: `Método de pago inválido. Use uno de: ${validPagos.join(', ')}` 
      });
    }

    // Validate date format
    const fechaDate = new Date(fecha);
    if (isNaN(fechaDate.getTime())) {
      return res.status(400).json({ 
        success: false,
        message: "Formato de fecha inválido" 
      });
    }

    // Check for future dates (optional)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (fechaDate > today) {
      return res.status(400).json({ 
        success: false,
        message: "No se pueden registrar salidas con fecha futura" 
      });
    }

    const salidaId = await generateSalidaId();

    const salida = new Salida({
      salidaId,
      monto: montoNum,
      concepto,
      pago,
      fecha: fechaDate,
      user: req.user._id
    });

    await salida.save();
    await salida.populate("user", "name username");

    res.status(201).json({
      success: true,
      salida,
      message: "Salida registrada exitosamente"
    });
  } catch (error) {
    console.error("Error creating exit:", error);
    
    let errorMessage = "Error al registrar la salida";
    let statusCode = 500;
    
    if (error.name === 'ValidationError') {
      errorMessage = "Datos de salida inválidos";
      statusCode = 400;
    }
    
    res.status(statusCode).json({ 
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
});

// Delete exit
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    // Only allow admin or the user who created it to delete
    const salida = await Salida.findById(req.params.id);
    
    if (!salida) {
      return res.status(404).json({ 
        success: false,
        message: "Salida no encontrada" 
      });
    }

    // Check permissions
    const isAdmin = req.user.role === 'admin' || req.user.permissions?.administrador;
    const isCreator = salida.user.toString() === req.user._id.toString();
    
    if (!isAdmin && !isCreator) {
      return res.status(403).json({ 
        success: false,
        message: "No autorizado para eliminar esta salida" 
      });
    }

    await Salida.findByIdAndDelete(req.params.id);
    
    res.json({ 
      success: true,
      message: "Salida eliminada exitosamente",
      salidaId: salida.salidaId
    });
  } catch (error) {
    console.error("Error deleting exit:", error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        success: false,
        message: "ID de salida inválido" 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: "Error al eliminar la salida",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
});

// Optional: Get single exit by ID
router.get("/:id", async (req, res) => {
  try {
    const salida = await Salida.findById(req.params.id)
      .populate("user", "name username");
    
    if (!salida) {
      return res.status(404).json({ 
        success: false,
        message: "Salida no encontrada" 
      });
    }
    
    res.json({
      success: true,
      salida
    });
  } catch (error) {
    console.error("Error fetching salida:", error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        success: false,
        message: "ID de salida inválido" 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: "Error al obtener la salida",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
});

// Optional: Update exit
router.put("/:id", requireAuth, async (req, res) => {
  try {
    const salida = await Salida.findById(req.params.id);
    
    if (!salida) {
      return res.status(404).json({ 
        success: false,
        message: "Salida no encontrada" 
      });
    }

    // Check permissions
    const isAdmin = req.user.role === 'admin' || req.user.permissions?.administrador;
    const isCreator = salida.user.toString() === req.user._id.toString();
    
    if (!isAdmin && !isCreator) {
      return res.status(403).json({ 
        success: false,
        message: "No autorizado para modificar esta salida" 
      });
    }

    const { monto, concepto, pago, fecha } = req.body;
    
    // Update only provided fields
    if (monto !== undefined) salida.monto = parseFloat(monto);
    if (concepto !== undefined) salida.concepto = concepto;
    if (pago !== undefined) salida.pago = pago;
    if (fecha !== undefined) salida.fecha = new Date(fecha);
    
    await salida.save();
    await salida.populate("user", "name username");
    
    res.json({
      success: true,
      salida,
      message: "Salida actualizada exitosamente"
    });
  } catch (error) {
    console.error("Error updating exit:", error);
    
    let errorMessage = "Error al actualizar la salida";
    let statusCode = 500;
    
    if (error.name === 'ValidationError') {
      errorMessage = "Datos de salida inválidos";
      statusCode = 400;
    } else if (error.name === 'CastError') {
      errorMessage = "ID de salida inválido";
      statusCode = 400;
    }
    
    res.status(statusCode).json({ 
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
});

export default router;