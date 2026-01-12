const http = require('http');

console.log('Testing /api/public/funciones...');

http.get('http://localhost:3000/api/public/funciones', (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:');
    console.log(data);
  });
}).on('error', (err) => {
  console.error('Error:', err.message);
});
