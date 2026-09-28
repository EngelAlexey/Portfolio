# Auditoría: ataques-web-comunes (es.mdx, en.mdx, prompt.es.md, prompt.en.md)

Fecha: 2026-09-27. Line numbers refer to es.mdx after the coordinator's table edit; en.mdx has the same line numbers. Evidence used: mediciones.txt, audit.txt, fabrica.txt, jwt-texto.txt, lab.mjs, fuentes.md, raw/*, the live pages (WebFetch: OWASP Credential Stuffing CS, AWS IMDS, npm audit v11, HIBP API v3), a live Pwned Passwords query, `/etc/os-release` in the WSL Ubuntu distro, and a new run of the lab (`auditoria-pruebas.sh` in this folder) with extra adversarial requests.

## Table

| # | Location | Claim | Check done | Verdict | Correction |
|---|---|---|---|---|---|
| 1 | es:24 | OWASP Top 10:2025 uses data from more than 2.8 million applications | raw/intro.txt, fuentes §1 ("over 2.8 millions applications") | OK | — |
| 2 | es:24 | A01 has 1 839 701 recorded cases | raw A01 score table: Total Occurrences 1,839,701 | OK | "casos registrados" is fine for "occurrences" |
| 3 | es:24 | The fourteen attacks belong to five of the ten categories | New table: A01, A02, A03, A05, A07 = 5 | OK (after the edit; the old text said "siete", which was wrong) | — |
| 4 | es:24 | "y todos se evitan en el código del servidor" | Points 7 and 8 are prevented by install config, CI and updates; point 15 by MFA and the breached-password check | MISLEADING | "y todos se evitan en el código o la configuración del proyecto" |
| 5 | es:26 | Node 24.19.0, Express 5.2.1, jsonwebtoken 9.0.3, npm 11.17.0, curl 8.18.0, Ubuntu 26.04 | mediciones header (node, curl), audit.txt (npm 11.17.0), package.json (^5.2.1, ^9.0.3); `/etc/os-release` in WSL Ubuntu = "Ubuntu 26.04 LTS" | OK | Express/jsonwebtoken exact versions come from the `^` ranges plus the lockfile; not rechecked in the lockfile |
| 6 | es:26 | Measured on 27 September 2026 | The cookie Expires is 28 Sep 03:22:17 GMT minus 7200 s, so the run was at 28 Sep 01:22 UTC (27 Sep in American local time) | OK | — |
| 7 | es:30 + table | Families: Acceso (A01), Instalar y configurar (A02 y A03), Inyección (A05), Cuentas (A07) | Opened raw A02/A03/A07/A08/A10 text (see the "Family labels" section below) | OK, defensible with one caveat | Default account is stronger in A07: prose, CWE-1392/1393 and "Do not ship ... default credentials" |
| 8 | es:30 | Cite 1 (Introduction) supports "in the order of their categories" | The intro lists the ranking | OK | — |
| 9 | es:49 | OWASP maps improperly verified signatures (CWE-347) to A04 | raw A04 list contains CWE-347 | OK | Optional: A07's text also says "for JWTs validate aud, iss claims", which fits the section 17 fix |
| 10 | es:34–47 | "Más detalle" cross-links: Ocho cosas 2/3/7/8, CORS 7, Cómo proteger 6, points 5/6/8/9/13/15/16 | Headings of revisar-codigo-generado-por-ia, que-es-cors, como-proteger-una-pagina-web (es + en); section numbers of this article | OK | — |
| 11 | es:34–47 (en) | EN links /en/blog/seven-things-to-check-in-ai-generated-code, what-is-cors, npm-vs-pnpm-install-security, how-to-secure-a-web-application | `path:` frontmatter of each en.mdx | OK | The "seven-things" slug under the title "Eight things" is a pre-existing oddity, not this article's |
| 12 | es:55 | Lab: 127.0.0.1:3000, internal service on 4001, ana/luis, invoice 1 belongs to ana, 2–3 to luis | lab.mjs:21-22, 258, 263 | OK | — |
| 13 | es:58 | Login command stores ana's session | jwt-texto.txt "login sesión" → {"ok":true} | OK | — |
| 14 | es:63 | IDOR definition, Cite 3 = CWE-639 | fuentes §2 (MITRE lists IDOR as an alternative term) | OK | — |
| 15 | es:66-70 | Vulnerable IDOR route | lab.mjs:79-83 identical | OK | — |
| 16 | es:76-77 | Output `{"id":3,...,"total":900}` | mediciones "IDOR vulnerable" | OK | — |
| 17 | es:88 | /f/facturas/3 → 404; 404 rather than 403 hides existence | mediciones "IDOR corregido" 404 | OK | — |
| 18 | es:88 | Ocho cosas point 2 covers the case in Next.js | revisar…/es.mdx:87-100 (route handler with ctx.params) | OK | — |
| 19 | es:92 | CSRF definition, the browser attaches the cookie; Cite 4 = CWE-352 | CWE-352 | OK | Not mentioned: with no SameSite, Chrome treats the cookie as Lax, so the /v/email attack from a real site works mainly in browsers without Lax-by-default. fuentes §11 advises against claiming this, so keeping silent is acceptable |
| 20 | es:101 | "Sec-Fetch-Site ... con el origen de la petición" | CSRF CS l.175: the header gives the *relationship* (same-origin, same-site, cross-site, none), not the origin | MISLEADING (es and en: "which says where the request came from") | "que indica si la petición viene del mismo origen, del mismo sitio o de otro sitio" |
| 21 | es:104-106 | curl with Sec-Fetch-Site: cross-site → {"cambiado":true,...} | mediciones "CSRF vulnerable" (the article adds a `\` line break) | OK | — |
| 22 | es:109 | OWASP: token required, SameSite as defence in depth, Sec-Fetch-Site as the primary signal in modern browsers, Origin fallback mandatory | CSRF CS l.171, 175, 192; fuentes §11 | OK | The fix code does **not** implement the Origin fallback that the sentence calls mandatory; it relies on the token. Add "La ruta corregida usa el token como respaldo" or add the Origin check |
| 23 | es:112-119 | /f/email fix code | lab.mjs:206-213 identical | OK as a copy, **WRONG as security code** | `req.get('X-CSRF-Token') !== u.csrf` passes when both are `undefined`. Measured: with the /v/login session (the one the article tells the reader to use), `POST /f/email` without Sec-Fetch-Site and without a token → `{"cambiado":true}` [200] (auditoria-pruebas.sh, case A). Any session created without `csrf`, or any legacy or non-browser client, bypasses the check. Fix: `const t = req.get('X-CSRF-Token'); if (!u.csrf \|\| !t \|\| t.length !== u.csrf.length \|\| !crypto.timingSafeEqual(Buffer.from(t), Buffer.from(u.csrf)))`. Timing safety matters little for a per-session token over the network, but it costs nothing and OWASP uses constant-time comparison for its HMAC variant (CS l.137-148) |
| 24 | es:122 | Another site cannot read the token because of the same-origin policy | True unless CORS reflects origins with credentials | OK | Optional: "salvo que CORS lo permita (punto 6 de Qué es CORS)" |
| 25 | es:124 | /f/email → 403 {"error":"origen no permitido"} | mediciones "CSRF corregido" | OK | The check exercises only the Sec-Fetch-Site branch; add a second check without the header and without the token that must return 403 (today it returns 200, see #23) |
| 26 | es:124 | The CORS simulator has a case "CORS no frena CSRF" | CorsSimulator.astro:130-131 (es), 247-248 "CORS does not stop CSRF" (en) | OK | — |
| 27 | es:128 | SSRF definition; Cite 6 = CWE-918 | fuentes §2 | OK | — |
| 28 | es:131-134 | /v/vista-previa code | lab.mjs:168-171 | OK | — |
| 29 | es:140-141 | Output "servicio interno: ...NO-DEBERIA-SALIR" | mediciones "SSRF vulnerable" | OK | — |
| 30 | es:144 | IMDS at 169.254.169.254; accepts IMDSv1 by default; IMDSv2 uses a PUT token and only protects if required | AWS page (WebFetch): "By default, you can use either IMDSv1 or IMDSv2, or both." and "When token usage is set to required …" | OK | Nuance not in the cited page: some AMIs (e.g. AL2023) and account-level defaults now launch with IMDSv2 required. Optional: "según la AMI y la configuración de la cuenta" |
| 31 | es:146-152 | Text filter blocks 127.0.0.1 but 2130706433 passes | mediciones "SSRF filtro por texto" and "IP en decimal"; lab.mjs:173-178 regex matches the description | OK | — |
| 32 | es:155 | 2130706433 = 127.0.0.1; Node's URL parser accepts it | 127·2²⁴+1 = 2130706433; the WHATWG parser normalises it (measured: it reached the service) | OK | — |
| 33 | es:155 | OWASP fix = allowlist + resolved-IP check + no redirects (Cite 8) | SSRF CS: allowlist, "Disable the support for the following of the redirection", IP-range check | OK | — |
| 34 | es:158-175 | /f/vista-previa code | lab.mjs:179-198 (reformatted, same logic) | OK | — |
| 35 | es:170-172 | `lookup` then `fetch` protects against internal destinations | `fetch` resolves the name again. The SSRF CS (l.114-117, 166, 304) warns about "DNS pinning"/rebinding and asks to check **all** A+AAAA records; `lookup()` without `{all:true}` checks only the first | MISLEADING / incomplete | Add one sentence: "`fetch` vuelve a resolver el nombre, así que un DNS que cambie de respuesta entre las dos consultas salta la comprobación. Con una lista cerrada de dominios propios el riesgo es bajo; si la lista es abierta, conecte a la IP comprobada (por ejemplo con un `Agent` de undici con `connect.lookup`) y compruebe todas las direcciones con `lookup(host, { all: true })`." |
| 36 | es:178 | privada() covers private, loopback and link-local ranges | lab.mjs:180-184: IPv4 10/8, 127/8, 0/8, 169.254/16, 172.16/12, 192.168/16, 100.64/10; IPv6 ::1, fc00::/7, fe80 (only the `fe80` prefix, not all of fe80::/10), and everything in ::ffff: | MISLEADING (incomplete, and the reader never sees the function) | The OWASP minimum list also has 224.0.0.0/4 and ff00::/8 (multicast); missing too: `::`, 240/4, 255.255.255.255, 198.18/15, NAT64 64:ff9b::/96. Either show the function or recommend a maintained check (e.g. ipaddr.js `range() !== 'unicast'`). Given the allowlist it is defence in depth, so one sentence is enough |
| 37 | es:180 | 2130706433 against /f → 400 "destino no permitido"; example.com returns the page | mediciones "SSRF corregido" [400] and the example.com HTML | OK but MISLEADING as a test | The 400 comes from the `https:`/allowlist check, not from `privada()`. The test never exercises the IP check. Say so, or drop the claim that the test checks the IP |
| 38 | es:172 / lab | Unhandled `lookup`/`fetch` failures | Express 5 forwards the rejected promise to the default handler, which outside production returns the error text (measured on /v/vista-previa: 500 with "TypeError: Failed to parse URL from nada") | MISLEADING against point 10 | Wrap `lookup`/`fetch` in try/catch and return 502, or mention `NODE_ENV=production` |
| 39 | es:184 | Path traversal definition, Cite 9 CWE-22 | fuentes §2 | OK | — |
| 40 | es:187-189 | /v/docs code | lab.mjs:154-160 has a try/catch that returns 404; the article leaves it out | OK (simplification, no output depends on it) | — |
| 41 | es:192-196 | path.join resolves ../; output DB_PASSWORD=super-secreta | mediciones "rutas vulnerable" | OK | — |
| 42 | es:199 | res.sendFile with root answers 403 to paths that leave it (Cite 10) | Express 5 doc + send code (fuentes §8); measured 403. The 403 comes from the traversal check, not from dotfiles:'deny' | OK | — |
| 43 | es:209 | Without Express: path.resolve plus a startsWith(folder + sep) check | Correct pattern | OK | Symlinks inside the folder are not covered (realpath). Minor |
| 44 | es:213 | Malicious package runs in postinstall; Cite 11 = CWE-506 | CWE-506 is a generic definition with no postinstall. The A03 page (Shai-Hulud, post-install) supports the sentence better | MISLEADING cite (weak support) | Cite A03:2025 (Scenario #3) for the postinstall part, or add it as a second cite. Now that the family says "A02 y A03", A03 is the natural reference |
| 45 | es:215-220 | Defence = approved scripts + npm ci + `npm audit signatures`; output "50 packages have verified registry signatures" | audit.txt (the next line "1 package has a verified attestation" is cut without "..."). Registry signatures only prove the registry served the tarball unchanged; a malicious version published with a stolen token (Shai-Hulud) is signed normally | MISLEADING | Say what signatures do *not* catch, and name the step that does help against freshly published malware: the waiting period (npm-vs-pnpm point 5, `min-release-age`/`minimumReleaseAge`). Add "..." or keep the attestation line |
| 46 | es:226 | "El proyecto no ha hecho nada mal: el fallo apareció después de instalarla." | The example installs Express 4.17.1 today, when its advisories are already public | MISLEADING (the example contradicts it) | "A menudo el proyecto no ha hecho nada mal: el fallo se publicó después de instalarla." |
| 47 | es:228 | npm audit sends the dependency list to the registry and gets the advisories (Cite 13) | npm docs v11: "POST it to the default configured registry at /-/npm/v1/security/advisories/bulk" | OK | — |
| 48 | es:231-237 | npm audit output | audit.txt (tail -25): the real output has path-to-regexp and other blocks **before** `qs`, and the article starts at `qs` with no leading "..." | MISLEADING edit (unmarked elision at the top) | Put `...` on the line after `$ npm audit` |
| 49 | es:239 | Exits with 1 on findings; --audit-level sets the minimum severity | audit.txt exit=1; npm docs quote | OK | — |
| 50 | es:241 | Clean tree → "found 0 vulnerabilities", exit 0 | npm docs "exit with a 0 exit code if no vulnerabilities"; the string is npm's standard output. The clean run is not in the evidence | OK (UNVERIFIED output string, low risk) | — |
| 51 | es:245 | Default account definition, Cite 14 = CWE-1392 | fuentes §2 | OK | A07 text literally names "admin"/"admin" and could be cited |
| 52 | es:248, 252-253 | `?? 'admin'` code; admin/admin → {"ok":true} | lab.mjs:26; mediciones "cuenta de fábrica" | OK | — |
| 53 | es:258-265 | The fix throws without ADMIN_PASSWORD ≥16 characters | fabrica.txt: error and exit=1; with the variable, exit=0 | OK | — |
| 54 | es:269 | Detailed error definition, Cite 15 = CWE-209 | fuentes §2 | OK | — |
| 55 | es:272-283 | /v/ordenar code and output with lab.mjs:110:17 and "..." elisions | lab.mjs:108-114; mediciones (path shortened to `.../lab.mjs`, frames cut with "...") | OK (elisions marked) | — |
| 56 | es:289-297, 300 | Fix: CAMPOS set, 400 {"error":"campo no válido"}, randomUUID in the log | lab.mjs:115-126; mediciones | OK | — |
| 57 | es:300 | Ocho cosas point 7 "explica cómo buscar el identificador en los registros" | revisar…/es.mdx:273-297 says to return an id "para encontrarlo después" but does not explain how to search the logs | MISLEADING | "explica por qué el detalle va al registro y no a la respuesta" |
| 58 | es:304 | SQLi definition, Cite 16 = CWE-89 | — | OK | — |
| 59 | es:307-308 | Vulnerable SQL | lab.mjs:95 (the article splits it into two lines; harmless) | OK | — |
| 60 | es:311-315 | `' OR 1=1 --` explanation and output with the three invoices | mediciones "SQL inyectada" | OK | — |
| 61 | es:321-322, 325 | Parameterised query; /f/buscar → [] | lab.mjs:103; mediciones | OK | Optional: `%` and `_` still act as LIKE wildcards (harmless here) |
| 62 | es:325 | Ocho cosas point 3 covers column names | revisar…/es.mdx:143-149 | OK | — |
| 63 | es:329-350 | XSS code, output, escapar(), /f output, React/Astro/EJS escape by default | lab.mjs:129-136; mediciones XSS vulnerable/corregido | OK | Escaping the five characters is enough only in text and quoted-attribute contexts (not `href="javascript:..."` or `<script>`). Point 8 of Ocho cosas covers href; a short mention would help |
| 64 | es:354 | exec uses /bin/sh, which interprets ; && \| $() (Cite 19) | Node child_process doc (fuentes §7); the default shell on Unix is /bin/sh | OK | — |
| 65 | es:357-368 | /v/dns code and output | lab.mjs:139-143; mediciones "órdenes inyectada" (the groups list is cut with "...") | OK | — |
| 66 | es:373-382 | HOST regex + execFile; 400 "host no válido"; localhost still works | lab.mjs:144-151 (callback condensed); mediciones [400] and the valid-name run | OK | The regex also blocks a leading `-` (option injection). Good |
| 67 | es:386-391 | 20 attempts → 20× 401 | mediciones | OK | — |
| 68 | es:394 | "cuenta los fallos ... y, a partir del quinto, responde 429" | Output: 5× 401 then 429 on the **sixth**; the check at es:404 says sixth | WRONG (in Spanish "a partir del quinto" reads as the fifth attempt) | "y, tras el quinto fallo, responde 429". EN "from the fifth one on": same fix, "after the fifth failure" |
| 69 | es:397-399 | 8 attempts → 401×5, 429×3 | mediciones | OK | — |
| 70 | es:402 | The correct password also gets 429 during the lock | mediciones "Retry-After": 429 with luis-clave-larga | OK | — |
| 71 | es:402 | OWASP ties the counter to the account; MFA is the best defence (Cite 21) | Auth CS: "associated with the account itself"; MFA "by far the best defense against the majority of password-related attacks" | OK (the article drops "la mayoría", a slight overstatement) | "la mejor defensa contra la mayoría de los ataques a contraseñas" (the sister article already says it this way) |
| 72 | es:402 | NIST: at most 100 consecutive failed attempts per account (Cite 22) | NIST 800-63B-4 §3.2.2 (fuentes §10) | OK | — |
| 73 | es:404 | "Retry-After: 900" | 900 appears only when the check runs within 1 s of the first failure. `Retry-After` counts from the **first** failure (lab.mjs:61), so a reader gets ≤900 | MISLEADING | "Retry-After con los segundos que faltan (900 si lo comprueba enseguida)" |
| 74 | lab.mjs:56 (not shown in the article) | Brute-force key uses lowercase name | Measured: 5 failures as `LUIS` lock `luis` (case D) → case variants cannot get round the limit. Correct. Gaps: no trim or Unicode normalisation; a missing `nombre` becomes the key `cuenta:undefined` and the route throws 500 (case E: 6× 500, the node:sqlite bind of undefined); the `fallos` Map grows without bound with random names | OK for the article (the code is not shown) | If the code is ever shown: reject a missing name before the limit, and prune expired entries |
| 75 | es:408 | Credential stuffing definition (Cite 23 CAPEC-600); tools spread requests over many IPs (Cite 24) | Credential Stuffing CS: "toolkits, such as Sentry MBA, offer built-in use of proxy networks to distribute requests across a large volume of unique IP addresses" | OK | — |
| 76 | es:408 | "Cada par se prueba una sola vez, así que el límite por cuenta ... no llega a activarse" | Logical; not in the source | OK | — |
| 77 | es:410 | OWASP proposes MFA and checking new passwords against breaches, e.g. Pwned Passwords (Cite 24) | Credential Stuffing CS: MFA and "Pwned Passwords ... a well known free service"; A07 also names haveibeenpwned | OK | — |
| 78 | es:410 | k-anonymity: send the first 5 SHA-1 characters and compare locally (Cite 25) | HIBP API v3: "the first 5 characters of either a SHA-1 or an NTLM hash" | OK | — |
| 79 | es:413-419 | sha1('password') prefix 5baa6; count 52372427; "más de 52 millones" on 27 Sep 2026 | Not in any measurement file (only in blocks.txt, the draft). Re-run live today: `1E4C9B93F3F0682250B6CF8331B7EE68FD8:52372427`; SHA-1 of "password" = 5baa61e4c9b93f3f0682250b6cf8331b7ee68fd8 | OK (now verified; save the output to mediciones) | — |
| 80 | es:425 | "La vía más común es un XSS que lee document.cookie" | No source; OWASP lists XSS, sniffing, fixation, malware and logs | UNVERIFIED | "Una vía habitual es..." |
| 81 | es:428-429 | Vulnerable Set-Cookie has only Path=/ | mediciones "login ana (vulnerable)" (the article drops `-c /tmp/lab-cookies`; harmless) | OK | — |
| 82 | es:432 | MITRE lists no-HttpOnly (CWE-1004) and no expiry (CWE-613) as two weaknesses | fuentes §2 | OK | CWE-1004 sits in A02 and CWE-613 in A07; the "Cuentas (A07)" family is still fine |
| 83 | es:435, 443 | Fixed cookie line; header Max-Age=7200; Path=/; Expires; HttpOnly; Secure; SameSite=Lax | lab.mjs:74; mediciones "cookie corregida" | OK | — |
| 84 | es:438-440 | HttpOnly blocks JS; Secure means HTTPS only; Lax blocks cross-site POST | Correct (Lax also withholds cross-site subresource GETs; the simplification is acceptable) | OK | — |
| 85 | es:441 | "Max-Age limita el tiempo en que una cookie robada sirve" | Max-Age only tells the victim's browser when to drop the cookie. Whoever copied the value can keep sending it. Only server-side expiry limits a stolen session (that is CWE-613, cited in the same paragraph). The lab's `sesiones` Map never expires, so a stolen sid works for as long as the process runs | WRONG | "`Max-Age` hace que el navegador olvide la cookie; para que una cookie robada deje de servir, la sesión tiene que caducar también en el servidor (punto 5 de Cómo proteger)" |
| 86 | es:443 | Cómo proteger point 5 explains renewing the id and expiring the session on the server | como-proteger…/es.mdx:180-184 items 1 and 3 | OK | — |
| 87 | es:447 | JWT = three base64url parts, not encrypted (Cite 28 RFC 7519) | fuentes §5 | OK | — |
| 88 | es:450-451 | `... \| base64 -d` output | jwt-texto.txt ran the exact command (exit 0, different iat); the shown output is from mediciones (a variant with `2>/dev/null; echo`) | OK | `base64 -d` fails on payloads that contain `-` or `_` (base64url). Optional: `basenc --base64url -d` or a note |
| 89 | es:458-461 | NONE and DEBIL token generation | jwt-texto.sh identical; medir.sh the same on one line | OK | Needs jsonwebtoken installed in the cwd (implicit) |
| 90 | es:467-468 | NONE vs /v/perfil → admin | mediciones, jwt-texto | OK | — |
| 91 | es:471 | verify rejects with "jwt signature is required"; since 9.0.0 unsigned tokens need `none` in `algorithms` (Cite 29); RFC 8725 requires libraries to let the caller fix the algorithms (Cite 30) | mediciones v2; wiki/CHANGELOG (fuentes §6); RFC 8725 §3.1 | OK | — |
| 92 | es:476-477 | DEBIL vs /v2/perfil → admin | mediciones, jwt-texto | OK | — |
| 93 | es:480 | RFC 8725: human-memorable passwords must not be HMAC keys; jsonwebtoken does not check the length and gave no warning | RFC 8725 §3.5 / §2.2; fuentes §6; jwt-texto shows no stderr | OK | — |
| 94 | es:482 | exp definition (Cite 28 RFC 7519 §4.1.4) | fuentes §4 (correctly attributed to 7519, not 8725) | OK | — |
| 95 | es:485-490 | verify options algorithms/issuer/audience/maxAge | lab.mjs:236-241 (process.env.JWT_SECRET vs SECRETO: fine) | OK | — |
| 96 | es:493 | DEBIL vs /f → invalid signature; /f/token token → {"hola":"ana","rol":"usuario"} | mediciones | OK | — |
| 97 | es:493 | "Busque jwt.decode: fuera de la depuración, cada aparición es un fallo" | decode is legitimate for reading `kid`/header before verify, or on the client to show expiry | MISLEADING (overstated) | "cada aparición que decide un acceso es un fallo" |
| 98 | es:497 | Prompt behaviour (read-only survey, report, wait, test-first fixes, phase 3 stops) | prompt.es.md phases 1-5 | OK | Phase 2 starts the application, which can run migrations or seeds; "sin cambiar nada" holds only for the code |
| 99 | es:507 | Priority order | Matches the prompt's phase 3 | OK | — |
| 100 | es:511 | Cómo proteger has "diez capas"; Ocho cosas covers IDOR, SQLi, XSS in Next.js | como-proteger heading "Qué queda fuera de las diez capas"; revisar… points 2, 3, 8 | OK | — |
| 101 | en.mdx (whole) | Parity with es | Read in full: same claims, same outputs, same cites, same line numbering. Differences: none of substance. #20, #68, #85, #4 and the others apply equally to EN | OK | Apply every fix to both files |
| 102 | prompt.es/en:41, 84 | CSRF: confirm with Sec-Fetch-Site: cross-site; the fix is token + SameSite + rejecting cross-site | curl ignores SameSite, so a route protected only by SameSite=Lax/Strict will be reported "confirmed" | MISLEADING (false positives) | Add: "Si la cookie de sesión es SameSite=Lax o Strict, infórmalo como posible y explica que curl no aplica SameSite." Also add to the fix: "compara el token también cuando falte en la sesión o en la petición (nunca `undefined === undefined`)" |
| 103 | prompt:85 | SSRF fix: allowlist + resolved IP not private + no redirects | Same DNS-rebinding gap as #35 | MISLEADING (incomplete) | Add "y conecta a la IP comprobada, o comprueba todas las direcciones que devuelve el DNS" |
| 104 | prompt:93-95 | Brute-force per account and IP with 429/Retry-After; session: HttpOnly/Secure/SameSite/expiry/new id; JWT: fixed algorithms, iss, aud, exp, ≥32-byte random secret | Consistent with sources (RFC 8725 §3.1, §3.5; OWASP Auth CS) | OK | "caducidad" in the session fix should say "en el servidor" (see #85) |
| 105 | prompt:42-43 | SSRF and traversal payloads stay local; traversal limited to repository files | Respects the "local only" rule | OK | — |
| 106 | prompt:48 | Audit tools `npm audit`, `pnpm audit`, `pip-audit`, `bundle audit` | `bundle audit` needs the bundler-audit gem | OK | — |
| 107 | prompt:3 | "catorce ataques ... y los fallos de los tokens JWT" with 15 items | 14 + JWT | OK | — |

## Family labels (coordinator's question)

Opened raw/owasp_A02, A03, A07, A08, A10:

- **Paquete malicioso → A03.** A03 text: "malicious changes in third-party code", and Scenario #3 is Shai-Hulud "used a post-install script". That is exactly point 7. Defensible, and stronger than A08 (which has only CWE-506 and an "untrusted source" scenario).
- **Versión vulnerable → A03.** CWE-1395 and CWE-1104 are in A03. Solid.
- **Error detallado → A02.** A02 text: "Error handling reveals stack traces or other overly informative error messages to users", plus Scenario #3. Defensible. A10 has CWE-209 as a "notable CWE" and a Scenario #2 that matches point 10 almost word for word (a DB error used for SQL-injection reconnaissance). Both pages fit.
- **Cuenta de fábrica → A02.** A02 text: "Default accounts and their passwords are still enabled and unchanged". Defensible, **but** A07 is the stronger home. Its text says "Permits default, weak, or well-known passwords, such as ... 'admin' username with an 'admin' password" (the article's exact example), "Do not ship or deploy with any default credentials, particularly for admin users", and CWE-1392/1393 are mapped to A07.

Verdict: the labels are defensible from the prose, and "cinco de las diez categorías" is then correct. Two cheap ways to make them unattackable:

1. Move **Cuenta de fábrica** to the Cuentas (A07) family. Then "Instalar y configurar (A02 y A03)" still holds through "Error detallado".
2. Or keep the grouping and add one clause under the table: "OWASP describe algunos casos en más de una categoría: las cuentas de fábrica también en A07 y los errores detallados en A10."

Either way the count stays at five (A01, A02, A03, A05, A07).

## Most important fixes, ranked

1. **CSRF fix code has a bypass (#23, #25).** `req.get('X-CSRF-Token') !== u.csrf` accepts `undefined === undefined`. Measured in the lab with the session the article tells the reader to create: POST /f/email with no Sec-Fetch-Site and no token → 200 `{"cambiado":true}`. Require both values to be present and compare them with `timingSafeEqual`. Add a "no header, no token → 403" check to "Cómo comprobarlo". Also the Origin fallback the text calls mandatory is not in the code (#22).
2. **Max-Age does not limit a stolen cookie (#85).** It is WRONG as written. Only server-side expiry does, and the lab never expires sessions. Rewrite the bullet and point to server-side expiry.
3. **"a partir del quinto" → "tras el quinto fallo" (#68)**, in both languages. It contradicts the output and es:404.
4. **SSRF: add the DNS-rebinding/re-resolution sentence and `lookup(...,{all:true})` (#35)**. Note that privada() is incomplete and not shown (#36). Note that the "Cómo comprobarlo" request exercises only the allowlist, not the IP check (#37). Same gap in the prompt (#103).
5. **Malicious package: registry signatures do not catch a malicious version published through the registry (#45).** Mention the waiting period, and cite A03 for postinstall (#44).
6. **Sec-Fetch-Site does not carry the origin (#20)**, es and en.
7. **Unmarked elision at the top of the npm audit output (#48)**, and the dropped attestation line (#45).
8. **Smaller wording fixes:** "todos se evitan en el código del servidor" (#4); "no ha hecho nada mal", which the example contradicts (#46); Ocho cosas 7 "explica cómo buscar el identificador" (#57); "La vía más común" unsourced (#80); "Retry-After: 900" exact only within 1 s (#73); "cada aparición de jwt.decode es un fallo" (#97); MFA "la mayoría" (#71).
9. **Prompt:** CSRF confirmation via curl gives false positives when the cookie is SameSite (#102); add "en el servidor" to session expiry (#104).
10. **Evidence hygiene:** save the Pwned Passwords output (#79, now reverified live: 52372427) into mediciones. Consider moving "Cuenta de fábrica" to A07 (see "Family labels").

Extra lab observations (not in the article text, only relevant if the code is published): Express 5's default handler returns error text on unhandled rejections in /v and /f/vista-previa (#38). /f/login without `nombre` answers 500 (#74).
