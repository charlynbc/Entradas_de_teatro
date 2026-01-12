import { existsSync, readdirSync, statSync } from 'fs';
import { readdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const STRUCTURE = {
  required: {
    files: [
      'package.json',
      '.env.example',
      'index-v3-postgres.js',
      'README.md'
    ],
    dirs: [
      'teatro-tickets-backend',
      'public',
      'public/pages',
      'public/pages/auth',
      'public/pages/admin'
    ]
  },
  backend: {
    dirs: [
      'utils',
      'bootstrap',
      'db',
      'routes',
      'middleware',
      'controllers',
      'models',
      'config'
    ],
    files: {
      'utils': ['dataStore.js', 'logger.js', 'envValidator.js'],
      'bootstrap': ['database.js', 'superUser.js', 'seed.js'],
      'db': ['postgres.js'],
      'routes': [
        'auth.routes.js',
        'users.routes.js',
        'usuarios.routes.js',
        'funciones.routes.js',
        'tickets.routes.js',
        'reportes.routes.js',
        'reportes-obras.routes.js',
        'ensayos.routes.js',
        'admin.routes.js',
        'grupos.routes.js',
        'obras.routes.js',
        'upload.routes.js',
        'public.routes.js',
        'auditoria-reportes.routes.js',
        'cuotas.routes.js',
        'gastos.routes.js',
        'boleteria.routes.js',
        'contabilidad.routes.js',
        'pagos.routes.js',
        'entradasV2.routes.js'
      ]
    }
  },
  public: {
    files: [
      'index.html',
      '404.html',
      'pages/auth/login.html',
      'pages/admin/admin-dashboard.html'
    ],
    dirs: [
      'css',
      'js',
      'images',
      'fonts'
    ]
  }
};

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function checkFile(filePath) {
  return existsSync(filePath);
}

async function checkDir(dirPath) {
  return existsSync(dirPath) && statSync(dirPath).isDirectory();
}

async function checkFileContent(filePath, checks) {
  if (!existsSync(filePath)) return { exists: false, content: [] };
  
  const fs = await import('fs/promises');
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const results = checks.map(check => ({
      name: check.name,
      found: check.pattern.test(content)
    }));
    return { exists: true, content: results };
  } catch (err) {
    return { exists: false, content: [] };
  }
}

async function auditProject() {
  log('cyan', '\n╔════════════════════════════════════════════════════════════╗');
  log('cyan', '║         AUDITORÍA COMPLETA DEL PROYECTO                    ║');
  log('cyan', '╚════════════════════════════════════════════════════════════╝\n');

  const backendDir = path.join(__dirname, 'teatro-tickets-backend');
  const publicDir = path.join(__dirname, 'public');

  let totalIssues = 0;
  let totalWarnings = 0;

  // =========================================================================
  // 1. ARCHIVOS RAÍZ
  // =========================================================================
  
  log('blue', '📁 VERIFICANDO ARCHIVOS RAÍZ');
  log('blue', '─'.repeat(60));

  for (const file of STRUCTURE.required.files) {
    const filePath = path.join(__dirname, file);
    const exists = await checkFile(filePath);
    if (exists) {
      log('green', `  ✓ ${file}`);
    } else {
      log('red', `  ✗ ${file} - NO ENCONTRADO`);
      totalIssues++;
    }
  }

  // =========================================================================
  // 2. DIRECTORIOS RAÍZ
  // =========================================================================
  
  log('blue', '\n📁 VERIFICANDO DIRECTORIOS RAÍZ');
  log('blue', '─'.repeat(60));

  for (const dir of STRUCTURE.required.dirs) {
    const dirPath = path.join(__dirname, dir);
    const exists = await checkDir(dirPath);
    if (exists) {
      log('green', `  ✓ ${dir}/`);
    } else {
      log('red', `  ✗ ${dir}/ - NO ENCONTRADO`);
      totalIssues++;
    }
  }

  // =========================================================================
  // 3. BACKEND - ESTRUCTURA
  // =========================================================================
  
  log('blue', '\n📁 VERIFICANDO ESTRUCTURA BACKEND');
  log('blue', '─'.repeat(60));

  for (const dir of STRUCTURE.backend.dirs) {
    const dirPath = path.join(backendDir, dir);
    const exists = await checkDir(dirPath);
    if (exists) {
      log('green', `  ✓ ${dir}/`);
    } else {
      log('yellow', `  ⚠ ${dir}/ - NO ENCONTRADO (puede no ser crítico)`);
      totalWarnings++;
    }
  }

  // =========================================================================
  // 4. BACKEND - ARCHIVOS
  // =========================================================================
  
  log('blue', '\n📄 VERIFICANDO ARCHIVOS BACKEND');
  log('blue', '─'.repeat(60));

  for (const [dir, files] of Object.entries(STRUCTURE.backend.files)) {
    log('cyan', `\n  📂 ${dir}/`);
    for (const file of files) {
      const filePath = path.join(backendDir, dir, file);
      const exists = await checkFile(filePath);
      if (exists) {
        log('green', `    ✓ ${file}`);
      } else {
        log('red', `    ✗ ${file} - NO ENCONTRADO`);
        totalIssues++;
      }
    }
  }

  // =========================================================================
  // 5. PUBLIC - ESTRUCTURA
  // =========================================================================
  
  log('blue', '\n📁 VERIFICANDO ESTRUCTURA PUBLIC');
  log('blue', '─'.repeat(60));

  for (const dir of STRUCTURE.public.dirs) {
    const dirPath = path.join(publicDir, dir);
    const exists = await checkDir(dirPath);
    if (exists) {
      log('green', `  ✓ ${dir}/`);
    } else {
      log('yellow', `  ⚠ ${dir}/ - NO ENCONTRADO`);
      totalWarnings++;
    }
  }

  // =========================================================================
  // 6. PUBLIC - ARCHIVOS HTML
  // =========================================================================
  
  log('blue', '\n📄 VERIFICANDO ARCHIVOS HTML');
  log('blue', '─'.repeat(60));

  for (const file of STRUCTURE.public.files) {
    const filePath = path.join(publicDir, file);
    const exists = await checkFile(filePath);
    if (exists) {
      log('green', `  ✓ ${file}`);
      
      // Validar contenido HTML
      const checks = [
        { name: 'DOCTYPE', pattern: /<!DOCTYPE html>/i },
        { name: '<html>', pattern: /<html/i },
        { name: '<body>', pattern: /<body/i },
        { name: '<head>', pattern: /<head/i }
      ];
      
      const content = await checkFileContent(filePath, checks);
      if (content.exists) {
        const allValid = content.content.every(c => c.found);
        if (allValid) {
          log('green', `    ✓ Estructura HTML válida`);
        } else {
          const missing = content.content.filter(c => !c.found).map(c => c.name);
          log('yellow', `    ⚠ Faltan elementos: ${missing.join(', ')}`);
          totalWarnings++;
        }
      }
    } else {
      log('red', `  ✗ ${file} - NO ENCONTRADO`);
      totalIssues++;
    }
  }

  // =========================================================================
  // 7. VALIDACIÓN DE PACKAGE.JSON
  // =========================================================================
  
  log('blue', '\n📦 VALIDANDO PACKAGE.JSON');
  log('blue', '─'.repeat(60));

  const packagePath = path.join(__dirname, 'package.json');
  if (existsSync(packagePath)) {
    const checks = [
      { name: 'express', pattern: /"express":\s*"/ },
      { name: 'postgresql', pattern: /"pg":\s*"/ },
      { name: 'dotenv', pattern: /"dotenv":\s*"/ },
      { name: 'cors', pattern: /"cors":\s*"/ },
      { name: 'helmet', pattern: /"helmet":\s*"/ },
      { name: 'uuid', pattern: /"uuid":\s*"/ },
      { name: 'compression', pattern: /"compression":\s*"/ }
    ];

    const content = await checkFileContent(packagePath, checks);
    if (content.exists) {
      content.content.forEach(c => {
        if (c.found) {
          log('green', `  ✓ ${c.name} instalado`);
        } else {
          log('red', `  ✗ ${c.name} - NO ENCONTRADO`);
          totalIssues++;
        }
      });
    }
  } else {
    log('red', '  ✗ package.json no encontrado');
    totalIssues++;
  }

  // =========================================================================
  // 8. VALIDACIÓN DE .ENV.EXAMPLE
  // =========================================================================
  
  log('blue', '\n🔐 VALIDANDO VARIABLES DE ENTORNO');
  log('blue', '─'.repeat(60));

  const envExamplePath = path.join(__dirname, '.env.example');
  if (existsSync(envExamplePath)) {
    const requiredEnvVars = [
      'NODE_ENV',
      'PORT',
      'PGHOST',
      'PGPORT',
      'PGDATABASE',
      'PGUSER',
      'PGPASSWORD',
      'JWT_SECRET',
      'FRONTEND_URL',
      'CORS_ORIGINS'
    ];

    const checks = requiredEnvVars.map(v => ({
      name: v,
      pattern: new RegExp(`^${v}=`, 'm')
    }));

    const content = await checkFileContent(envExamplePath, checks);
    if (content.exists) {
      content.content.forEach(c => {
        if (c.found) {
          log('green', `  ✓ ${c.name}`);
        } else {
          log('yellow', `  ⚠ ${c.name} - NO DEFINIDO`);
          totalWarnings++;
        }
      });
    }
  } else {
    log('yellow', '  ⚠ .env.example no encontrado');
    totalWarnings++;
  }

  // =========================================================================
  // 9. RESUMEN
  // =========================================================================
  
  log('cyan', '\n╔════════════════════════════════════════════════════════════╗');
  log('cyan', '║                        RESUMEN                             ║');
  log('cyan', '╚════════════════════════════════════════════════════════════╝\n');

  if (totalIssues === 0 && totalWarnings === 0) {
    log('green', '✓ PROYECTO EN PERFECTO ESTADO');
  } else {
    if (totalIssues > 0) {
      log('red', `✗ ${totalIssues} ERRORES CRÍTICOS ENCONTRADOS`);
    }
    if (totalWarnings > 0) {
      log('yellow', `⚠ ${totalWarnings} ADVERTENCIAS ENCONTRADAS`);
    }
  }

  log('cyan', '\n' + '─'.repeat(60));
  log('cyan', `Archivos faltantes: ${totalIssues}`);
  log('cyan', `Advertencias: ${totalWarnings}`);
  log('cyan', '─'.repeat(60) + '\n');

  // =========================================================================
  // 10. RECOMENDACIONES
  // =========================================================================

  if (totalIssues > 0 || totalWarnings > 0) {
    log('blue', '💡 RECOMENDACIONES:');
    log('blue', '─'.repeat(60));
    
    if (totalIssues > 0) {
      log('red', '\n  Errores críticos a resolver:');
      log('yellow', '  1. Crear directorios faltantes');
      log('yellow', '  2. Crear archivos .js faltantes');
      log('yellow', '  3. Crear archivos HTML faltantes');
      log('yellow', '  4. Instalar dependencias: npm install');
    }

    if (totalWarnings > 0) {
      log('yellow', '\n  Advertencias a considerar:');
      log('yellow', '  1. Crear directorios de recursos (css, js, images)');
      log('yellow', '  2. Completar estructura de carpetas');
      log('yellow', '  3. Definir todas las variables en .env.example');
    }

    log('blue', '\n  Comandos sugeridos:');
    log('cyan', '  npm install');
    log('cyan', '  cp .env.example .env');
    log('cyan', '  npm run dev\n');
  }

  return { issues: totalIssues, warnings: totalWarnings };
}

// Ejecutar auditoría
const result = await auditProject();
process.exit(result.issues > 0 ? 1 : 0);
