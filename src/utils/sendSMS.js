require('dotenv').config()
const twilio = require('twilio')

// Twilio
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

async function sendSMS(to, message){
    try {
        await client.messages.create({
            body: message,
            from: process.env.TWILIO_PHONE_NUMBER,
            to
        });
        console.log(`SMS enviado para ${to}`);
    } catch (error) {
        console.error('Erro ao enviar SMS:', error instanceof Error ? error.message : error);
    }
}

module.exports = sendSMS;