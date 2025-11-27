import express from "express";
import Presupuesto from "../models/presupuesto.js";

const router = express.Router();

// GET /api/presupuestos  -> todos los presupuestos (puedes filtrar luego si quieres)
router.get("/", async (req, res) => {
  try {
    const lista = await Presupuesto.find().sort({ creadoEn: -1 });
    res.json(lista);
  } catch (err) {
    console.error("Error al obtener presupuestos:", err);
    res.status(500).json({ error: "No se pudieron obtener los presupuestos" });
  }
});

// POST /api/presupuestos  -> crear nuevo presupuesto
router.post("/", async (req, res) => {
  try {
    let { categoria, monto, mes, año } = req.body;

    monto = Number(monto);
    mes = Number(mes);
    año = Number(año);

    if (!categoria || isNaN(monto) || isNaN(mes) || isNaN(año)) {
      return res.status(400).json({
        error: "Datos incompletos o inválidos",
        detalle: { categoria, monto, mes, año }
      });
    }

    const nuevo = await Presupuesto.create({ categoria, monto, mes, año });
    console.log("Presupuesto creado:", nuevo);

    res.status(201).json(nuevo);
  } catch (err) {
    console.error("Error al crear presupuesto:", err);
    res.status(500).json({ error: "No se pudo guardar el presupuesto" });
  }
});

// PATCH /api/presupuestos/:id  -> actualizar presupuesto existente
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    let { categoria, monto, mes, año } = req.body;

    const datosActualizados = {};

    if (categoria !== undefined) datosActualizados.categoria = categoria;
    if (monto !== undefined) datosActualizados.monto = Number(monto);
    if (mes !== undefined) datosActualizados.mes = Number(mes);
    if (año !== undefined) datosActualizados.año = Number(año);

    const actualizado = await Presupuesto.findByIdAndUpdate(
      id,
      datosActualizados,
      { new: true }
    );

    if (!actualizado) {
      return res.status(404).json({ error: "Presupuesto no encontrado" });
    }

    console.log("Presupuesto actualizado:", actualizado);
    res.json(actualizado);
  } catch (err) {
    console.error("Error al actualizar presupuesto:", err);
    res.status(500).json({ error: "No se pudo actualizar el presupuesto" });
  }
});

export default router;