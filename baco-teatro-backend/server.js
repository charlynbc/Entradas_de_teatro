import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { db } from "./db.js";

import authRoutes from "./routes/auth.routes.js";
import usersRoutes from "./routes/users.routes.js";
import showsRoutes from "./routes/shows.routes.js";
import ticketsRoutes from "./routes/tickets.routes.js";
import reportesRoutes from "./routes/reportes.routes.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.send("API Baco Teatro OK ✅");
});

app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Rutas con prefijo /api/
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/shows", showsRoutes);
app.use("/api/tickets", ticketsRoutes);
app.use("/api/reportes", reportesRoutes);

// Error 404
app.use((req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

// Error handler global
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({ error: "Error interno del servidor" });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor Baco Teatro escuchando en puerto ${PORT}`);
  console.log(`📍 http://localhost:${PORT}`);
  
  // Test DB connection
  db.query("SELECT NOW()")
    .then(() => console.log("✅ Base de datos conectada"))
    .catch(err => console.error("❌ Error conectando a BD:", err.message));
});
