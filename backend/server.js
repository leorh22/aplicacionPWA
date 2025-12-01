import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import gastosRoutes from "./routes/gastos.js";
import presupuestoRoutes from "./routes/presupuestos.js";
import { routerNotificaciones } from "./routes/notificaciones.js";
import { requireAuth } from "./middlewares/auth.js";
import authRouter from "./routes/auth.js";

dotenv.config(); // Cargar variables del archivo .env


const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());

// Servir frontend (solo si quieres probarlo en local con un único servidor)
app.use(express.static(path.join(__dirname, "../frontend")));


// === Conexión con MongoDB Atlas usando variable de entorno ===
const mongoURI = process.env.MONGO_URI;

if (!mongoURI) {
  console.error("ERROR: No se encontró MONGO_URI en el archivo .env");
  process.exit(1);
}

mongoose
  .connect(mongoURI)
  .then(() => console.log("Conectado a MongoDB Atlas"))
  .catch(err => console.error("Error al conectar a MongoDB:", err));

app.use("/api/auth", authRouter);

// Rutas API
app.use("/api/gastos", requireAuth, gastosRoutes);
app.use("/api/presupuestos", requireAuth, presupuestoRoutes);
app.use("/api/notificaciones", requireAuth, routerNotificaciones);

// Puerto dinámico (Render asigna uno automáticamente)
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));

