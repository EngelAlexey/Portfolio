const ADMIN_PASS = process.env.ADMIN_PASSWORD;
if (!ADMIN_PASS || ADMIN_PASS.length < 16) {
  throw new Error('Defina ADMIN_PASSWORD con 16 caracteres o más');
}
console.log('arranca');
