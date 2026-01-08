/**
 * Script para ejecutar migraciones SQL
 */

import pool from './db/postgres.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
    const client = await pool.connect();
    
    try {
        console.log('🔄 Ejecutando migraciones...');
        
        const migrationsDir = path.join(__dirname, 'db', 'migrations');
        const files = [
            '003-grupos.sql',
            '003-grupos-update.sql',
            '004-funciones-grupos.sql',
            '007-ticket-auditoria-anulacion.sql',
            '009-obra-prof-boleteria.sql'
        ];
        
        for (const file of files) {
            const filePath = path.join(migrationsDir, file);
            try {
                const sql = await fs.readFile(filePath, 'utf8');
                console.log(`📝 Ejecutando ${file}...`);
                await client.query(sql);
                console.log(`✅ ${file} completada`);
            } catch (error) {
                if (error.code === 'ENOENT') {
                    console.log(`⚠️  ${file} no encontrado, saltando...`);
                } else if (error.message.includes('already exists')) {
                    console.log(`⏭️  ${file} - objetos ya existen`);
                } else {
                    console.error(`❌ Error en ${file}:`, error.message);
                }
            }
        }
        
        console.log('✅ Migraciones completadas');
        
    } catch (error) {
        console.error('❌ Error general:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

runMigrations().catch(console.error);
