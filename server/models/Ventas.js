import mongoose from "mongoose";

const VentaSchema = new mongoose.Schema({
  store: { type: String, required: true },
  item: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  amount: { type: Number, required: true },
  originalPrice: { type: Number }, // Add this
  discountAmount: { type: Number, default: 0 }, // Add this
  discountPercentage: { type: Number, default: 0 }, // Add this
  discountType: { type: String, default: "none" }, // "none", "percentage", "fixed"
  date: { type: String, required: true }
});

export default mongoose.model("Venta", VentaSchema);