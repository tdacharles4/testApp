// uploadRoutes.js - handles Vercel Blob uploads with CORS

import express from "express";
import { handleUpload } from "@vercel/blob/client";
import cors from "cors";

const router = express.Router();

// Dynamic CORS configuration
const allowedOrigins = [
    "https://test-app-omega-teal.vercel.app",
    "http://localhost:3000",
    "https://eu.cienciasexactas.com"
];

// Apply CORS middleware
router.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

router.options("/upload", (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || allowedOrigins[0]);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.status(200).end();
});

router.post("/upload", async (req, res) => {
  console.log('📤 Upload route called from origin:', req.headers.origin);
  
  try {
    const body = req.body;

    console.log('📦 Request body keys:', Object.keys(body));
    console.log('🔑 Has payload?', !!body.payload);
    
    let token = null;
    if (body.payload) {
      try {
        const payload = JSON.parse(body.payload);
        token = payload.token;
        console.log('✅ Token extracted:', token ? 'Yes (length: ' + token.length + ')' : 'No');
      } catch (e) {
        console.error("❌ Error parsing payload:", e);
      }
    }

    if (!token) {
      console.log('❌ No token provided');
      return res.status(401).json({ 
        error: "No autorizado - Token requerido",
        receivedPayload: body.payload
      });
    }

    console.log('🚀 Calling handleUpload...');
    
    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        console.log('🔐 Generating token for:', pathname);
        return {
          allowedContentTypes: [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp'
          ],
          maximumSizeInBytes: 10 * 1024 * 1024, // 10MB
          tokenPayload: JSON.stringify({ 
            uploadedFrom: 'your-app',
            timestamp: new Date().toISOString()
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log('✅ Upload completed!');
        console.log('📎 Blob URL:', blob.url);
        console.log('📦 Blob object keys:', Object.keys(blob));
      },
    });

    console.log('📨 Sending response:', jsonResponse);
    
    return res.json(jsonResponse);
  } catch (error) {
    console.error("❌ Error in upload handler:", error);
    console.error("❌ Error stack:", error.stack);
    
    return res.status(500).json({ 
      error: "Error al procesar la subida",
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

export default router;