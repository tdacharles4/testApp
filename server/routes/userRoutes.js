import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import requireAuth from "../middleware/requireAuth.js";
import requireAdmin from "../middleware/requireAdmin.js";
import connectDB from "../config/db.js"; // Add this import

const router = express.Router();

// Middleware to ensure DB connection for user routes
const ensureDB = async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error("Database connection error in user routes:", error);
    res.status(500).json({ 
      success: false,
      error: "Error de conexión con la base de datos" 
    });
  }
};

// Apply DB connection middleware to all user routes
router.use(ensureDB);

// Create new user (Admin only)
router.post("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { username, password, name, role, permissions, tiendaId, tiendaName } = req.body;
    
    // Validate required fields
    if (!username || !password || !name) {
      return res.status(400).json({ 
        success: false,
        error: 'Username, password y nombre son obligatorios' 
      });
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({ 
        success: false,
        error: 'La contraseña debe tener al menos 6 caracteres' 
      });
    }

    // Validate username format (alphanumeric)
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username)) {
      return res.status(400).json({ 
        success: false,
        error: 'Username solo puede contener letras, números y guiones bajos' 
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        error: 'El usuario ya existe' 
      });
    }

    // Validate role
    const validRoles = ['admin', 'user', 'manager'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ 
        success: false,
        error: `Rol inválido. Roles válidos: ${validRoles.join(', ')}` 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({
      username,
      password: hashedPassword,
      name,
      role: role || "user",
      permissions: permissions || {
        administrador: false,
        tienda: false
      },
      ...(tiendaId && { tiendaId, tiendaName }),
      createdBy: req.user._id // Track who created this user
    });

    await newUser.save();
    
    // Don't send password back
    const userResponse = newUser.toObject();
    delete userResponse.password;
    
    res.status(201).json({
      success: true,
      message: "Usuario creado exitosamente",
      user: userResponse
    });
  } catch (error) {
    console.error("Error creating user:", error);
    
    let errorMessage = 'Error al crear usuario';
    let statusCode = 500;
    
    if (error.name === 'ValidationError') {
      errorMessage = 'Datos de usuario inválidos';
      statusCode = 400;
    }
    
    res.status(statusCode).json({ 
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get all users (Admin only)
router.get("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    // Optional pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    
    // Optional search/filter
    const { search, role, tiendaId } = req.query;
    const filter = {};
    
    if (search) {
      filter.$or = [
        { username: new RegExp(search, 'i') },
        { name: new RegExp(search, 'i') },
        { tiendaName: new RegExp(search, 'i') }
      ];
    }
    
    if (role) filter.role = role;
    if (tiendaId) filter.tiendaId = tiendaId;
    
    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(filter)
    ]);
    
    res.status(200).json({
      success: true,
      count: users.length,
      total,
      pagination: {
        page,
        limit,
        pages: Math.ceil(total / limit)
      },
      users
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ 
      success: false,
      error: 'Error al obtener usuarios',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get current user profile
router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'Usuario no encontrado' 
      });
    }
    
    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ 
      success: false,
      error: 'Error al obtener perfil de usuario',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get single user by ID (Admin only)
router.get("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'Usuario no encontrado' 
      });
    }
    
    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        success: false,
        error: 'ID de usuario inválido' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Error al obtener usuario',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update user (Admin only)
router.put("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { password, ...updateData } = req.body;
    
    // Validate username if being updated
    if (updateData.username) {
      const usernameRegex = /^[a-zA-Z0-9_]+$/;
      if (!usernameRegex.test(updateData.username)) {
        return res.status(400).json({ 
          success: false,
          error: 'Username solo puede contener letras, números y guiones bajos' 
        });
      }
      
      // Check if username is taken by another user
      const existingUser = await User.findOne({ 
        username: updateData.username,
        _id: { $ne: req.params.id }
      });
      
      if (existingUser) {
        return res.status(400).json({ 
          success: false,
          error: 'El username ya está en uso por otro usuario' 
        });
      }
    }
    
    // Hash new password if provided
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ 
          success: false,
          error: 'La contraseña debe tener al menos 6 caracteres' 
        });
      }
      updateData.password = await bcrypt.hash(password, 10);
    }
    
    // Add updatedBy tracking
    updateData.updatedBy = req.user._id;
    
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!updatedUser) {
      return res.status(404).json({ 
        success: false,
        error: 'Usuario no encontrado' 
      });
    }
    
    res.status(200).json({
      success: true,
      message: "Usuario actualizado exitosamente",
      user: updatedUser
    });
  } catch (error) {
    console.error("Error updating user:", error);
    
    let errorMessage = 'Error al actualizar usuario';
    let statusCode = 500;
    
    if (error.name === 'ValidationError') {
      errorMessage = 'Datos de usuario inválidos';
      statusCode = 400;
    } else if (error.name === 'CastError') {
      errorMessage = 'ID de usuario inválido';
      statusCode = 400;
    }
    
    res.status(statusCode).json({ 
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update own profile (non-admin users)
router.put("/me/update", requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword, name } = req.body;
    const updateData = {};
    
    // Only allow updating name and password for non-admins
    if (name) updateData.name = name;
    
    // If changing password, verify current password first
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ 
          success: false,
          error: 'La contraseña actual es requerida para cambiar la contraseña' 
        });
      }
      
      if (newPassword.length < 6) {
        return res.status(400).json({ 
          success: false,
          error: 'La nueva contraseña debe tener al menos 6 caracteres' 
        });
      }
      
      const user = await User.findById(req.user._id);
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      
      if (!isValidPassword) {
        return res.status(401).json({ 
          success: false,
          error: 'Contraseña actual incorrecta' 
        });
      }
      
      updateData.password = await bcrypt.hash(newPassword, 10);
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true }
    ).select('-password');
    
    res.json({
      success: true,
      message: "Perfil actualizado exitosamente",
      user: updatedUser
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ 
      success: false,
      error: 'Error al actualizar perfil',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Delete user (Admin only)
router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    // Prevent deleting yourself
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ 
        success: false,
        error: 'No puedes eliminar tu propio usuario' 
      });
    }
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'Usuario no encontrado' 
      });
    }
    
    // Prevent deleting the last admin
    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({ 
          success: false,
          error: 'No se puede eliminar el último administrador' 
        });
      }
    }
    
    await User.findByIdAndDelete(req.params.id);
    
    res.status(200).json({ 
      success: true,
      message: 'Usuario eliminado exitosamente',
      username: user.username,
      name: user.name
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        success: false,
        error: 'ID de usuario inválido' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Error al eliminar usuario',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Optional: Get user statistics (Admin only)
router.get("/stats/summary", requireAuth, requireAdmin, async (req, res) => {
  try {
    const [totalUsers, adminCount, userCount, managerCount] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'manager' })
    ]);
    
    // Recent users (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentUsers = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });
    
    res.json({
      success: true,
      stats: {
        totalUsers,
        byRole: {
          admin: adminCount,
          user: userCount,
          manager: managerCount
        },
        recentUsers,
        usersPerDay: recentUsers / 30 // Average
      }
    });
  } catch (error) {
    console.error("Error fetching user stats:", error);
    res.status(500).json({ 
      success: false,
      error: 'Error al obtener estadísticas de usuarios',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;