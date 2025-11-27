import express from "express";
import {
  reservarTicket,
  reportarVenta,
  aprobarVentaAdmin,
  validarTicket,
  obtenerQR,
  listarTicketsPorShow
} from "../controllers/tickets.controller.js";
import { authMiddleware, requireRole } from "../config/auth.js";

const router = express.Router();

router.get("/show/:id", authMiddleware, listarTicketsPorShow);
router.get("/:code/qr", authMiddleware, obtenerQR);

router.post("/:code/reserve", authMiddleware, requireRole("VENDEDOR"), reservarTicket);
router.post("/:code/report-sold", authMiddleware, requireRole("VENDEDOR"), reportarVenta);
router.post("/:code/approve", authMiddleware, requireRole("ADMIN"), aprobarVentaAdmin);
router.post("/:code/validate", authMiddleware, requireRole("ADMIN"), validarTicket);

export default router;
