// Script para verificar que los iconos estén disponibles
const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando instalación de @expo/vector-icons...\n');

const nodeModulesPath = path.join(__dirname, 'node_modules', '@expo', 'vector-icons');

if (fs.existsSync(nodeModulesPath)) {
  console.log('✅ @expo/vector-icons está instalado correctamente');
  console.log(`📁 Ubicación: ${nodeModulesPath}`);
  
  // Verificar que Ionicons esté disponible
  const ioniconsPath = path.join(nodeModulesPath, 'build', 'vendor', 'react-native-vector-icons', 'Fonts', 'Ionicons.ttf');
  if (fs.existsSync(ioniconsPath)) {
    console.log('✅ Fuente Ionicons encontrada');
  } else {
    console.log('⚠️  La fuente Ionicons no se encuentra en la ubicación esperada');
  }
  
  // Listar archivos en el directorio
  const files = fs.readdirSync(nodeModulesPath);
  console.log(`\n📦 Archivos en @expo/vector-icons:`, files.slice(0, 10).join(', '));
  
} else {
  console.log('❌ @expo/vector-icons NO está instalado');
  console.log('💡 Ejecuta: npm install @expo/vector-icons');
}

console.log('\n📝 Instrucciones:');
console.log('1. Si ves errores, ejecuta: npx expo install @expo/vector-icons');
console.log('2. Detén el servidor: Ctrl+C en la terminal de Expo');
console.log('3. Limpia la caché: npx expo start --clear');
console.log('4. Recarga la app en tu dispositivo/emulador (presiona R en la terminal)');
