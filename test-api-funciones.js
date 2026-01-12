#!/usr/bin/env node
/**
 * Test del endpoint /api/public/funciones
 */

import http from 'http';

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/public/funciones',
  method: 'GET',
  headers: {
    'Accept': 'application/json'
  }
};

console.log('Probando: GET http://localhost:3000/api/public/funciones\n');

const req = http.request(options, (res) => {
  let data = '';
  
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers, null, 2)}`);
  console.log('\nResponse Body:');
  console.log('---');
  
  res.setEncoding('utf8');
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log(JSON.stringify(json, null, 2));
      console.log('---');
      console.log(`\nTotal funciones: ${Array.isArray(json) ? json.length : 'N/A'}`);
    } catch (e) {
      console.log(data);
      console.log('---');
      console.log('\n⚠️  La respuesta no es JSON válido');
    }
  });
});

req.on('error', (e) => {
  console.error(`❌ Error: ${e.message}`);
});

req.end();
