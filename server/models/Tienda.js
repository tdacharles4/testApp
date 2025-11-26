import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema({
  clave: String,
  name: String,
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
  products: [ProductSchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
});

export default mongoose.model("Tienda", TiendaSchema);