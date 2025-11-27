import express from "express";
import {
  crearShow,
  generarTickets,
  asignarTickets,
  listarShows
} from "../controllers/shows.controller.js";
import { authMiddleware, requireRole } from "../config/auth.js";

const router = express.Router();

router.get("/", authMiddleware, listarShows);
router.post("/", authMiddleware, requireRole("ADMIN"), crearShow);
router.post("/:id/generate", authMiddleware, requireRole("ADMIN"), generarTickets);
router.post("/:id/assign-tickets", authMiddleware, requireRole("ADMIN"), asignarTickets);

export default router;
