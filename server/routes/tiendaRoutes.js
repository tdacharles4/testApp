import express from "express";
import { createRequire } from "module";

import requireAuth from "../middleware/requireAuth.js";
import requireAdmin from "../middleware/requireAdmin.js";
import tiendaController from "../controllers/tiendaController.js";
import Tienda from "../models/Tienda.js";

const require = createRequire(import.meta.url);
const multer = require("multer");

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post(
  "/",
  requireAuth,
  requireAdmin,
  upload.array("productImages", 10),
  tiendaController.createStore
);

router.get("/", async (req, res) => {
  try {
    const tiendas = await Tienda.find(); 
    res.json(tiendas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;