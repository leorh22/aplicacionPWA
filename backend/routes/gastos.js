import express from "express";
import Gasto from "../models/gasto.js";

const router = express.Router();

// Crear gasto
router.post("/", async (req, res) => {
  try {
    const gasto = new Gasto(req.body);
    await gasto.save();
    res.status(201).json(gasto);
    console.log("Nuevo registro creado");
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al guardar gasto" });
  }
});

// Obtener todos
router.get("/", async (req, res) => {
  const gastos = await Gasto.find().sort({ createdAt: -1 });
  res.json(gastos);
});

// Eliminar
router.delete("/:id", async (req, res) => {
  await Gasto.findByIdAndDelete(req.params.id);
  res.json({ mensaje: "Gasto eliminado" });
  console.log("Registro eliminado");
});

// Editar
router.patch("/:id", async (req, res) => {
  const gasto = await Gasto.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(gasto);
});

export default router;
