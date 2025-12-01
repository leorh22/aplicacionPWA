// routes/auth.js
import express from "express";
import jwt from "jsonwebtoken";
import Usuario from "../models/usuario.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "fintrack-super-secreto";
const JWT_EXPIRES_IN = "7d";

// POST /api/auth/register  (opcional, para crear el primer usuario)
router.post("/register", async (req, res) => {
  try {
    const { nombre, email, password } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({ error: "Faltan datos" });
    }

    const existe = await Usuario.findOne({ email });
    if (existe) {
      return res.status(400).json({ error: "Ese correo ya está registrado" });
    }

    const usuario = await Usuario.create({ nombre, email, password });

    res.status(201).json({
      mensaje: "Usuario creado",
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email
      }
    });
  } catch (err) {
    console.error("Error en register:", err);
    res.status(500).json({ error: "Error al registrar usuario" });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Faltan credenciales" });
    }

    const usuario = await Usuario.findOne({ email });
    if (!usuario) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const ok = await usuario.compararPassword(password);
    if (!ok) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const token = jwt.sign(
      { id: usuario._id, email: usuario.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      token,
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email
      }
    });
  } catch (err) {
    console.error("Error en login:", err);
    res.status(500).json({ error: "Error al iniciar sesión" });
  }
});

export default router;
