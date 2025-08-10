const templates = require('./emailTemplates');
const { sendEmail } = require('./sendMail');
const sendSMS = require('./sendSMS');

async function sendPaymentNotification(type, payment, tenant, manager, extraData = {}) {
    // Validação inicial rigorosa
    if (!tenant && !manager) {
        throw new Error('Destinatários ausentes: tenant e manager não fornecidos');
    }

    try {
        // 1. Obter template com fallback seguro
        const template = getNotificationTemplate(type, payment, tenant, manager, extraData);
        
        // 2. Preparar tarefas de envio
        const notificationTasks = [];
        const isManagerNotification = type.endsWith('_manager');

        // Lógica de envio para tenant (exceto notificações _manager)
        if (!isManagerNotification && tenant?.email) {
            notificationTasks.push(
                sendEmail({
                    to: tenant.email,
                    subject: template.subject,
                    html: template.html,
                    text: template.text
                }).catch(e => handleNotificationError('email', 'tenant', e))
            );
        }

        // Lógica de envio para manager (apenas notificações _manager)
        if (isManagerNotification && manager?.email) {
            notificationTasks.push(
                sendEmail({
                    to: manager.email,
                    subject: template.subject,
                    html: template.html,
                    text: template.text
                }).catch(e => handleNotificationError('email', 'manager', e))
            );
        }

        // Envio de SMS (sempre para tenant, quando aplicável)
        if (!isManagerNotification && tenant?.phone) {
            notificationTasks.push(
                sendSMS(tenant.phone, template.text)
                    .catch(e => handleNotificationError('sms', 'tenant', e))
            );
        }

        // 3. Executar todas as notificações em paralelo
        await Promise.all(notificationTasks);
        return true;

    } catch (error) {
        console.error(`[${type.toUpperCase()}] Erro crítico:`, error);
        throw error; // Propaga o erro para tratamento superior
    }
}

// Funções auxiliares
function getNotificationTemplate(type, payment, tenant, manager, extraData) {
    // Separa o tipo em categoria e subtipo (ex: "reminder_pending" => ["reminder", "pending"])
    const [category, subType] = type.split('_');
    
    // Verifica se é um template de lembrete (reminder)
    if (category === 'reminder') {
        if (!templates.reminder || !templates.reminder[subType]) {
            throw new Error(`Template de lembrete não encontrado: ${type}`);
        }
        return templates.reminder[subType](
            payment,
            tenant || { name: 'Inquilino', email: null, phone: null },
            manager || { name: 'Gestor', email: null },
            extraData
        );
    }
    
    // Para outros tipos de notificação (payment_*)
    const templateType = type.startsWith('payment_') 
        ? type.replace('payment_', '') 
        : type;

    if (!templates.payment[templateType]) {
        throw new Error(`Template de notificação não encontrado: ${type}`);
    }

    return templates.payment[templateType](
        payment,
        tenant || { name: 'Inquilino', email: null, phone: null },
        manager || { name: 'Gestor', email: null },
        extraData
    );
}

function handleNotificationError(channel, recipientType, error) {
    console.error(
        `[Falha de ${channel.toUpperCase()}]`,
        `Tipo: ${recipientType}`,
        `Detalhes: ${error.message}`,
        error.stack ? `Stack: ${error.stack}` : ''
    );
}

module.exports = sendPaymentNotification;