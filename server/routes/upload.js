const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { protect, authorize } = require('../middleware/auth');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Setup Cloudinary Storage for Multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'luxe-store',
    allowed_formats: ['jpeg', 'jpg', 'png', 'gif', 'webp'],
    // Automatically resize huge images so they load fast
    transformation: [{ width: 1200, height: 1200, crop: 'limit' }]
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// POST /api/upload
router.post('/', protect, authorize('admin', 'staff'), upload.array('images', 8), (req, res) => {
  try {
    // Cloudinary returns the full permanent URL inside `req.file.path`
    const urls = req.files.map(f => f.path);
    res.json({ success: true, urls });
  } catch (err) {
    console.error('Upload Error:', err);
    res.status(500).json({ success: false, message: 'Failed to upload images' });
  }
});

// DELETE /api/upload
router.delete('/', protect, authorize('admin', 'staff'), async (req, res) => {
  try {
    const imageUrl = req.body.filename;
    if (!imageUrl || !imageUrl.includes('cloudinary.com')) {
      return res.status(400).json({ success: false, message: 'Invalid Cloudinary URL' });
    }

    // Extract the public ID from the URL (e.g. "luxe-store/xyz")
    const urlParts = imageUrl.split('/');
    const filename = urlParts[urlParts.length - 1].split('.')[0]; // xyz
    const folder = urlParts[urlParts.length - 2]; // luxe-store
    const publicId = `${folder}/${filename}`;

    // Delete it from Cloudinary servers
    await cloudinary.uploader.destroy(publicId);
    
    res.json({ success: true, message: 'File deleted from Cloudinary' });
  } catch (err) {
    console.error('Delete Error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete file' });
  }
});

module.exports = router;
