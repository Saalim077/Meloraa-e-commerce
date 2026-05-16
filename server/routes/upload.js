const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect, authorize } = require('../middleware/auth');

const uploadDir = path.join(__dirname, '..', 'uploads');
try {
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
} catch (err) {
  console.warn('Vercel read-only filesystem detected, skipping local upload directory creation.');
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) return cb(null, true);
    cb(new Error('Only images allowed'));
  },
});

router.post('/', protect, authorize('admin', 'staff'), upload.array('images', 8), (req, res) => {
  const urls = req.files.map(f => `/uploads/${f.filename}`);
  res.json({ success: true, urls });
});

router.delete('/', protect, authorize('admin', 'staff'), (req, res) => {
  try {
    const filename = path.basename(req.body.filename);
    const filePath = path.join(uploadDir, filename);
    const resolved = path.resolve(filePath);
    if (!resolved.startsWith(path.resolve(uploadDir))) {
      return res.status(400).json({ success: false, message: 'Invalid filename' });
    }
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    res.json({ success: true, message: 'File deleted' });
  } catch {
    res.json({ success: true, message: 'File not found' });
  }
});

module.exports = router;
