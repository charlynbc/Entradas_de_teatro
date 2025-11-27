import express from "express";
import {
  ventasPorVendedor,
  deudaActores,
  resumenFuncion
} from "../controllers/reportes.controller.js";
import { authMiddleware, requireRole } from "../config/auth.js";

const router = express.Router();

router.get("/show/:id/vendedores", authMiddleware, requireRole("ADMIN"), ventasPorVendedor);
router.get("/show/:id/deudas", authMiddleware, requireRole("ADMIN"), deudaActores);
router.get("/show/:id/resumen", authMiddleware, requireRole("ADMIN"), resumenFuncion);

export default router;
