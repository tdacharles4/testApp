import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, "El usuario es obligatorio"],
    unique: true,
    trim: true,
    minlength: 3,
  },

  password: {
    type: String,
    required: [true, "La contraseña es obligatoria"],
  },

  name: {
    type: String,
    required: [true, "El nombre es obligatorio"],
    trim: true,
  },

  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },

  permissions: {
    administrador: {
      type: Boolean,
      default: false
    },

  tienda: {
      type: Boolean,
      default: false
    }
  },

  tiendaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tienda",
    default: null
  },

  tiendaName: {
    type: String,
    default: ""
  },

  token: {
    type: String,
    default: ""
  }
}, { 
  timestamps: true 
});

export default mongoose.model("User", UserSchema);