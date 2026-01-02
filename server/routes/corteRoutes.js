import express from 'express';
import Corte from '../models/Corte.js';
import Venta from '../models/Ventas.js';
import Salida from '../models/Salidas.js';
import requireAuth from '../middleware/requireAuth.js';
import connectDB from '../config/db.js'; // Add this import

const router = express.Router();

// Middleware to ensure DB connection for corte routes
const ensureDB = async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error('Database connection error in corte routes:', error);
    res.status(500).json({ 
      error: 'Error de conexión con la base de datos' 
    });
  }
};

// Apply DB connection middleware to all corte routes
router.use(ensureDB);

// Apply auth middleware to all corte routes
router.use(requireAuth);

router.post('/generar', async (req, res) => {
  try {
    // IMPORTANT: Debug log to check if user exists
    console.log('User from auth middleware:', req.user);
    console.log('User ID:', req.user?._id);
    
    // Validate user exists
    if (!req.user || !req.user._id) {
      return res.status(401).json({ 
        error: 'Usuario no autenticado. Por favor, inicia sesión.' 
      });
    }

    const { startDate, endDate } = req.body;

    // Validate required fields
    if (!startDate || !endDate) {
      return res.status(400).json({ 
        error: 'Las fechas de inicio y fin son requeridas' 
      });
    }

    // Convert dates from frontend format (YYYY-MM-DD) to Venta format (DD/MM/YYYY)
    const convertToVentaFormat = (dateStr) => {
      const [year, month, day] = dateStr.split('-');
      return `${day}/${month}/${year}`;
    };

    const startVentaFormat = convertToVentaFormat(startDate);
    const endVentaFormat = convertToVentaFormat(endDate);

    // For date objects
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // Validate dates are valid
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ 
        error: 'Formato de fecha inválido. Use YYYY-MM-DD' 
      });
    }

    // Generate corte ID (MMYY)
    const month = (start.getMonth() + 1).toString().padStart(2, '0');
    const year = start.getFullYear().toString().slice(-2);
    const corteId = `${month}${year}`;

    // Check if corte already exists for this period
    const existingCorte = await Corte.findOne({ corteId });
    if (existingCorte) {
      return res.status(400).json({ 
        error: 'Ya existe un corte para este período' 
      });
    }

    // Debug: Log what we're querying
    console.log('Querying ventas with date range:', {
      startVentaFormat,
      endVentaFormat,
      startDate: start,
      endDate: end
    });

    // Get sales within date range (using Venta date format)
    const ventas = await Venta.find({
      date: {
        $gte: startVentaFormat,
        $lte: endVentaFormat
      }
    }).populate('user');

    // Get exits within date range (using Date objects)
    const salidas = await Salida.find({
      fecha: {
        $gte: start,
        $lte: end
      }
    }).populate('user');

    // Debug: Log what was found
    console.log(`Found ${ventas.length} ventas and ${salidas.length} salidas`);

    // Calculate totals
    let totalVentas = 0;
    let totalComisiones = 0;
    let totalMarcas = 0;
    let totalTienda = 0;
    const marcasMap = new Map();
    
    ventas.forEach(venta => {
      totalVentas += venta.amount || 0;
      
      const comisionTarjeta = (venta.amountTarjeta || 0) * 0.046;
      totalComisiones += comisionTarjeta;
      
      const postComision = (venta.amount || 0) - comisionTarjeta;
      const contrato = venta.storeContractType || 'DCE';
      const contractValue = venta.storeContractValue || 0;
      
      let dineroMarca = 0;
      let dineroTienda = 0;
      
      if (contrato === 'DCE' || contrato === 'Piso') {
        dineroMarca = postComision;
        dineroTienda = 0;
      } else if (contrato === 'Porcentaje') {
        dineroMarca = postComision * (1 - contractValue/100);
        dineroTienda = postComision * (contractValue/100);
      } else if (contrato === 'Estetica Unisex') {
        dineroMarca = postComision;
        dineroTienda = postComision;
      }
      
      totalMarcas += dineroMarca;
      totalTienda += dineroTienda;

      const marcaName = venta.store?.name || 'Sin Marca';
      if (!marcasMap.has(marcaName)) {
        marcasMap.set(marcaName, {
          marcaName,
          contratoType: contrato,
          contratoValue: contractValue,
          totalMarca: 0,
          numVentas: 0
        });
      }
      
      const marcaData = marcasMap.get(marcaName);
      marcaData.totalMarca += dineroMarca;
      marcaData.numVentas += 1;
    });
    
    // Create corte record
    const corte = new Corte({
      corteId,
      startDate: start,
      endDate: end,
      totalVentas,
      totalComisiones,
      totalMarcas,
      totalTienda,
      totalSalidas: salidas.reduce((sum, salida) => sum + (salida.monto || 0), 0),
      marcas: Array.from(marcasMap.values()),
      numVentas: ventas.length,
      numSalidas: salidas.length,
      ventas: ventas.map(v => v._id),
      salidas: salidas.map(s => s._id),
      generatedBy: req.user._id
    });
    
    await corte.save();
    
    res.json({
      message: 'Corte generado exitosamente',
      corteId,
      corte: corte
    });
    
  } catch (error) {
    console.error('Error generating corte:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Error al generar el corte';
    let statusCode = 500;
    
    if (error.name === 'ValidationError') {
      errorMessage = 'Datos de corte inválidos';
      statusCode = 400;
    } else if (error.code === 11000) {
      errorMessage = 'Ya existe un corte para este período';
      statusCode = 400;
    }
    
    res.status(statusCode).json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.get('/', async (req, res) => {
  try {
    // Optional: Check user permissions for viewing cortes
    if (req.user.role !== 'admin' && !req.user.permissions?.administrador) {
      return res.status(403).json({ 
        error: 'No autorizado para ver los cortes' 
      });
    }

    const cortes = await Corte.find()
      .sort({ createdAt: -1 })
      .populate('generatedBy', 'name username');
    
    res.json(cortes);
  } catch (error) {
    console.error('Error fetching cortes:', error);
    res.status(500).json({ 
      error: 'Error al obtener los cortes',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    // Optional: Check user permissions
    if (req.user.role !== 'admin' && !req.user.permissions?.administrador) {
      return res.status(403).json({ 
        error: 'No autorizado para ver este corte' 
      });
    }

    const corte = await Corte.findById(req.params.id)
      .populate('ventas')
      .populate('salidas')
      .populate('generatedBy', 'name username');
    
    if (!corte) {
      return res.status(404).json({ 
        error: 'Corte no encontrado' 
      });
    }
    
    res.json(corte);
  } catch (error) {
    console.error('Error fetching corte details:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        error: 'ID de corte inválido' 
      });
    }
    
    res.status(500).json({ 
      error: 'Error al obtener los detalles del corte',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Optional: Add delete endpoint (admin only)
router.delete('/:id', async (req, res) => {
  try {
    // Only admin can delete cortes
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Solo administradores pueden eliminar cortes' 
      });
    }

    const corte = await Corte.findById(req.params.id);
    
    if (!corte) {
      return res.status(404).json({ 
        error: 'Corte no encontrado' 
      });
    }
    
    await Corte.findByIdAndDelete(req.params.id);
    
    res.json({ 
      message: 'Corte eliminado exitosamente',
      corteId: corte.corteId 
    });
    
  } catch (error) {
    console.error('Error deleting corte:', error);
    res.status(500).json({ 
      error: 'Error al eliminar el corte',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;