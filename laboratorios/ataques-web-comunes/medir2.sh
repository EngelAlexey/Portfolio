#!/usr/bin/env bash
cd "$(dirname "$0")"
export PATH=~/node24/bin:$PATH
PERMITIDOS=example.com,www.iana.org,localhost node lab.mjs > servidor2.log 2>&1 & PID=$!; trap 'kill $PID' EXIT
for i in $(seq 1 60); do curl -s -o /dev/null http://127.0.0.1:3000/ && break; sleep 0.5; done
B=http://127.0.0.1:3000; J=/tmp/lab-cookies; rm -f $J
t() { echo; echo "### $1"; echo "\$ $2"; bash -c "$2" 2>&1; echo; }
curl -s -c $J -X POST $B/v/login -d nombre=ana -d clave=ana-clave-larga >/dev/null
t "CSRF corregido: otro sitio" "curl -s -b $J -H 'Sec-Fetch-Site: cross-site' -X POST $B/f/email -d email=atacante@ejemplo.test"
t "CSRF corregido: sin cabeceras ni token" "curl -s -w ' [%{http_code}]' -b $J -X POST $B/f/email -d email=atacante@ejemplo.test"
t "CSRF corregido: Origin ajeno sin Sec-Fetch-Site" "curl -s -b $J -H 'Origin: https://atacante.example' -X POST $B/f/email -d email=atacante@ejemplo.test"
R=$(curl -s -i -X POST $B/f/login -d nombre=ana -d clave=ana-clave-larga)
SID=$(echo "$R" | grep -i set-cookie | sed -E 's/.*sid=([^;]+);.*/\1/')
TOK=$(echo "$R" | tail -1 | sed -E 's/.*"csrf":"([^"]+)".*/\1/')
t "CSRF corregido: misma página con token" "curl -s -H 'Cookie: sid=$SID' -H 'Sec-Fetch-Site: same-origin' -H 'X-CSRF-Token: $TOK' -X POST $B/f/email -d email=ana@ejemplo.test"
t "CSRF corregido: misma página con token equivocado" "curl -s -H 'Cookie: sid=$SID' -H 'Sec-Fetch-Site: same-origin' -H 'X-CSRF-Token: otro' -X POST $B/f/email -d email=ana@ejemplo.test"
t "SSRF corregido, IP en decimal" "curl -s -w ' [%{http_code}]' -G $B/f/vista-previa --data-urlencode 'url=http://2130706433:4001/admin'"
t "SSRF corregido, nombre permitido que resuelve a 127.0.0.1" "curl -s -w ' [%{http_code}]' -G $B/f/vista-previa --data-urlencode 'url=https://localhost:4001/admin'"
t "SSRF corregido, destino permitido" "curl -s -w ' [%{http_code}]' -G $B/f/vista-previa --data-urlencode 'url=https://example.com/' | head -c 100"
t "SSRF corregido, redirección" "curl -s -w ' [%{http_code}]' -G $B/f/vista-previa --data-urlencode 'url=https://www.iana.org/domains/example'"
t "fuerza bruta: Retry-After" "for i in \$(seq 1 5); do curl -s -o /dev/null -X POST $B/f/login -d nombre=luis -d clave=x\$i; done; curl -s -i -X POST $B/f/login -d nombre=luis -d clave=luis-clave-larga | grep -iE '^HTTP|retry-after'"
t "SSRF corregido, IPv4 escrita en IPv6" "curl -s -w ' [%{http_code}]' -G $B/f/vista-previa --data-urlencode 'url=http://[::ffff:127.0.0.1]:4001/admin'"
