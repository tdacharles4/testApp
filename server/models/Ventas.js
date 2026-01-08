import mongoose from "mongoose";

const VentaSchema = new mongoose.Schema({
  saleId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  store: { 
    tag: { type: String, required: true },
    name: { type: String, required: true }
  },
  item: {
    clave: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true }
  },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  amount: { type: Number, required: true },
  originalPrice: { type: Number },
  discountAmount: { type: Number, default: 0 },
  discountPercentage: { type: Number, default: 0 },
  discountType: { type: String, default: "none" },
  amountEfectivo: { type: Number, default: 0 },
  amountTarjeta: { type: Number, default: 0 },
  amountTransferencia: { type: Number, default: 0 },
  storeContractType: { 
    type: String, 
    required: true,
    enum: ["DCE", "Porcentaje", "Piso", "Estetica Unisex"],
    default: "DCE"
  },
  storeContractValue: { 
    type: Number, 
    default: 0 
  },
  date: { type: String, required: true },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

export default mongoose.model("Venta", VentaSchema);