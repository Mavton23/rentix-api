const express = require('express');
const router = express.Router();
const { 
    registerManagerValidator, 
    loginUserValidator,
    resetPasswordValidator,
    updatePasswordValidator
} = require('../validations/userSchemas');
const authController = require('../controllers/auth.controller');

router.post("/register", 
    registerManagerValidator,
    authController.register);

router.post("/login", 
    loginUserValidator,
    authController.login);

// Nova rota para solicitação de reset de senha
router.post("/reset-password",
    resetPasswordValidator,
    authController.requestPasswordReset);

// Nova rota para atualização de senha
router.post("/update-password",
    updatePasswordValidator,
    authController.updatePassword);

router.get("/api/auth/check", authController.checkAuthentication);

router.post("/api/auth/logout", authController.logout);

module.exports = router;