const multer = require('multer');
const path = require('path');
const fs = require('fs');

const createUploader = (options = {}) => {
  const {
    destination = 'uploads',
    prefix = 'file',
    allowedMimeTypes = /jpeg|jpg|png|gif/,
    maxFileSize = 5 * 1024 * 1024 // 5MB
  } = options;

  // Cria o diretório se não existir
  const uploadDir = path.join(__dirname, `../${destination}`);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, `${prefix}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
  });

  return multer({
    storage,
    limits: { fileSize: maxFileSize },
    fileFilter: (req, file, cb) => {
      const mimetype = allowedMimeTypes.test(file.mimetype);
      const extname = allowedMimeTypes.test(path.extname(file.originalname).toLowerCase());
      
      if (mimetype && extname) {
        return cb(null, true);
      }
      cb(new Error(`Apenas arquivos do tipo ${allowedMimeTypes} são permitidos`));
    }
  });
};

module.exports = createUploader;