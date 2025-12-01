const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Asegurar que todos los módulos se resuelvan correctamente para web
config.resolver.sourceExts.push('cjs');

module.exports = config;
