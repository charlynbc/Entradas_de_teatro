import express from "express";
import { crearUsuario } from "../controllers/users.controller.js";
import { authMiddleware, requireRole } from "../config/auth.js";

const router = express.Router();

// solo ADMIN puede crear usuarios
router.post("/create", authMiddleware, requireRole("ADMIN"), crearUsuario);

export default router;
