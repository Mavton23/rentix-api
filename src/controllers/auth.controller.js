require('dotenv').config()

const { Manager } = require('../models')
const { validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const { generateToken } = require('../middleware/tokens')
const { sequelize } = require('../configs/db');
const { sendResetEmail } = require('../services/auth.service');
const crypto = require('crypto');
const { Op } = require('sequelize');

module.exports = {
    register: async (req, res) => {
        
        const errors = validationResult(req);

        // Verifica se há erros de validação
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array().map(err => ({
                field: err.path,
                message: err.msg
                }))
            });
        }

        const transaction = await sequelize.transaction();
        const { username, email, phone, password } = req.body;
  
        try {
            const existing = await Manager.findOne({ where: { email }, transaction });
            if (existing) {
                await transaction.rollback();
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
            }, { transaction });
            
            await transaction.commit();

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
            await transaction.rollback();
            console.error(err);
            return res.status(500).json({
            success: false,
            errors: [{ message: 'Erro ao registrar o gestor.' }],
            });
        }
    },

    login: async (req, res) => {
        const errors = validationResult(req);

        // Verifica se há erros de validação
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array().map(err => ({
                field: err.path,
                message: err.msg
                }))
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
    },

    requestPasswordReset: async (req, res) => {
        try {
            const { email } = req.body;
            const user = await Manager.findOne({
                where: { email },
                attributes: ['managerId', 'email', 'resetPasswordToken', 'resetPasswordExpires']
            });

            if (!user) {
                return res.status(200).json({ 
                    message: 'Se o e-mail existir em nosso sistema, você receberá um link de recuperação' 
                });
            }

            // Gerar token de reset com expiração
            const resetToken = crypto.randomBytes(20).toString('hex');
            const resetTokenExpiry = Date.now() + 3600000; // 1 hora de expiração

            await Manager.update(
                {
                    resetPasswordToken: resetToken,
                    resetPasswordExpires: resetTokenExpiry
                },
                {
                    where: { managerId: user.managerId }
                }
            );


            // Enviar email
            await sendResetEmail(user.email, resetToken);

            res.status(200).json({ 
                message: 'E-mail de recuperação enviado com sucesso' 
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erro ao processar solicitação' });
        }
    },

    updatePassword: async (req, res) => {
        try {
            const { token, newPassword } = req.body;
            
            const manager = await Manager.findOne({ 
                where: {
                    resetPasswordToken: token,
                    resetPasswordExpires: { [Op.gt]: Date.now() }
                }
            });

            if (!manager) {
                return res.status(400).json({ message: 'Token inválido ou expirado' });
            }

            // Atualizar senha
            const salt = await bcrypt.genSalt(12);
            manager.password = await bcrypt.hash(newPassword, salt);
            manager.resetPasswordToken = undefined;
            manager.resetPasswordExpires = undefined;
            await manager.save();

            res.status(200).json({ 
                success: true,
                message: 'Senha atualizada com sucesso' 
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erro ao atualizar senha' });
        }
    },

    checkAuthentication: async (req, res) => {
        res.json({ isAuthenticated: true, user: req.user });
    },

    logout: async (req, res) => {
        res.json({ success: true, message: 'Logout realizado com sucesso.' });
    }
}