import express from "express";
import { createRequire } from "module";


import requireAuth from "../middleware/requireAuth.js";
import requireAdmin from "../middleware/requireAdmin.js";
import tiendaController from "../controllers/tiendaController.js";

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

export default router;