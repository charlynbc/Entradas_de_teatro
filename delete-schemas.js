#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const filesToDelete = [
  '/workspaces/Entradas_de_teatro/teatro-tickets-backend/schema.sql',
  '/workspaces/Entradas_de_teatro/teatro-tickets-backend/migrations',
  '/workspaces/Entradas_de_teatro/teatro-tickets-backend/db/migrations',
  '/workspaces/Entradas_de_teatro/teatro-tickets-backend/db/migration-baco-definitivo.sql'
];

console.log('🗑️  Eliminando schemas obsoletos...\n');

filesToDelete.forEach(filePath => {
  try {
    if (fs.existsSync(filePath)) {
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        fs.rmSync(filePath, { recursive: true, force: true });
        console.log(`✅ Eliminado directorio: ${path.basename(filePath)}`);
      } else {
        fs.unlinkSync(filePath);
        console.log(`✅ Eliminado archivo: ${path.basename(filePath)}`);
      }
    } else {
      console.log(`⏭️  Ya eliminado: ${path.basename(filePath)}`);
    }
  } catch (error) {
    console.error(`❌ Error eliminando ${filePath}:`, error.message);
  }
});

console.log('\n✨ Limpieza completada!');
