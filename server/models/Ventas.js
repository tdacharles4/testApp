import mongoose from "mongoose";

const VentaSchema = new mongoose.Schema({
  store: { type: String, required: true },
  item: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  amount: { type: Number, required: true },
  originalPrice: { type: Number },
  discountAmount: { type: Number, default: 0 },
  discountPercentage: { type: Number, default: 0 },
  discountType: { type: String, default: "none" },
  // Add payment method amounts
  amountEfectivo: { type: Number, default: 0 },
  amountTarjeta: { type: Number, default: 0 },
  amountTransferencia: { type: Number, default: 0 },
  date: { type: String, required: true }
});

export default mongoose.model("Venta", VentaSchema);