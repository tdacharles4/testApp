import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, "El usuario es obligatorio"],
    unique: true,
    trim: true,
    minlength: 3,
  },

  password: {
    type: String,
    required: [true, "La contraseña es obligatoria"],
  },

  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  }
}, { timestamps: true });

export default mongoose.model("User", UserSchema);