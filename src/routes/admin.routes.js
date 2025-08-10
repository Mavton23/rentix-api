const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const authorize = require('../middleware/authorize');
require('../middleware/tokens')
const uploadPostImage = require('../middleware/upload-post-image');
const authMiddleware = require('../middleware/authMiddleware');
const { registerAdminValidator } = require('../validations/userSchemas');

// Importa as rotas de managers
const managersRouter = require('./admin/manager.routes');

// Importa as rotas de settings
const settingsRouter = require('./admin/settings.routes');


router.post('/register',
    registerAdminValidator,
    adminController.createAdmin
);

router.use(authMiddleware);

router.get('/stats', 
    adminController.adminStats
);

router.get('/posts', 
    adminController.adminPosts
);

router.get('/posts/:postId', 
    adminController.getPostById
);

router.post('/posts', 
    uploadPostImage,
    adminController.createPost
);

router.put('/posts/:postId',
    uploadPostImage,
    adminController.updatePost
);

router.delete('/posts/:postId', 
    adminController.deletePost
);

router.use('/managers', managersRouter);

// Rotas de configurações
router.use('/settings', settingsRouter);

module.exports = router;