const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');
const axios = require('axios');

// Configurar nodemailer (ajustar con tus credenciales)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'tu-email@gmail.com',
        pass: process.env.EMAIL_PASSWORD || 'tu-password'
    }
});

// Función para generar PDF de entrada
function generarPDFEntrada(entrada, obra) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const chunks = [];

        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Header teatral
        doc.rect(0, 0, 612, 100).fill('#8B0000');
        
        // Título
        doc.fontSize(32)
           .fillColor('#DAA520')
           .font('Helvetica-Bold')
           .text('🎭 BACO TEATRO', 50, 30, { align: 'center' });
        
        doc.fontSize(14)
           .fillColor('#FFFFFF')
           .font('Helvetica')
           .text('Su entrada para el espectáculo', 0, 70, { align: 'center' });

        // Decoración teatral
        doc.moveTo(50, 120).lineTo(562, 120).lineWidth(2).strokeColor('#DAA520').stroke();

        // Información de la obra
        doc.fillColor('#000000')
           .fontSize(24)
           .font('Helvetica-Bold')
           .text(obra.nombre, 50, 140);

        doc.fontSize(12)
           .fillColor('#555555')
           .font('Helvetica')
           .text('_'.repeat(80), 50, 170);

        // Detalles de la entrada
        let y = 200;
        
        // Código QR visual simulado (puede reemplazarse con librería qrcode)
        doc.rect(400, 200, 120, 120).lineWidth(2).strokeColor('#8B0000').stroke();
        doc.fontSize(10)
           .fillColor('#8B0000')
           .text('Código de entrada:', 410, 210, { width: 100, align: 'center' });
        doc.fontSize(8)
           .text(entrada._id.toString().substring(0, 12).toUpperCase(), 410, 230, { width: 100, align: 'center' });

        // Información de la función
        doc.fontSize(14)
           .fillColor('#8B0000')
           .font('Helvetica-Bold')
           .text('📅 Fecha:', 50, y);
        doc.fillColor('#000000')
           .font('Helvetica')
           .text(new Date(obra.fecha).toLocaleDateString('es-AR', { 
               weekday: 'long', 
               year: 'numeric', 
               month: 'long', 
               day: 'numeric' 
           }), 150, y);

        y += 30;
        doc.fillColor('#8B0000')
           .font('Helvetica-Bold')
           .text('🕐 Horario:', 50, y);
        doc.fillColor('#000000')
           .font('Helvetica')
           .text(obra.hora, 150, y);

        y += 30;
        doc.fillColor('#8B0000')
           .font('Helvetica-Bold')
           .text('💺 Localidad:', 50, y);
        doc.fillColor('#000000')
           .font('Helvetica')
           .text(obra.localidad, 150, y);

        y += 30;
        doc.fillColor('#8B0000')
           .font('Helvetica-Bold')
           .text('🎟️ Cantidad:', 50, y);
        doc.fillColor('#000000')
           .font('Helvetica')
           .text(`${entrada.cantidad} entrada(s)`, 150, y);

        y += 30;
        doc.fillColor('#8B0000')
           .font('Helvetica-Bold')
           .text('💰 Total:', 50, y);
        doc.fillColor('#000000')
           .font('Helvetica')
           .text(`$${entrada.total}`, 150, y);

        // Sección de asistente
        y += 50;
        doc.fontSize(12)
           .fillColor('#555555')
           .text('_'.repeat(80), 50, y);

        y += 20;
        doc.fontSize(14)
           .fillColor('#8B0000')
           .font('Helvetica-Bold')
           .text('👤 Datos del Asistente', 50, y);

        y += 30;
        doc.fontSize(12)
           .fillColor('#000000')
           .font('Helvetica')
           .text(`Nombre: ${entrada.nombre}`, 50, y);

        y += 25;
        doc.text(`Email: ${entrada.email}`, 50, y);

        // Información importante
        y += 60;
        doc.rect(50, y, 512, 120).fillAndStroke('#FFF8DC', '#DAA520');
        
        doc.fontSize(12)
           .fillColor('#8B0000')
           .font('Helvetica-Bold')
           .text('ℹ️ INFORMACIÓN IMPORTANTE', 60, y + 15);

        doc.fontSize(10)
           .fillColor('#000000')
           .font('Helvetica')
           .text('• Presentar esta entrada impresa o en formato digital al ingresar', 60, y + 40)
           .text('• Llegar 15 minutos antes del inicio de la función', 60, y + 55)
           .text('• No se permiten cambios ni devoluciones', 60, y + 70)
           .text('• El teatro se reserva el derecho de admisión', 60, y + 85);

        // Footer
        doc.rect(0, 742, 612, 100).fill('#1a1a1a');
        
        doc.fontSize(10)
           .fillColor('#DAA520')
           .text('🎭 BACO TEATRO', 0, 760, { align: 'center' });
        
        doc.fontSize(9)
           .fillColor('#FFFFFF')
           .text('Av. Corrientes 1234, Buenos Aires | Tel: +54 11 4372-5678', 0, 780, { align: 'center' })
           .text('info@bacoteatro.com.ar | www.bacoteatro.com.ar', 0, 795, { align: 'center' });

        doc.end();
    });
}

// Endpoint para enviar entrada por email
app.post('/api/enviar-entrada', async (req, res) => {
    try {
        const { entradaId } = req.body;
        
        const entrada = await Entrada.findById(entradaId);
        if (!entrada) {
            return res.status(404).json({ error: 'Entrada no encontrada' });
        }

        const obra = await Obra.findById(entrada.obraId);
        if (!obra) {
            return res.status(404).json({ error: 'Obra no encontrada' });
        }

        // Generar PDF
        const pdfBuffer = await generarPDFEntrada(entrada, obra);

        // Enviar email con PDF adjunto
        const mailOptions = {
            from: process.env.EMAIL_USER || 'tu-email@gmail.com',
            to: entrada.email,
            subject: `🎭 Tu entrada para ${obra.nombre} - Baco Teatro`,
            html: `
                <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #8B0000, #6d0000); padding: 30px; text-align: center; color: #DAA520;">
                        <h1 style="margin: 0; font-size: 32px;">🎭 BACO TEATRO</h1>
                        <p style="color: white; margin-top: 10px;">Su entrada ha sido confirmada</p>
                    </div>
                    
                    <div style="padding: 30px; background: #f5f5f5;">
                        <h2 style="color: #8B0000;">Estimado/a ${entrada.nombre},</h2>
                        
                        <p style="font-size: 16px; line-height: 1.6;">
                            ¡Gracias por su compra! Adjunto encontrará su entrada para:
                        </p>
                        
                        <div style="background: white; padding: 20px; border-left: 4px solid #DAA520; margin: 20px 0;">
                            <h3 style="color: #8B0000; margin-top: 0;">${obra.nombre}</h3>
                            <p style="margin: 5px 0;"><strong>📅 Fecha:</strong> ${new Date(obra.fecha).toLocaleDateString('es-AR')}</p>
                            <p style="margin: 5px 0;"><strong>🕐 Horario:</strong> ${obra.hora}</p>
                            <p style="margin: 5px 0;"><strong>💺 Localidad:</strong> ${obra.localidad}</p>
                            <p style="margin: 5px 0;"><strong>🎟️ Cantidad:</strong> ${entrada.cantidad} entrada(s)</p>
                        </div>
                        
                        <div style="background: #FFF8DC; padding: 15px; border-radius: 5px; margin: 20px 0;">
                            <p style="margin: 0; font-size: 14px;">
                                <strong>⚠️ Importante:</strong><br>
                                • Presentar esta entrada al ingresar (impresa o digital)<br>
                                • Llegar 15 minutos antes del inicio<br>
                                • No se permiten cambios ni devoluciones
                            </p>
                        </div>
                        
                        <p style="font-size: 14px;">
                            Para cualquier consulta, contáctenos en:<br>
                            📧 info@bacoteatro.com.ar<br>
                            📱 +54 11 4372-5678
                        </p>
                    </div>
                    
                    <div style="background: #1a1a1a; padding: 20px; text-align: center; color: #DAA520;">
                        <p style="margin: 0;">🎭 Baco Teatro © 2024</p>
                        <p style="margin: 5px 0; color: white; font-size: 12px;">Donde el arte cobra vida</p>
                    </div>
                </div>
            `,
            attachments: [{
                filename: `entrada-${obra.nombre.replace(/\s+/g, '-')}.pdf`,
                content: pdfBuffer,
                contentType: 'application/pdf'
            }]
        };

        await transporter.sendMail(mailOptions);

        res.json({ 
            success: true, 
            mensaje: 'Entrada enviada por email exitosamente' 
        });

    } catch (error) {
        console.error('Error al enviar entrada:', error);
        res.status(500).json({ error: 'Error al enviar la entrada' });
    }
});

// Endpoint para enviar entrada por WhatsApp
app.post('/api/enviar-whatsapp', async (req, res) => {
    try {
        const { entradaId, telefono } = req.body;
        
        const entrada = await Entrada.findById(entradaId);
        if (!entrada) {
            return res.status(404).json({ error: 'Entrada no encontrada' });
        }

        const obra = await Obra.findById(entrada.obraId);
        if (!obra) {
            return res.status(404).json({ error: 'Obra no encontrada' });
        }

        // Generar PDF
        const pdfBuffer = await generarPDFEntrada(entrada, obra);

        // Aquí puedes integrar con una API de WhatsApp Business
        // Por ejemplo: Twilio, WhatsApp Business API, etc.
        
        // Opción 1: Usar Twilio (requiere configuración)
        // const twilioClient = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
        
        // Opción 2: Generar link de WhatsApp con mensaje predefinido
        const mensaje = `🎭 *BACO TEATRO - Tu Entrada*\n\n` +
            `✅ Compra confirmada para:\n` +
            `🎬 ${obra.nombre}\n` +
            `📅 ${new Date(obra.fecha).toLocaleDateString('es-AR')}\n` +
            `🕐 ${obra.hora}\n` +
            `💺 ${obra.localidad}\n` +
            `🎟️ ${entrada.cantidad} entrada(s)\n` +
            `💰 Total: $${entrada.total}\n\n` +
            `📥 Descarga tu entrada PDF aquí:\n` +
            `${process.env.BASE_URL || 'https://baco-teatro-1jxj.onrender.com'}/api/descargar-entrada/${entradaId}\n\n` +
            `⚠️ Importante:\n` +
            `• Presentar esta entrada al ingresar\n` +
            `• Llegar 15 minutos antes\n` +
            `• No se permiten cambios\n\n` +
            `¡Gracias por elegir Baco Teatro! 🎭`;

        const mensajeCodificado = encodeURIComponent(mensaje);
        const whatsappLink = `https://wa.me/${telefono}?text=${mensajeCodificado}`;

        // Enviar también por email como respaldo
        const pdfBase64 = pdfBuffer.toString('base64');
        
        const mailOptions = {
            from: process.env.EMAIL_USER || 'tu-email@gmail.com',
            to: entrada.email,
            subject: `🎭 Tu entrada para ${obra.nombre} - Baco Teatro`,
            html: `
                <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #8B0000, #6d0000); padding: 30px; text-align: center;">
                        <h1 style="color: #DAA520; margin: 0;">🎭 BACO TEATRO</h1>
                        <p style="color: white; margin-top: 10px;">Tu entrada está lista</p>
                    </div>
                    
                    <div style="padding: 30px; background: #f5f5f5;">
                        <p>Estimado/a ${entrada.nombre},</p>
                        <p>También te enviamos tu entrada por email como respaldo.</p>
                        <p><strong>Para recibir por WhatsApp, haz clic aquí:</strong></p>
                        <a href="${whatsappLink}" style="display: inline-block; padding: 12px 30px; background: #25D366; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0;">
                            📱 Abrir en WhatsApp
                        </a>
                    </div>
                </div>
            `,
            attachments: [{
                filename: `entrada-${obra.nombre.replace(/\s+/g, '-')}.pdf`,
                content: pdfBuffer,
                contentType: 'application/pdf'
            }]
        };

        await transporter.sendMail(mailOptions);

        res.json({ 
            success: true, 
            mensaje: 'Entrada procesada. Revisa tu WhatsApp y email.',
            whatsappLink: whatsappLink
        });

    } catch (error) {
        console.error('Error al enviar por WhatsApp:', error);
        res.status(500).json({ error: 'Error al enviar la entrada por WhatsApp' });
    }
});

// Endpoint para descargar PDF directamente
app.get('/api/descargar-entrada/:id', async (req, res) => {
    try {
        const entrada = await Entrada.findById(req.params.id);
        if (!entrada) {
            return res.status(404).json({ error: 'Entrada no encontrada' });
        }

        const obra = await Obra.findById(entrada.obraId);
        if (!obra) {
            return res.status(404).json({ error: 'Obra no encontrada' });
        }

        const pdfBuffer = await generarPDFEntrada(entrada, obra);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=entrada-${obra.nombre.replace(/\s+/g, '-')}.pdf`);
        res.send(pdfBuffer);

    } catch (error) {
        console.error('Error al generar PDF:', error);
        res.status(500).json({ error: 'Error al generar el PDF' });
    }
});

// Inicializar base de datos limpia - solo usuario supremo
async function inicializarBaseDatos() {
    try {
        // Verificar si ya existe el usuario supremo
        const usuarioExistente = await Usuario.findOne({ email: 'admin@bacoteatro.com' });
        
        if (!usuarioExistente) {
            // Crear solo el usuario supremo
            const usuarioSupremo = new Usuario({
                nombre: 'Administrador',
                email: 'admin@bacoteatro.com',
                password: 'admin123', // Cambiar en producción
                rol: 'supremo'
            });
            
            await usuarioSupremo.save();
            console.log('✅ Usuario supremo creado exitosamente');
            console.log('📧 Email: admin@bacoteatro.com');
            console.log('🔑 Password: admin123');
            console.log('⚠️  IMPORTANTE: Cambiar la contraseña en producción');
        } else {
            console.log('✅ Usuario supremo ya existe');
        }

        // Verificar que no haya otros datos
        const totalObras = await Obra.countDocuments();
        const totalEntradas = await Entrada.countDocuments();
        
        console.log('\n📊 Estado de la base de datos:');
        console.log(`   Obras: ${totalObras}`);
        console.log(`   Entradas: ${totalEntradas}`);
        console.log(`   Sistema: VIRGEN ✨`);
        
    } catch (error) {
        console.error('❌ Error al inicializar base de datos:', error);
    }
}

// Llamar a la inicialización cuando se conecta la base de datos
mongoose.connection.once('open', () => {
    console.log('✅ Conectado a MongoDB');
    inicializarBaseDatos();
});