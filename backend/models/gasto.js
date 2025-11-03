import mongoose from "mongoose";

const gastoSchema = new mongoose.Schema({
  tipo: { type: String, required: true },
  categoria: { type: String, required: true },
  descripcion: { type: String, required: true },
  monto: { type: Number, required: true },
  fecha: { type: Date },
  fechaRenovacion: { type: Date },
  frecuencia:{
    type: String, 
    enum: ["", "Semanal", "Mensual", "Anual"], 
    default: "" 
  },
}, { timestamps: true });

export default mongoose.model("Gasto", gastoSchema);