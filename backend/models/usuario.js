// models/usuario.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const usuarioSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true }
  },
  { timestamps: true }
);

// Hashear password antes de guardar
usuarioSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Método para comparar contraseña
usuarioSchema.methods.compararPassword = async function (passwordPlano) {
  return bcrypt.compare(passwordPlano, this.password);
};

export default mongoose.model("Usuario", usuarioSchema);
