import express from "express";
import { handleUpload } from "@vercel/blob/client";
import cors from "cors";

const router = express.Router();

// Add CORS middleware
router.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

router.post("/upload", async (req, res) => {
  console.log('📤 Upload route called');
  console.log('📦 Request body keys:', Object.keys(req.body));
  console.log('🔑 Headers:', req.headers);
  
  try {
    const body = req.body;
    
    // Debug the payload
    console.log('📝 Raw body payload:', body.payload);
    
    let token = null;
    if (body.payload) {
      try {
        const payload = JSON.parse(body.payload);
        token = payload.token;
        console.log('✅ Token extracted:', token ? 'Yes' : 'No');
      } catch (e) {
        console.error("❌ Error parsing payload:", e);
      }
    }

    if (!token) {
      console.log('❌ No token provided');
      return res.status(401).json({ 
        error: "No autorizado - Token requerido" 
      });
    }

    // Add token validation if you have user authentication
    // const user = verifyToken(token); // Uncomment if you have this
    
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
          maximumSizeInBytes: 10 * 1024 * 1024,
          tokenPayload: JSON.stringify({ uploadedFrom: 'your-app' }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log('✅ Upload completed!');
        console.log('📎 Blob URL:', blob.url);
        console.log('📦 Blob object:', blob);
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