cd "$(dirname "$0")"
echo '$ node fabrica.mjs'; ~/node24/bin/node fabrica.mjs 2>&1 | grep -E "Error|arranca"; echo "exit=${PIPESTATUS[0]}"
echo '$ ADMIN_PASSWORD=... node fabrica.mjs'; ADMIN_PASSWORD=$(openssl rand -base64 24) ~/node24/bin/node fabrica.mjs; echo "exit=$?"
