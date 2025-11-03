/*import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import gastosRoutes from "./routes/gastos.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());

// Servir frontend
app.use(express.static(path.join(__dirname, "../frontend")));

// Conexión MongoDB
mongoose.connect("mongodb+srv://leonardorhti22_db_user:Dc3ABh38Iy3IolWt@cluster0.timkio0.mongodb.net/?appName=Cluster0")
  .then(() => console.log("Conectado a MongoDB Atlas"))
  .catch(err => console.error("Error al conectar a MongoDB:", err));

// Rutas API
app.use("/api/gastos", gastosRoutes);

// Puerto
app.listen(3000, () => console.log("Servidor en http://localhost:3000"));*/

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import gastosRoutes from "./routes/gastos.js";

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
  console.error("❌ ERROR: No se encontró MONGO_URI en el archivo .env");
  process.exit(1);
}

mongoose
  .connect(mongoURI)
  .then(() => console.log("Conectado a MongoDB Atlas"))
  .catch(err => console.error("Error al conectar a MongoDB:", err));

// Rutas API
app.use("/api/gastos", gastosRoutes);

// Puerto dinámico (Render asigna uno automáticamente)
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));

