import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema({
  clave: String,
  name: String,
  description: String,
  imageUrl: String,
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
    required: true
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
    maxlength: 500
  },
  location: String,
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
  contacto: String,
  banco: String,
  numeroCuenta: String,
  clabe: String,
  tarjeta: String,
  
  products: [ProductSchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
});

export default mongoose.model("Tienda", TiendaSchema);