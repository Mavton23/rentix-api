const createUploader = require('./multer-config');

const uploadPostImage = createUploader({
  destination: 'uploads/posts',
  prefix: 'post',
  maxFileSize: 10 * 1024 * 1024 // 10MB para imagens de posts
});

module.exports = uploadPostImage.single('image');