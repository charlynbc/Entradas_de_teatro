import bcrypt from 'bcrypt';

const password = 'Teamomama91';

bcrypt.hash(password, 10).then(hash => {
  console.log('Hash de la contraseña "Teamomama91":');
  console.log(hash);
}).catch(err => {
  console.error('Error:', err);
});
