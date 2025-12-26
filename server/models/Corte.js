import mongoose from 'mongoose';

const MarcaBreakdownSchema = new mongoose.Schema({
  marcaName: { type: String, required: true },
  contratoType: { 
    type: String, 
    enum: ["DCE", "Porcentaje", "Piso", "Estetica Unisex"],
    required: true
  },
  contratoValue: { type: Number, default: 0 },
  totalMarca: { type: Number, required: true },
  numVentas: { type: Number, required: true }
});

const CorteSchema = new mongoose.Schema({
  corteId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  totalVentas: { type: Number, default: 0 },
  totalComisiones: { type: Number, default: 0 },
  totalMarcas: { type: Number, default: 0 },
  totalTienda: { type: Number, default: 0 },
  totalSalidas: { type: Number, default: 0 },
  marcas: [MarcaBreakdownSchema],
  numVentas: { type: Number, default: 0 },
  numSalidas: { type: Number, default: 0 },
  ventas: [{ type: mongoose.Schema.Types.ObjectId, ref: "Venta" }],
  salidas: [{ type: mongoose.Schema.Types.ObjectId, ref: "Salida" }],
  generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
}, {
  timestamps: true
});

export default mongoose.model("Corte", CorteSchema);