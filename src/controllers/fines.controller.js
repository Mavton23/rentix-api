const { FineSettings } = require('../models');
const { validationResult } = require('express-validator')

module.exports = {
    getFineSettings: async (req, res) => {
        const { managerId } = req.user;
        
        try {
            // Busca as configurações de multa do gestor
            const fineSettings = await FineSettings.findOne({
                where: { managerId: managerId },
            });
    
            if (!fineSettings) {
                return res.status(200).json({
                    success: false,
                    errors: [{
                        message: 'Configurações de multa não encontradas.',
                    }]
                });
            }
    
            // Retorna as configurações de multa
            return res.status(201).json(fineSettings);
        } catch (error) {
            console.error('Erro ao buscar configurações de multa:', error);
            return res.status(500).json({
                success: false,
                errors: [{
                    message: 'Erro ao buscar configurações de multa. Tente novamente.',
                }]
            });
        }
    },
    updateFineSettings: async (req, res) => {
        const errors = validationResult(req);
        
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array().map(err => ({
                    field: err.path,
                    message: err.msg
                })),
            });
        }
        
        const { managerId } = req.user;
        const { finePercentage, maxFinesBeforeWarning, welcomeMessage } = req.body;

        try {
            // Busca ou cria as configurações de multa do gestor
            const [fineSettings, created] = await FineSettings.findOrCreate({
                where: { managerId: managerId },
                defaults: { finePercentage, maxFinesBeforeWarning, welcomeMessage },
            });

            if (!created) {
                if (finePercentage !== undefined) fineSettings.finePercentage = finePercentage;
                if (maxFinesBeforeWarning !== undefined) fineSettings.maxFinesBeforeWarning = maxFinesBeforeWarning;
                if (welcomeMessage !== undefined) fineSettings.welcomeMessage = welcomeMessage;
                await fineSettings.save();
            }

            // Retorna sucesso
            return res.status(200).json(fineSettings);
        } catch (error) {
            console.error('Erro ao atualizar configurações de multa:', error);
            return res.status(500).json({
                success: false,
                message: 'Erro ao atualizar configurações de multa. Tente novamente.',
            });
        }
    }
}