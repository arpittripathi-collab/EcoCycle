import express from 'express';
import multer from 'multer';
import path from 'path';
import { createItem, getItems } from '../controllers/itemController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Multer storage configuration (remains the same)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.fieldname}${path.extname(file.originalname)}`);
  }
});

// Updated Multer configuration with file size limit
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 1 // 1 MB limit per file
  }
});

// Middleware for handling the file upload and errors
const uploadMiddleware = upload.array('images', 2);

// The POST route now includes a custom error handler for Multer
router.post('/', auth, (req, res) => {
  uploadMiddleware(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred when uploading.
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: "File is too large. Maximum size is 1MB." });
      }
      // Handle other potential Multer errors (e.g., too many files)
      return res.status(400).json({ message: err.message });
    } else if (err) {
      // An unknown error occurred.
      return res.status(500).json({ message: `An unknown error occurred: ${err.message}` });
    }

    
    createItem(req, res);
  });
});

router.get('/', auth, getItems);

export default router;