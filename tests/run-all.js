const { spawnSync } = require('child_process');

const DATABASE_URL_DEFAULT = 'postgres://postgres:postgres@localhost:5432/teatro';

function run(scriptPath) {
  const env = {
    ...process.env,
    DATABASE_URL: process.env.DATABASE_URL || DATABASE_URL_DEFAULT,
    BASE_URL: process.env.BASE_URL || 'http://localhost:3000'
  };

  const result = spawnSync(process.execPath, [scriptPath], {
    stdio: 'inherit',
    env
  });

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

async function main() {
  // Nota: estos tests asumen que DB y backend ya están corriendo.
  // Si querés levantar todo automáticamente, usá las tasks del workspace.

  run('tests/test-super-usuario.js');
  run('tests/test-director.js');
  run('tests/test-vendedores.js');
  run('tests/test-invitados.js');
  run('tests/test-regla-director-grupo.js');
  run('tests/test-liquidacion-grupo.js');

  console.log('\n✅ Suite completa: OK');
}

main().catch(err => {
  console.error('❌ Suite completa falló:', err);
  process.exit(1);
});
