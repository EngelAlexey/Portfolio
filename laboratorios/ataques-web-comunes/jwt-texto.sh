cd "$(dirname "$0")"
export PATH=~/node24/bin:$PATH
node lab.mjs > /dev/null 2>&1 & PID=$!; trap 'kill $PID' EXIT
for i in $(seq 1 60); do curl -s -o /dev/null http://127.0.0.1:3000/ && break; sleep 0.5; done
echo '--- base64 exacto del artículo'
curl -s http://127.0.0.1:3000/f/token | cut -d. -f2 | base64 -d; echo " exit=$?"
# Token sin firma, con "alg":"none"
NONE=$(node -e "const b=o=>Buffer.from(JSON.stringify(o)).toString('base64url');
  console.log(b({alg:'none',typ:'JWT'})+'.'+b({sub:'ana',rol:'admin'})+'.')")
# Token firmado con el secreto «secret»
DEBIL=$(node -e "console.log(require('jsonwebtoken').sign({sub:'ana',rol:'admin'},'secret'))")
echo '--- NONE v'; curl -s -H "Authorization: Bearer $NONE" http://127.0.0.1:3000/v/perfil; echo
echo '--- NONE v2'; curl -s -H "Authorization: Bearer $NONE" http://127.0.0.1:3000/v2/perfil; echo
echo '--- DEBIL v2'; curl -s -H "Authorization: Bearer $DEBIL" http://127.0.0.1:3000/v2/perfil; echo
echo '--- DEBIL f'; curl -s -H "Authorization: Bearer $DEBIL" http://127.0.0.1:3000/f/perfil; echo
echo '--- vencido'
V=$(node -e "console.log(require('jsonwebtoken').sign({sub:'ana',rol:'usuario',exp:Math.floor(Date.now()/1000)-60},'secret'))")
echo '--- login sesión (texto sec.2)'; curl -s -c /tmp/lab-cookies -X POST http://127.0.0.1:3000/v/login -d nombre=ana -d clave=ana-clave-larga; echo
echo '--- f/perfil sin token'; curl -s http://127.0.0.1:3000/f/perfil; echo
