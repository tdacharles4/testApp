import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema({
  clave: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ""
  },
  imageUrl: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    default: 0
  },
  price: {
    type: Number,
    required: true,
    default: 0
  },
  fechaSubida: {
    type: Date,
    default: Date.now
  },
  fechaRecepcion: {
    type: Date,
    required: true,
    default: Date.now
  }
});

const TiendaSchema = new mongoose.Schema({
  tag: {
    type: String,
    required: true,
    unique: true,
    maxlength: 4,
    uppercase: true,
  },
  name: {
    type: String,
    required: true,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 500,
    default: ""
  },
  location: {
    type: String,
    default: ""
  },
  // Tipo de Contrato
  contractType: {
    type: String,
    required: true,
    enum: ["DCE", "Porcentaje", "Piso", "Estetica Unisex"]
  },
  contractValue: {
    type: Number,
    default: 0
  },
  // Informacion bancaria y de contacto
  contacto: {
    type: String,
    default: ""
  },
  banco: {
    type: String,
    default: ""
  },
  numeroCuenta: {
    type: String,
    default: ""
  },
  clabe: {
    type: String,
    default: ""
  },
  tarjeta: {
    type: String,
    default: ""
  },
  
  products: [ProductSchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

export default mongoose.model("Tienda", TiendaSchema);