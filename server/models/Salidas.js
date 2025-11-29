import mongoose from "mongoose";

const SalidaSchema = new mongoose.Schema({
  salidaId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  monto: { 
    type: Number, 
    required: true 
  },
  concepto: { 
    type: String, 
    required: true 
  },
  pago: { 
    type: String, 
    required: true,
    maxlength: 140
  },
  fecha: { 
    type: Date, 
    required: true 
  },
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  }
}, {
  timestamps: true
});

export default mongoose.model("Salida", SalidaSchema);