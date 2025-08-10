const createUploader = require('./multer-config');

const uploadAvatar = createUploader({
  destination: 'uploads/avatars',
  prefix: 'avatar'
});

module.exports = uploadAvatar.single('avatar');