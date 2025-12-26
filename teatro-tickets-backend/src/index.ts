/*
  Punto de entrada para migración gradual a TypeScript.
  - No reemplaza el runtime actual (index-v3-postgres.js)
  - Úsalo para desarrollar nuevas piezas tipadas o experimentar con TS.
  - Scripts:
    - npm run ts:dev   -> arranca en modo watch usando tsx
    - npm run ts:check -> chequea tipos sin emitir
    - npm run ts:build -> compila a dist/
*/

console.log("TS bootstrap listo ✅ – puedes empezar a migrar módulos a src/...");
