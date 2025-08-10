require('dotenv').config()

const express = require('express');
const router = express.Router();
const { Manager } = require('../models')
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const { generateToken, authenticateToken } = require('../middleware/tokens')

router.post(
    '/register',
    [
      body('username').trim().notEmpty().withMessage('O nome de usuário é obrigatório!'),
      body('email').trim().isEmail().withMessage('Forneça um endereço de e-mail válido!'),
      body('phone').trim().notEmpty().withMessage('O número de telefone é obrigatório!'),
      body('password').trim().isLength({ min: 6 }).withMessage('A senha deve ter pelo menos 6 caracteres!'),
      body('confpass').trim().custom((value, { req }) => value === req.body.password).withMessage('As senhas não coincidem!'),
    ],
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array().map(err => ({ field: err.path, message: err.msg })),
        });
      }
  
      const { username, email, phone, password } = req.body;
  
      try {
        const existing = await Manager.findOne({ where: { email } });
        if (existing) {
          return res.status(400).json({
            success: false,
            errors: [{ field: 'email', message: 'Este e-mail já está em uso' }],
          });
        }
  
        const newUser = await Manager.create({
          name: username,
          email,
          phone,
          password,
          role: 'manager',
        });
  
        const token = generateToken(newUser);
  
        return res.status(201).json({
          success: true,
          message: 'Gestor registrado com sucesso!',
          user: {
            id: newUser.managerId,
            name: newUser.name,
            email: newUser.email,
            phone: newUser.phone,
            role: newUser.role,
          },
          token,
        });
      } catch (err) {
        console.error(err);
        return res.status(500).json({
          success: false,
          errors: [{ message: 'Erro ao registrar o gestor.' }],
        });
      }
    }
  );

router.post(
    '/login',
    [
        body('email').trim().isEmail().withMessage('Forneça um e-mail válido!'),
        body('password').trim().notEmpty().withMessage('A senha é obrigatória!'),
    ],
    async (req, res) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            console.log("Erros de validação:", errors.array()); 
            return res.status(400).json({
                success: false,
                errors: errors.array().map(err => ({
                    field: err.path,
                    message: err.msg
                })),
            });
        }

        const { email, password } = req.body;

        try {
            const user = await Manager.findOne({ where: { email } });
            if (!user) {
                return res.status(401).json({
                    success: false,
                    errors: [{
                        field: 'email',
                        message: 'O usuário não foi encontrado, verifique os seus dados.',
                    }]
                });
            }

            const isMatch = await bcrypt.compare(password, user.password)
            if (!isMatch) {
                return res.status(401).json({
                    success: false,
                    errors: [{
                        field: 'password',
                        message: 'Senha incorreta, verifique e tente novamente.',
                    }]
                });
            }
            
            await Manager.update(
                { lastLogin: new Date() },
                { where: { managerId: user.managerId } }
            )
            const token = generateToken(user);

            return res.status(200).json({
                success: true,
                message: 'Login realizado com sucesso!',
                user: {
                    id: user.managerId,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
                token,
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                errors: [{
                    message: 'Erro interno no servidor.',
                }]
            });
        }
    }
);

router.get("/api/auth/check", authenticateToken, (req, res) => {
    res.json({ isAuthenticated: true, user: req.user });
});

router.post("/api/auth/logout", (req, res) => {
    res.json({ success: true, message: 'Logout realizado com sucesso.' });
});

// router.get('/profile', authenticateToken, async (req, res) => {
//     try {
//         const manager = await Manager.findByPk(req.user.managerId, {
//             attributes: { exclude: ['password'] },
//         });

//         if (!manager) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Gestor não encontrado.',
//             });
//         }

//         return res.status(200).json(manager);
//     } catch (error) {
//         console.error('Erro ao buscar perfil:', error);
//         return res.status(500).json({
//             success: false,
//             message: 'Erro ao buscar perfil. Tente novamente.',
//         });
//     }
// });

module.exports = router;