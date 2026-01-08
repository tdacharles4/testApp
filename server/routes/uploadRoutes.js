// uploadRoutes.js - handles Vercel Blob uploads with CORS

import express from "express";
import { handleUpload } from "@vercel/blob/client";
import cors from "cors";

const router = express.Router();

// Dynamic CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'https://eu.cienciasexactas.com',
  'https://cienciasexactas.com',
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

// Handle preflight requests
router.options("/upload", (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || allowedOrigins[0]);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.status(200).end();
});

// Upload endpoint
router.post("/upload", async (req, res) => {
  console.log('📤 Upload route called from origin:', req.headers.origin);
  console.log('🔑 Headers:', {
    authorization: req.headers.authorization,
    'content-type': req.headers['content-type']
  });
  
  try {
    const body = req.body;
    
    // Debug the entire body
    console.log('📦 Full request body:', JSON.stringify(body, null, 2));
    
    let token = null;
    
    // Try multiple ways to get the token
    if (body.payload) {
      try {
        console.log('🔍 Parsing payload:', body.payload);
        const payload = JSON.parse(body.payload);
        console.log('📝 Parsed payload:', payload);
        token = payload.token;
      } catch (e) {
        console.error("❌ Error parsing payload:", e);
      }
    }
    
    // Also check Authorization header
    if (!token && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
        console.log('🔑 Got token from Authorization header');
      }
    }
    
    console.log('✅ Token found?', token ? `Yes (length: ${token.length})` : 'No');

    // TEMPORARY: For testing, allow uploads without token
    // Remove this in production
    const TEST_MODE = process.env.NODE_ENV !== 'production';
    if (!token && TEST_MODE) {
      console.log('⚠️ TEST MODE: Allowing upload without token');
      // Continue without token validation for testing
    } else if (!token) {
      console.log('❌ No token provided');
      return res.status(401).json({ 
        error: "No autorizado - Token requerido",
        receivedPayload: body.payload,
        hasAuthHeader: !!req.headers.authorization
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
            timestamp: new Date().toISOString(),
            clientToken: token ? 'provided' : 'not-provided'
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log('✅ Upload completed!');
        console.log('📎 Blob URL:', blob.url);
        console.log('📦 Blob object:', {
          url: blob.url,
          pathname: blob.pathname,
          downloadUrl: blob.downloadUrl,
          size: blob.size
        });
      },
    });

    console.log('📨 Sending response:', jsonResponse);
    
    return res.json(jsonResponse);
  } catch (error) {
    console.error("❌ Error in upload handler:", error);
    console.error("❌ Error message:", error.message);
    
    return res.status(500).json({ 
      error: "Error al procesar la subida",
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

export default router;