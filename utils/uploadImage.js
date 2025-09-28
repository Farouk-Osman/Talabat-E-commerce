// eslint-disable-next-line import/no-extraneous-dependencies
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ApiError = require('./apiError');

// Ensure upload directories exist
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

// Choose storage: memory (default) or disk via env UPLOAD_STORAGE=disk
const getStorage = (folder = 'uploads') => {
  const mode = process.env.UPLOAD_STORAGE || 'memory';
  ensureDir(folder);
  if (mode === 'disk') {
    return multer.diskStorage({
      destination: (req, file, cb) => cb(null, folder),
      filename: (req, file, cb) => {
        const ext = path.extname(file.originalname) || '.jpeg';
        const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
        cb(null, name);
      },
    });
  }
  // default memory storage
  return multer.memoryStorage();
};

const multerOptions = (folder = '.') => {
  const storage = getStorage(folder);

  const multerFilter = function (req, file, cb) {
    if (file.mimetype && file.mimetype.startsWith('image')) {
      cb(null, true);
    } else {
      cb(new ApiError('Only images are allowed!', 400), false);
    }
  };

  // Default limits (can be overridden)
  const limits = {
    fileSize: 2 * 1024 * 1024, // 2MB per file
  };

  const upload = multer({ storage, fileFilter: multerFilter, limits });
  return upload;
};

// Single file
exports.uploadSingleImage = (fieldName, folder = 'uploads') =>
  multerOptions(folder).single(fieldName);

// Multiple files array
exports.uploadMultipleImages = (fieldName, maxCount = 5, folder = 'uploads') =>
  multerOptions(folder).array(fieldName, maxCount);

// Fields (mix) - default for products
exports.uploadProductImages = (folder = 'uploads/products') => {
  ensureDir(folder);
  const upload = multerOptions(folder);
  return upload.fields([
    { name: 'imageCover', maxCount: 1 },
    { name: 'images', maxCount: 5 },
  ]);
};

// Helper: single brand image upload
exports.uploadBrandImage = (fieldName = 'image', folder = 'uploads/brands') => {
  ensureDir(folder);
  return multerOptions(folder).single(fieldName);
};

// Helper: category image upload
exports.uploadCategoryImage = (
  fieldName = 'image',
  folder = 'uploads/categories'
) => {
  ensureDir(folder);
  return multerOptions(folder).single(fieldName);
};
