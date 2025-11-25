import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema({
  clave: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String
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
  products: [ProductSchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
});

export default mongoose.model("Tienda", TiendaSchema);