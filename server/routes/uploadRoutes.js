// handles Vercel Blob uploads

import express from "express";
import { handleUpload } from "@vercel/blob/client";
import requireAuth from "../middleware/requireAuth.js";

const router = express.Router();
router.post("/upload", async (req, res) => {
  try {
    const body = req.body;
    
    let token = null;
    if (body.payload) {
      try {
        const payload = JSON.parse(body.payload);
        token = payload.token;
      } catch (e) {
        console.error("Error parsing payload:", e);
      }
    }

    if (!token) {
      return res.status(401).json({ 
        error: "No autorizado - Token requerido" 
      });
    }

    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        return {
          allowedContentTypes: [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp'
          ],
          maximumSizeInBytes: 10 * 1024 * 1024,
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log('Upload completed:', blob.url);
      },
    });

    return res.json(jsonResponse);
  } catch (error) {
    console.error("Error in upload handler:", error);
    return res.status(500).json({ 
      error: "Error al procesar la subida",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;