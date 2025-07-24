const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

// CORS configuration
const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'https://tempwall-1.onrender.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

// Body parser configuration
const bodyParserConfig = {
  json: { limit: '50mb' },
  urlencoded: { limit: '50mb', extended: true }
};

// Multer configuration for file uploads
const multerConfig = {
  storage: require('multer').memoryStorage(),
  limits: {
    fileSize: 30 * 1024 * 1024 // 30MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check if file is an image
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'));
    }
  }
};

module.exports = {
  corsOptions,
  bodyParserConfig,
  multerConfig
};
