const fs = require('fs');
const path = require('path');

console.log('🎭 ========================================');
console.log('🎭 BACO TEATRO - VERIFICACIÓN COMPLETA');
console.log('🎭 ========================================\n');

let errores = [];
let advertencias = [];
let exitos = 0;

function success(mensaje) {
    console.log(`✅ ${mensaje}`);
    exitos++;
}

function error(mensaje) {
    console.log(`❌ ${mensaje}`);
    errores.push(mensaje);
}

function warning(mensaje) {
    console.log(`⚠️  ${mensaje}`);
    advertencias.push(mensaje);
}

function verificarArchivo(ruta, descripcion) {
    const rutaCompleta = path.join(__dirname, '..', ruta);
    if (fs.existsSync(rutaCompleta)) {
        success(`Archivo existe: ${descripcion}`);
        return true;
    } else {
        error(`Archivo faltante: ${descripcion} (${ruta})`);
        return false;
    }
}

function verificarContenido(ruta, buscar, descripcion) {
    const rutaCompleta = path.join(__dirname, '..', ruta);
    try {
        const contenido = fs.readFileSync(rutaCompleta, 'utf8');
        if (typeof buscar === 'string' && contenido.includes(buscar)) {
            success(`Contiene: ${descripcion}`);
            return true;
        } else if (buscar instanceof RegExp && buscar.test(contenido)) {
            success(`Contiene: ${descripcion}`);
            return true;
        } else if (Array.isArray(buscar)) {
            const todosPresentes = buscar.every(item => contenido.includes(item));
            if (todosPresentes) {
                success(`Contiene: ${descripcion}`);
                return true;
            } else {
                error(`Falta contenido: ${descripcion}`);
                return false;
            }
        }
        error(`No contiene: ${descripcion}`);
        return false;
    } catch (e) {
        error(`Error leyendo archivo para verificar: ${descripcion}`);
        return false;
    }
}

// ============================================
// 1. VERIFICAR ESTRUCTURA DE ARCHIVOS
// ============================================
console.log('\n📁 1. VERIFICANDO ESTRUCTURA DE ARCHIVOS\n');

verificarArchivo('server.js', 'Servidor principal');
verificarArchivo('package.json', 'Configuración npm');
verificarArchivo('.env.example', 'Ejemplo de variables de entorno');
verificarArchivo('README.md', 'Documentación');

// Modelos
verificarArchivo('models/Obra.js', 'Modelo de Obra');
verificarArchivo('models/Entrada.js', 'Modelo de Entrada');
verificarArchivo('models/Usuario.js', 'Modelo de Usuario');

// Frontend
verificarArchivo('public/index.html', 'Página principal');
verificarArchivo('public/contacto.html', 'Página de contacto');
verificarArchivo('public/script.js', 'Script principal');

// Estilos separados
verificarArchivo('public/styles/common.css', 'Estilos comunes');
verificarArchivo('public/styles/index.css', 'Estilos de index');
verificarArchivo('public/styles/contacto.css', 'Estilos de contacto');

// Logo
verificarArchivo('public/images/logo-baco.svg', 'Logo de Baco Teatro');

// Scripts
verificarArchivo('scripts/limpiar-db.js', 'Script para limpiar DB');
verificarArchivo('scripts/verificar-db.js', 'Script para verificar DB');

// ============================================
// 2. VERIFICAR DISEÑO TEATRAL
// ============================================
console.log('\n🎨 2. VERIFICANDO DISEÑO TEATRAL\n');

// Logo en todas las páginas
verificarContenido('public/index.html', 'logo-baco-fixed', 'Logo fijo en index.html');
verificarContenido('public/contacto.html', 'logo-baco-fixed', 'Logo fijo en contacto.html');
verificarContenido('public/index.html', 'logo-container-principal', 'Logo principal en header');

// Cortina teatral
verificarContenido('public/index.html', 'teatro-curtain', 'Cortina teatral en index');
verificarContenido('public/contacto.html', 'teatro-curtain', 'Cortina teatral en contacto');

// Variables CSS teatrales
verificarContenido('public/styles/common.css', [
    '--teatro-rojo',
    '--teatro-dorado',
    '--teatro-negro'
], 'Variables de colores teatrales');

// ============================================
// 3. VERIFICAR BOTONES Y NAVEGACIÓN
// ============================================
console.log('\n🔘 3. VERIFICANDO BOTONES Y NAVEGACIÓN\n');

// Botón Inicio en todas las páginas
verificarContenido('public/index.html', ['btn-teatro', '🏠', 'Inicio'], 'Botón Inicio en index');
verificarContenido('public/contacto.html', ['btn-teatro', '🏠', 'Inicio'], 'Botón Inicio en contacto');

// Botones con iconos
verificarContenido('public/index.html', 'btn-icono', 'Iconos en botones de index');
verificarContenido('public/contacto.html', 'btn-icono', 'Iconos en botones de contacto');

// Estado activo de botones
verificarContenido('public/styles/common.css', 'btn-activo', 'Estilo para botón activo');

// Navegación completa
verificarContenido('public/index.html', [
    'Inicio',
    'Cartelera',
    'Contacto',
    'Mis Entradas'
], 'Navegación completa en index');

verificarContenido('public/contacto.html', [
    'Inicio',
    'Cartelera',
    'Contacto',
    'Mis Entradas'
], 'Navegación completa en contacto');

// ============================================
// 4. VERIFICAR PÁGINA DE CONTACTO
// ============================================
console.log('\n📧 4. VERIFICANDO PÁGINA DE CONTACTO\n');

verificarContenido('public/contacto.html', [
    'Información de Contacto',
    'Teatro Baco',
    'Envíenos un Mensaje'
], 'Secciones de contacto');

verificarContenido('public/contacto.html', [
    'Dirección',
    'Teléfono',
    'Email',
    'Horarios de Atención'
], 'Información de contacto completa');

// Formulario profesional
verificarContenido('public/contacto.html', [
    'form-group',
    'nombre',
    'email',
    'mensaje',
    'asunto'
], 'Formulario de contacto');

// Redes sociales con iconos
verificarContenido('public/contacto.html', [
    'Facebook',
    'Instagram',
    'Twitter',
    'WhatsApp',
    'social-icon'
], 'Redes sociales con iconos');

// ============================================
// 5. VERIFICAR FUNCIONALIDAD DE PDFs
// ============================================
console.log('\n📄 5. VERIFICANDO FUNCIONALIDAD DE PDFs\n');

verificarContenido('server.js', 'PDFDocument', 'Importación de PDFKit');
verificarContenido('server.js', 'generarPDFEntrada', 'Función para generar PDF');
verificarContenido('server.js', '/api/descargar-entrada', 'Endpoint para descargar PDF');

verificarContenido('package.json', 'pdfkit', 'Dependencia PDFKit');

// ============================================
// 6. VERIFICAR ENVÍO POR EMAIL Y WHATSAPP
// ============================================
console.log('\n📱 6. VERIFICANDO ENVÍO POR EMAIL Y WHATSAPP\n');

verificarContenido('server.js', 'nodemailer', 'Importación de Nodemailer');
verificarContenido('server.js', '/api/enviar-entrada', 'Endpoint para enviar por email');
verificarContenido('server.js', '/api/enviar-whatsapp', 'Endpoint para enviar por WhatsApp');

verificarContenido('package.json', 'nodemailer', 'Dependencia Nodemailer');

// Modal con opciones
verificarContenido('public/index.html', [
    'modal-descarga',
    'Descargar PDF',
    'Enviar por Email',
    'Enviar por WhatsApp'
], 'Modal con opciones de descarga');

verificarContenido('public/script.js', 'opcionSeleccionada', 'Función para manejar opciones');

// ============================================
// 7. VERIFICAR ICONOS SVG
// ============================================
console.log('\n🎨 7. VERIFICANDO ICONOS SVG\n');

verificarContenido('public/contacto.html', '<svg', 'Iconos SVG en contacto');
verificarContenido('public/index.html', '<svg', 'Iconos SVG en modal');

// Verificar logo SVG
if (verificarArchivo('public/images/logo-baco.svg', 'Logo SVG')) {
    verificarContenido('public/images/logo-baco.svg', [
        '<svg',
        'BACO',
        'TEATRO'
    ], 'Contenido del logo SVG');
}

// ============================================
// 8. VERIFICAR ESTILOS SEPARADOS
// ============================================
console.log('\n🎨 8. VERIFICANDO ESTILOS SEPARADOS POR PÁGINA\n');

// Common.css debe tener estilos compartidos
verificarContenido('public/styles/common.css', [
    ':root',
    '.logo-baco-fixed',
    '.teatro-curtain',
    '.btn-teatro'
], 'Estilos comunes');

// Index.css debe tener estilos específicos
verificarContenido('public/styles/index.css', [
    '.obras-grid',
    '.obra-card',
    '.modal-overlay'
], 'Estilos específicos de index');

// Contacto.css debe tener estilos específicos
verificarContenido('public/styles/contacto.css', [
    '.contacto-container',
    '.contacto-form-profesional',
    '.info-card'
], 'Estilos específicos de contacto');

// Verificar imports en HTML
verificarContenido('public/index.html', [
    '/styles/common.css',
    '/styles/index.css'
], 'Imports correctos en index.html');

verificarContenido('public/contacto.html', [
    '/styles/common.css',
    '/styles/contacto.css'
], 'Imports correctos en contacto.html');

// ============================================
// 9. VERIFICAR SISTEMA VIRGEN
// ============================================
console.log('\n✨ 9. VERIFICANDO SISTEMA VIRGEN\n');

verificarContenido('server.js', 'inicializarBaseDatos', 'Función de inicialización');
verificarContenido('server.js', 'admin@bacoteatro.com', 'Usuario supremo configurado');

verificarContenido('scripts/limpiar-db.js', 'deleteMany', 'Script de limpieza funcional');
verificarContenido('README.md', 'VIRGEN', 'Documentación sobre sistema virgen');

// ============================================
// 10. VERIFICAR RESPONSIVE
// ============================================
console.log('\n📱 10. VERIFICANDO DISEÑO RESPONSIVE\n');

verificarContenido('public/styles/common.css', '@media', 'Media queries en common');
verificarContenido('public/styles/index.css', '@media', 'Media queries en index');
verificarContenido('public/styles/contacto.css', '@media', 'Media queries en contacto');

verificarContenido('public/index.html', 'viewport', 'Viewport configurado en index');
verificarContenido('public/contacto.html', 'viewport', 'Viewport configurado en contacto');

// ============================================
// 11. VERIFICAR DEPENDENCIAS
// ============================================
console.log('\n📦 11. VERIFICANDO DEPENDENCIAS\n');

const dependenciasRequeridas = [
    'express',
    'mongoose',
    'pdfkit',
    'nodemailer',
    'axios',
    'dotenv'
];

dependenciasRequeridas.forEach(dep => {
    verificarContenido('package.json', dep, `Dependencia: ${dep}`);
});

// ============================================
// 12. VERIFICAR SCRIPTS NPM
// ============================================
console.log('\n🔧 12. VERIFICANDO SCRIPTS NPM\n');

verificarContenido('package.json', '"start":', 'Script start');
verificarContenido('package.json', '"limpiar-db":', 'Script limpiar-db');
verificarContenido('package.json', '"verificar-db":', 'Script verificar-db');

// ============================================
// 13. VERIFICAR DOCUMENTACIÓN
// ============================================
console.log('\n📖 13. VERIFICANDO DOCUMENTACIÓN\n');

verificarContenido('README.md', [
    'Baco Teatro',
    'Instalación',
    'Usuario Supremo',
    'Scripts Disponibles'
], 'README completo');

verificarContenido('.env.example', [
    'MONGODB_URI',
    'EMAIL_USER',
    'BASE_URL'
], 'Ejemplo de variables de entorno');

// ============================================
// 14. VERIFICAR ACCESIBILIDAD
// ============================================
console.log('\n♿ 14. VERIFICANDO ACCESIBILIDAD\n');

verificarContenido('public/index.html', 'alt=', 'Atributos alt en imágenes de index');
verificarContenido('public/contacto.html', 'alt=', 'Atributos alt en imágenes de contacto');
verificarContenido('public/index.html', 'title=', 'Atributos title en index');
verificarContenido('public/contacto.html', '<label', 'Labels en formulario');

// ============================================
// RESUMEN FINAL
// ============================================
console.log('\n🎭 ========================================');
console.log('🎭 RESUMEN DE VERIFICACIÓN');
console.log('🎭 ========================================\n');

console.log(`✅ Verificaciones exitosas: ${exitos}`);
console.log(`❌ Errores encontrados: ${errores.length}`);
console.log(`⚠️  Advertencias: ${advertencias.length}`);

if (errores.length > 0) {
    console.log('\n❌ ERRORES CRÍTICOS:\n');
    errores.forEach((err, i) => {
        console.log(`   ${i + 1}. ${err}`);
    });
}

if (advertencias.length > 0) {
    console.log('\n⚠️  ADVERTENCIAS:\n');
    advertencias.forEach((warn, i) => {
        console.log(`   ${i + 1}. ${warn}`);
    });
}

console.log('\n🎭 ========================================\n');

if (errores.length === 0) {
    console.log('✅ ¡SISTEMA LISTO PARA DEPLOY A RENDER! 🚀\n');
    process.exit(0);
} else {
    console.log('❌ Corrige los errores antes de hacer deploy.\n');
    process.exit(1);
}
