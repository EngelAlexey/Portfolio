#!/usr/bin/env bash
# Ejecuta cada petición contra el laboratorio y deja la salida en mediciones.txt
cd "$(dirname "$0")"
NODE=~/node24/bin/node
$NODE lab.mjs > servidor.log 2>&1 &
PID=$!
trap 'kill $PID' EXIT
for i in $(seq 1 60); do curl -s -o /dev/null http://127.0.0.1:3000/ && break; sleep 0.5; done
B=http://127.0.0.1:3000
J=/tmp/lab-cookies
rm -f $J

t() { echo; echo "### $1"; echo "\$ $2"; bash -c "$2" 2>&1; echo; }

echo "node $($NODE -v) | $(curl --version | head -1 | cut -d' ' -f1-2) | $(uname -sr)"

t "login ana (vulnerable), cabecera Set-Cookie" "curl -s -i -c $J -X POST $B/v/login -d nombre=ana -d clave=ana-clave-larga | grep -i set-cookie"
t "IDOR vulnerable: ana pide la factura 3 de luis" "curl -s -b $J $B/v/facturas/3"
t "IDOR corregido" "curl -s -o /dev/null -w '%{http_code}' -b $J $B/f/facturas/3"
t "SQL normal" "curl -s -b $J -G $B/v/buscar --data-urlencode q=Hosting"
t "SQL inyectada" "curl -s -b $J -G $B/v/buscar --data-urlencode \"q=' OR 1=1 --\""
t "SQL corregida con la misma entrada" "curl -s -b $J -G $B/f/buscar --data-urlencode \"q=' OR 1=1 --\""
t "error detallado vulnerable" "curl -s -G $B/v/ordenar --data-urlencode 'campo=nada'"
t "error detallado corregido" "curl -s -G $B/f/ordenar --data-urlencode 'campo=nada'"
t "XSS vulnerable" "curl -s -G $B/v/saludo --data-urlencode 'nombre=<img src=x onerror=alert(document.cookie)>'"
t "XSS corregido" "curl -s -G $B/f/saludo --data-urlencode 'nombre=<img src=x onerror=alert(document.cookie)>'"
t "órdenes normal" "curl -s -G $B/v/dns --data-urlencode 'host=localhost'"
t "órdenes inyectada" "curl -s -G $B/v/dns --data-urlencode 'host=localhost; id'"
t "órdenes corregida" "curl -s -w ' [%{http_code}]' -G $B/f/dns --data-urlencode 'host=localhost; id'"
t "órdenes corregida, nombre válido" "curl -s -G $B/f/dns --data-urlencode 'host=localhost'"
t "rutas normal" "curl -s -G $B/v/docs --data-urlencode 'nombre=manual.txt'"
t "rutas vulnerable" "curl -s -G $B/v/docs --data-urlencode 'nombre=../.env'"
t "rutas corregida" "curl -s -o /dev/null -w '%{http_code}' -G $B/f/docs --data-urlencode 'nombre=../.env'"
t "rutas corregida, nombre válido" "curl -s -G $B/f/docs --data-urlencode 'nombre=manual.txt'"
t "SSRF vulnerable" "curl -s -G $B/v/vista-previa --data-urlencode 'url=http://127.0.0.1:4001/admin'"
t "SSRF filtro por texto" "curl -s -G $B/v2/vista-previa --data-urlencode 'url=http://127.0.0.1:4001/admin'"
t "SSRF filtro por texto, IP en decimal" "curl -s -G $B/v2/vista-previa --data-urlencode 'url=http://2130706433:4001/admin'"
t "SSRF corregido, IP en decimal" "curl -s -w ' [%{http_code}]' -G $B/f/vista-previa --data-urlencode 'url=http://2130706433:4001/admin'"
t "SSRF corregido, destino permitido" "curl -s -w ' [%{http_code}]' -G $B/f/vista-previa --data-urlencode 'url=https://example.com/' | head -c 120"
t "cuenta de fábrica" "curl -s -X POST $B/v/login -d nombre=admin -d clave=admin"
t "fuerza bruta vulnerable: 20 intentos" "for i in \$(seq 1 20); do curl -s -o /dev/null -w '%{http_code} ' -X POST $B/v/login -d nombre=luis -d clave=intento\$i; done"
t "fuerza bruta corregida: 8 intentos" "for i in \$(seq 1 8); do curl -s -o /dev/null -w '%{http_code} ' -X POST $B/f/login -d nombre=luis -d clave=intento\$i; done"
t "fuerza bruta corregida: Retry-After" "curl -s -i -X POST $B/f/login -d nombre=luis -d clave=luis-clave-larga | grep -iE '^HTTP|retry-after'"
t "cookie corregida (ana)" "curl -s -i -X POST $B/f/login -d nombre=ana -d clave=ana-clave-larga | grep -i set-cookie"
t "CSRF vulnerable: petición desde otro sitio" "curl -s -b $J -H 'Sec-Fetch-Site: cross-site' -X POST $B/v/email -d email=atacante@ejemplo.test"
t "CSRF corregido: petición desde otro sitio" "curl -s -b $J -H 'Sec-Fetch-Site: cross-site' -X POST $B/f/email -d email=atacante@ejemplo.test"

# JWT
NONE=$($NODE -e "const b=o=>Buffer.from(JSON.stringify(o)).toString('base64url');console.log(b({alg:'none',typ:'JWT'})+'.'+b({sub:'ana',rol:'admin'})+'.')")
DEBIL=$($NODE -e "console.log(require('jsonwebtoken').sign({sub:'ana',rol:'admin'},'secret'))")
t "JWT: el contenido se lee sin la clave" "curl -s $B/f/token | cut -d. -f2 | base64 -d 2>/dev/null; echo"
t "JWT alg none contra jwt.decode" "curl -s -H 'Authorization: Bearer $NONE' $B/v/perfil"
t "JWT alg none contra jwt.verify por defecto" "curl -s -H 'Authorization: Bearer $NONE' $B/v2/perfil"
t "JWT firmado con 'secret' contra el secreto débil" "curl -s -H 'Authorization: Bearer $DEBIL' $B/v2/perfil"
t "JWT firmado con 'secret' contra el corregido" "curl -s -H 'Authorization: Bearer $DEBIL' $B/f/perfil"
T=$(curl -s $B/f/token)
t "JWT legítimo contra el corregido" "curl -s -H 'Authorization: Bearer $T' $B/f/perfil"
