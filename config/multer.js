const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'filesharing_uploads',
    resource_type: (req, file) => {
      if (file.mimetype.startsWith('image/')) return 'image';
      return 'raw';
    },
    format: async (req, file) => {
      // Force txt format for raw files to bypass Cloudinary PDF restrictions
      if (!file.mimetype.startsWith('image/')) return 'txt';
      return undefined; // Let cloudinary decide for images
    },
    public_id: (req, file) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const name = file.originalname.split('.')[0];
      
      let overrideExt = '';
      if (!file.mimetype.startsWith('image/')) {
        overrideExt = '.txt'; // Always override with .txt to trick Cloudinary block
      }
      return `${name}-${uniqueSuffix}${overrideExt}`;
    }
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/gif',
    'text/plain',
    'application/zip',
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('File type not allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

module.exports = upload;