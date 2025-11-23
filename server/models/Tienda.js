import mongoose from "mongoose";

const TiendaSchema = new mongoose.Schema({
  name: String,
  tag: String,
  products: [
    {
      name: String,
      imageUrl: String,
    }
  ],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
});

const Tienda = mongoose.model("Tienda", TiendaSchema);

export default Tienda;