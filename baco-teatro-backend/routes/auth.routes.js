import express from "express";
import { login, completarRegistro } from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/login", login);
router.post("/completar-registro", completarRegistro);

export default router;
