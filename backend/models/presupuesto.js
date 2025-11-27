import mongoose from "mongoose";

const presupuestoSchema = new mongoose.Schema(
  {
    // "GENERAL" para todo el mes, o nombre de categoría (Comida, Renta, etc.)
    categoria: { type: String, required: true },
    monto: { type: Number, required: true },
    mes: { type: Number, required: true },  // 1–12
    año: { type: Number, required: true },  // ej. 2024
    creadoEn: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

// Opcional: evitar duplicados por categoria+mes+año (no es obligatorio)
presupuestoSchema.index({ categoria: 1, mes: 1, año: 1 }, { unique: false });

export default mongoose.model("Presupuesto", presupuestoSchema);