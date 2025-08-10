const express = require('express')
const router = express.Router()
const blogController = require('../controllers/blog.controller');
const { ensureCategoriesExist } = require('../utils/blogCategories');

router.get('/posts', blogController.getPosts);

router.get('/post/:slug', 
    blogController.getPostBySlug
);

router.get('/categories', ensureCategoriesExist, blogController.getCategories);
router.get('/featured', blogController.getFeaturedPosts);


module.exports = router;