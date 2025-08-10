const { formatCurrency, formatDate } = require('./formatters');

module.exports = {
    payment: {
        created: (payment, tenant, manager) => ({
            subject: `📌 Novo Pagamento Registrado - ${payment.referenceMonth}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2c3e50;">Olá, ${tenant.name}!</h2>
                    <p>Um novo pagamento foi registrado em sua conta:</p>
                    
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p><strong>Referência:</strong> ${payment.referenceMonth}</p>
                        <p><strong>Valor:</strong> ${formatCurrency(payment.amount)}</p>
                        <p><strong>Status:</strong> <span style="color: #3498db;">${payment.status}</span></p>
                        <p><strong>Vencimento:</strong> ${formatDate(payment.dueDate)}</p>
                    </div>

                    <p>Entre em contato com o gestor para mais detalhes.</p>
                    <p>Atenciosamente,<br>A Gestão, Rentix</p>
                </div>
            `,
            text: `Novo pagamento de ${formatCurrency(payment.amount)} para ${payment.referenceMonth}. Vencimento: ${formatDate(payment.dueDate)}`
        }),
        
        created_manager: (payment, tenant, manager) => ({
            subject: `📊 Novo Pagamento Registrado - ${tenant?.name || 'Inquilino'} (${payment.referenceMonth})`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2c3e50;">Novo Pagamento Registrado</h2>
                    
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p><strong>Inquilino:</strong> ${tenant?.name || 'N/A'}</p>
                        <p><strong>Referência:</strong> ${payment.referenceMonth}</p>
                        <p><strong>Valor:</strong> ${formatCurrency(payment.amount)}</p>
                        <p><strong>Status:</strong> <span style="color: #3498db;">${payment.status}</span></p>
                    </div>
    
                    <p>Este pagamento foi registrado em ${formatDate(new Date())}.</p>
                </div>
            `,
            text: `Novo pagamento registrado para ${tenant?.name || 'inquilino'}, referente a ${payment.referenceMonth}`
        }),
        
        late: (payment, tenant, manager, fineDetails) => ({
            subject: `⚠️ Multa Aplicada - Pagamento Atrasado`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #e74c3c;">Atenção, ${tenant.name}!</h2>
                    <p>Seu pagamento referente a <strong>${payment.referenceMonth}</strong> está atrasado.</p>
                    
                    <div style="background: #fef2f2; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #e74c3c;">
                        <p><strong>Multa aplicada:</strong> ${formatCurrency(fineDetails.amount)} (${fineDetails.percentage}%)</p>
                        <p><strong>Novo valor total:</strong> ${formatCurrency(fineDetails.total)}</p>
                        <p><strong>Data do vencimento:</strong> ${formatDate(payment.dueDate)}</p>
                    </div>

                    <p>Regularize seu pagamento o quanto antes.</p>
                    <p>Atenciosamente,<br>A Gestão, Rentix</p>
                </div>
            `,
            text: `Pagamento atrasado. Multa de ${formatCurrency(fineDetails.amount)} aplicada. Novo total: ${formatCurrency(fineDetails.total)}`
        }),

        statusUpdated: (payment, tenant, previousStatus) => ({
            subject: `🔄 Status Atualizado - ${payment.referenceMonth}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2c3e50;">Olá, ${tenant.name}!</h2>
                    <p>O status do seu pagamento foi atualizado:</p>
                    
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p><strong>De:</strong> <span style="color: #7f8c8d;">${previousStatus}</span></p>
                        <p><strong>Para:</strong> <span style="color: #3498db; font-weight: bold;">${payment.status}</span></p>
                        <p><strong>Referência:</strong> ${payment.referenceMonth}</p>
                    </div>

                    <p>Atenciosamente,<br>A Gestão, Rentix</p>
                </div>
            `,
            text: `Status do pagamento alterado de ${previousStatus} para ${payment.status}`
        }),

        paid: (payment, tenant, manager) => ({
            subject: `✅ Pagamento Confirmado - ${payment.referenceMonth}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #27ae60;">Pagamento Recebido!</h2>
                    <p>Olá, ${tenant.name},</p>
                    <p>Seu pagamento referente a <strong>${payment.referenceMonth}</strong> foi confirmado com sucesso.</p>
                    
                    <div style="background: #e8f5e9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p><strong>Valor pago:</strong> ${formatCurrency(payment.amount)}</p>
                        <p><strong>Data de pagamento:</strong> ${formatDate(payment.paymentDate || new Date())}</p>
                        <p><strong>Método de pagamento:</strong> ${payment.paymentMethod || 'Não especificado'}</p>
                    </div>

                    <p>Agradecemos pela pontualidade!</p>
                    <p>Atenciosamente,<br>A Gestão, Rentix</p>
                </div>
            `,
            text: `Pagamento de ${formatCurrency(payment.amount)} para ${payment.referenceMonth} confirmado. Data: ${formatDate(payment.paymentDate || new Date())}`
        }),

        overdue: (payment, tenant, manager, daysLate = 0) => ({
            subject: `⚠️ Pagamento em Atraso - ${payment.referenceMonth}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #e74c3c;">Atenção, ${tenant.name}!</h2>
                    <p>Seu pagamento referente a <strong>${payment.referenceMonth}</strong> está em atraso${daysLate > 0 ? ` há ${daysLate} dias` : ''}.</p>
                    
                    <div style="background: #fef2f2; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #e74c3c;">
                        <p><strong>Valor:</strong> ${formatCurrency(payment.amount)}</p>
                        <p><strong>Data de vencimento:</strong> ${formatDate(payment.dueDate)}</p>
                        ${payment.fineAmount ? `<p><strong>Multa acumulada:</strong> ${formatCurrency(payment.fineAmount)}</p>` : ''}
                    </div>

                    <p>Por favor, regularize seu pagamento o mais rápido possível para evitar penalidades adicionais.</p>
                    <p>Atenciosamente,<br>A Gestão, Rentix</p>
                </div>
            `,
            text: `Pagamento de ${formatCurrency(payment.amount)} para ${payment.referenceMonth} está em atraso${daysLate > 0 ? ` há ${daysLate} dias` : ''}. Vencimento: ${formatDate(payment.dueDate)}`
        }),

        canceled: (payment, tenant, manager) => ({
            subject: `❌ Pagamento Cancelado - ${payment.referenceMonth}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #e74c3c;">Olá, ${tenant.name}!</h2>
                    <p>O pagamento referente a <strong>${payment.referenceMonth}</strong> foi cancelado.</p>
                    
                    <div style="background: #fef2f2; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #e74c3c;">
                        <p><strong>Referência:</strong> ${payment.referenceMonth}</p>
                        <p><strong>Valor original:</strong> ${formatCurrency(payment.amount)}</p>
                        ${payment.fineAmount ? `<p><strong>Multa:</strong> ${formatCurrency(payment.fineAmount)}</p>` : ''}
                        <p><strong>Data do cancelamento:</strong> ${formatDate(payment.cancellationDate || new Date())}</p>
                        ${payment.cancellationReason ? `<p><strong>Motivo:</strong> ${payment.cancellationReason}</p>` : ''}
                        <p><strong>Status atual:</strong> <span style="color: #e74c3c; font-weight: bold;">Cancelado</span></p>
                    </div>
        
                    ${payment.totalAmount ? `
                    <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p><strong>Valor total devolvido:</strong> ${formatCurrency(payment.totalAmount)}</p>
                        <p>Este valor deverá ser restituído conforme acordado.</p>
                    </div>
                    ` : ''}
        
                    <div style="margin-top: 20px;">
                        <p>Em caso de dúvidas, entre em contato com o gestor:</p>
                        <p><strong>${manager.name}</strong></p>
                        <p>📧 ${manager.email}</p>
                        ${manager.phone ? `<p>📞 ${manager.phone}</p>` : ''}
                    </div>
        
                    <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #eee; font-size: 0.9em; color: #777;">
                        <p>Código do pagamento: ${payment.paymentId}</p>
                    </div>
                </div>
            `,
            text: `Pagamento cancelado - Referência: ${payment.referenceMonth}\n` +
                  `Valor: ${formatCurrency(payment.amount)}\n` +
                  `Data: ${formatDate(payment.cancellationDate || new Date())}\n` +
                  `${payment.cancellationReason ? `Motivo: ${payment.cancellationReason}\n` : ''}` +
                  `Entre em contato com ${manager.name} (${manager.email}) para mais informações.`
        }),

        canceled_manager: (payment, tenant, manager) => ({
            subject: `📋 Pagamento Cancelado - ${tenant.name} (${payment.referenceMonth})`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #e74c3c;">Pagamento Cancelado</h2>
                    
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p><strong>Inquilino:</strong> ${tenant.name}</p>
                        <p><strong>Referência:</strong> ${payment.referenceMonth}</p>
                        <p><strong>Valor:</strong> ${formatCurrency(payment.amount)}</p>
                        <p><strong>Cancelado em:</strong> ${formatDate(payment.cancellationDate || new Date())}</p>
                        <p><strong>Motivo:</strong> ${payment.cancellationReason || 'Não informado'}</p>
                        <p><strong>Cancelado por:</strong> Você</p>
                    </div>
        
                    <div style="margin-top: 20px; font-size: 0.9em; color: #555;">
                        <p><strong>Ações recomendadas:</strong></p>
                        <ul>
                            <li>Verificar a necessidade de ajuste no próximo pagamento</li>
                            <li>Atualizar planilhas/relatórios financeiros</li>
                            ${payment.fineAmount ? `<li>Registrar a reversão da multa (${formatCurrency(payment.fineAmount)})</li>` : ''}
                        </ul>
                    </div>
                </div>
            `,
            text: `Pagamento cancelado - ${tenant.name}\n` +
                  `Referência: ${payment.referenceMonth}\n` +
                  `Valor: ${formatCurrency(payment.amount)}\n` +
                  `Motivo: ${payment.cancellationReason || 'Não informado'}`
        })
    },

    reminder: {
        pending: (payment, tenant, manager) => ({
            subject: `🔔 Lembrete de Pagamento - ${payment.referenceMonth}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2c3e50;">Olá, ${tenant.name}!</h2>
                    <p>Este é um lembrete sobre seu pagamento pendente para <strong>${payment.referenceMonth}</strong>.</p>
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p><strong>Valor:</strong> ${formatCurrency(payment.amount)}</p>
                        <p><strong>Data de vencimento:</strong> ${formatDate(payment.dueDate)}</p>
                    </div>
                    <p>Evite atrasos e multas. Para qualquer dúvida, entre em contato com o gestor.</p>
                    <p>Atenciosamente,<br>A Gestão, Rentix</p>
                </div>
            `,
            text: `Lembrete: pagamento de ${formatCurrency(payment.amount)} para ${payment.referenceMonth}. Vencimento: ${formatDate(payment.dueDate)}`
        }),
        
        overdue: (payment, tenant, manager, daysLate) => ({
            subject: `⚠️ Pagamento Atrasado - ${payment.referenceMonth} (${daysLate} dias)`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #e74c3c;">Atenção, ${tenant.name}!</h2>
                    <p>Seu pagamento para <strong>${payment.referenceMonth}</strong> está atrasado há <strong>${daysLate} dias</strong>.</p>
                    <p>Regularize sua situação o mais rápido possível para evitar penalidades adicionais.</p>
                    <p>Atenciosamente,<br>A Gestão, Rentix</p>
                </div>
            `,
            text: `Seu pagamento para ${payment.referenceMonth} está atrasado há ${daysLate} dias. Regularize o mais rápido possível.`
        }),
        
        critical: (payment, tenant, manager, daysLate) => ({
            subject: `🚨 Pagamento Muito Atrasado - ${payment.referenceMonth} (${daysLate} dias)`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #e74c3c;">URGENTE: Regularização Necessária</h2>
                    <p>Seu pagamento referente a <strong>${payment.referenceMonth}</strong> está atrasado há <strong>${daysLate} dias</strong>.</p>
                    <p>Por favor, entre em contato imediatamente para evitar medidas adicionais.</p>
                    <p>Atenciosamente,<br>A Gestão, Rentix</p>
                </div>
            `,
            text: `URGENTE: Seu pagamento para ${payment.referenceMonth} está atrasado há ${daysLate} dias. Contate-nos imediatamente.`
        })
    },

};