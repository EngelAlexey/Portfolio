# Fuentes verificadas: «¿Cuáles son los ataques web más comunes y cómo evitarlos?»

Verificado el 2026-09-27. Cada fuente primaria se descargó y se leyó (curl + extracción de texto, o WebFetch). Copias en bruto en `scratchpad/ataques/raw/`.

Nota: `owasp.org/Top10/2025/` redirige con un 308 a `top10.owasp.org/2025/`. Cite la URL canónica `https://top10.owasp.org/2025/`.

## 1. OWASP Top 10:2025

| Afirmación | Fuente abierta | Cita | Veredicto |
|---|---|---|---|
| Orden y nombres exactos | https://top10.owasp.org/2025/ | "A01:2025 - Broken Access Control / A02:2025 - Security Misconfiguration / A03:2025 - Software Supply Chain Failures / A04:2025 - Cryptographic Failures / A05:2025 - Injection / A06:2025 - Insecure Design / A07:2025 - Authentication Failures / A08:2025 - Software or Data Integrity Failures / A09:2025 - Security Logging and Alerting Failures / A10:2025 - Mishandling of Exceptional Conditions" | CONFIRMADO |
| A01 incluye SSRF en 2025 | https://top10.owasp.org/2025/0x00_2025-Introduction/ y la página de A01 | "Server-Side Request Forgery (SSRF) has been rolled into this category." En A01: "CWE-918 Server-Side Request Forgery (SSRF)" aparece en la lista de CWE asignados | CONFIRMADO |
| A07 se llama exactamente «Authentication Failures» | https://top10.owasp.org/2025/A07_2025-Authentication_Failures/ | "Authentication Failures maintains its position at #7 with a slight name change to more accurately reflect the 36 CWEs in this category." (en 2021 era "Identification and Authentication Failures") | CONFIRMADO |
| A09 | página índice | "A09:2025 - Security Logging and Alerting Failures" (ya no dice "Monitoring") | CONFIRMADO. Diga "Alerting", no "Monitoring" |
| A08: nombre exacto | página índice y página de A08 | "A08:2025 - Software or Data Integrity Failures". La página de A03 lo enlaza como "Software and Data Integrity Failures": OWASP no es coherente | Use **"Software or Data Integrity Failures"**, que es el título del índice y de la página |
| A10 | página índice | "A10:2025 - Mishandling of Exceptional Conditions" | CONFIRMADO |
| Conjunto de datos «más de 2,8 millones de aplicaciones» | https://top10.owasp.org/2025/0x00_2025-Introduction/ | "kindly donated data for over 2.8 millions applications to make this the largest and most comprehensive application security data set" (el "millions" es errata de OWASP) | CONFIRMADO: más de 2,8 millones |
| A01 «más de 1,8 millones de ocurrencias» | https://top10.owasp.org/2025/A01_2025-Broken_Access_Control/ | Tabla de puntuación: CWEs Mapped **40**, Avg Incidence Rate **3.74%**, Total Occurrences **1,839,701**, Total CVEs **32,654**. "100% of the applications tested were found to have some form of broken access control" | CONFIRMADO: 1 839 701 ocurrencias. La introducción dice 3,73 % y la tabla 3,74 %; use la tabla o redondee a «~3,7 %» |
| Otras cifras útiles | páginas de cada categoría | A02: 16 CWE, 719 084 ocurrencias ("over 719k occurrences"). A05: 37 CWE, 1 404 249 ocurrencias, 62 445 CVE; "Cross-site Scripting ... with more than 30k CVEs and SQL Injection ... with more than 14k CVEs". A07: 36 CWE, 1 120 673 ocurrencias. A03: 6 CWE, 215 248 ocurrencias, 11 CVE. Introducción: "589 CWEs in this edition" | CONFIRMADO |
| Incidencia media de A03 | página de A03 | El texto dice "the highest average incidence rate at 5.19%", pero la tabla dice Avg Incidence Rate **5.72%** | CONTRADICTORIO EN LA FUENTE: no cite la cifra, o cite la tabla y avise |

## 2. Identificadores y nombres oficiales de CWE (cwe.mitre.org, título de cada página)

| CWE | Nombre oficial (MITRE) | ¿Coincide con lo supuesto? |
|---|---|---|
| CWE-639 | Authorization Bypass Through User-Controlled Key | CONFIRMADO. Términos alternativos de MITRE: "Insecure Direct Object Reference / IDOR" (MITRE avisa: "IDOR ... is broader than this CWE because it also covers path traversal (CWE-22)") y "BOLA" |
| CWE-352 | Cross-Site Request Forgery (CSRF) | CONFIRMADO |
| CWE-918 | Server-Side Request Forgery (SSRF) | CONFIRMADO |
| CWE-22 | Improper Limitation of a Pathname to a Restricted Directory ('Path Traversal') | CONFIRMADO |
| CWE-78 | Improper Neutralization of Special Elements used in an OS Command ('OS Command Injection') | CONFIRMADO |
| CWE-89 | Improper Neutralization of Special Elements used in an SQL Command ('SQL Injection') | CONFIRMADO |
| CWE-79 | Improper Neutralization of Input During Web Page Generation ('Cross-site Scripting') | CONFIRMADO |
| CWE-506 | Embedded Malicious Code | CONFIRMADO |
| CWE-1395 | Dependency on Vulnerable Third-Party Component | CONFIRMADO |
| CWE-1392 | Use of Default Credentials | CONFIRMADO |
| CWE-1393 | Use of Default Password | CONFIRMADO |
| CWE-209 | Generation of Error Message Containing Sensitive Information | CONFIRMADO |
| CWE-307 | Improper Restriction of Excessive Authentication Attempts | CONFIRMADO |
| CWE-287 | Improper Authentication | CONFIRMADO |
| CWE-384 | Session Fixation | CONFIRMADO |
| CWE-613 | Insufficient Session Expiration | CONFIRMADO |
| CWE-347 | Improper Verification of Cryptographic Signature | CONFIRMADO |
| CWE-321 | Use of Hard-coded Cryptographic Key | CONFIRMADO |

Comprobados también: CWE-1104 Use of Unmaintained Third Party Components; CWE-1391 Use of Weak Credentials; CWE-308 Use of Single-factor Authentication; CWE-522 Insufficiently Protected Credentials; CWE-798 Use of Hard-coded Credentials; CWE-294 Authentication Bypass by Capture-replay; CWE-614 Sensitive Cookie in HTTPS Session Without 'Secure' Attribute; CWE-1004 Sensitive Cookie Without 'HttpOnly' Flag.

**Qué CWE usar para «suplantación» (relleno de credenciales o toma de cuentas).** No hay una CWE que se llame así, porque el relleno de credenciales es un ataque y no una debilidad. MITRE cataloga el ataque como **CAPEC-600: Credential Stuffing**, y sus "Related Weaknesses" son 522, **307**, 308, 309, 262, 263 y 654. Recomendación: nombre el ataque como CAPEC-600 y la debilidad principal como **CWE-307** (Improper Restriction of Excessive Authentication Attempts, asignada a A07). Si el texto trata la falta de segundo factor, añada CWE-308 (también en A07).

**Qué CWE usar para «robo de sesión».** Tampoco hay una CWE con ese nombre. El ataque es **CAPEC-593: Session Hijacking**, cuya única "Related Weakness" es CWE-287. CWE-384 (Session Fixation) es otra técnica: el atacante fija el identificador antes del inicio de sesión, no lo roba después. Por eso no conviene presentarla como «robo de sesión». Las debilidades concretas que permiten el robo son **CWE-1004** (cookie sin HttpOnly, legible por XSS; A02), **CWE-614** (cookie sin Secure; A02) y **CWE-613** (la sesión no caduca; A07). Recomendación: CAPEC-593 para el ataque, y CWE-1004 + CWE-613 como debilidades, más CWE-384 si se menciona la fijación.

## 3. Qué CWE asigna OWASP 2025 a cada categoría (listas «List of Mapped CWEs» de cada página)

| CWE | Categoría en OWASP 2025 | Veredicto frente a lo que suponía el encargo |
|---|---|---|
| CWE-639, CWE-352, CWE-918, CWE-22 | **A01** Broken Access Control | CONFIRMADO. A01 cita CWE-352 y CWE-918 entre las "Notable CWEs" |
| CWE-1392, CWE-1393 | **A07** Authentication Failures | **INCORRECTO si se ponen en A02.** Están en A07 y no aparecen en A02 |
| CWE-209 | **A10** Mishandling of Exceptional Conditions | **INCORRECTO si se pone en A02.** Solo está en A10 |
| CWE-614, CWE-1004 | A02 Security Misconfiguration | CONFIRMADO (sirven para la parte de cookies de sesión) |
| CWE-1395, CWE-1104 | **A03** Software Supply Chain Failures | CONFIRMADO. Lista completa de A03: 447, 1035, 1104, 1329, 1357, 1395 |
| CWE-506 | **A08** Software or Data Integrity Failures | **INCORRECTO si se pone en A03.** Está en A08 |
| CWE-78, CWE-79, CWE-89 | **A05** Injection | CONFIRMADO |
| CWE-287, CWE-307, CWE-384, CWE-613 | **A07** Authentication Failures | CONFIRMADO |
| CWE-347, CWE-321 | **A04** Cryptographic Failures | **INCORRECTO si se ponen en A07.** Los fallos de firma de JWT y las claves embebidas en el código caen en A04 |

Errata de la fuente: la página de A03 escribe "CWE-477: Use of Obsolete Function" en el texto, pero en la lista pone "CWE-447 Use of Obsolete Function". Según MITRE, CWE-447 es "Unimplemented or Unsupported Feature in UI" y CWE-477 es "Use of Obsolete Function". No cite ninguno de los dos.

## 4. RFC 8725 (JWT BCP, BCP 225), https://www.rfc-editor.org/rfc/rfc8725

| Afirmación | Cita | Veredicto |
|---|---|---|
| Ataque con «none» (§2.1) | "The algorithm can be changed to "none" by an attacker, and some libraries would trust this value and "validate" the JWT without checking any signature." También describe la confusión RS256→HS256 (CVE-2015-9235) | CONFIRMADO |
| Verificar el algoritmo (§3.1 Perform Algorithm Verification) | "Libraries MUST enable the caller to specify a supported set of algorithms and MUST NOT use any other algorithms when performing cryptographic operations." "...each key MUST be used with exactly one algorithm" | CONFIRMADO |
| «none» (§3.2 Use Appropriate Algorithms) | "JWT libraries SHOULD NOT consume JWTs using "none" unless explicitly requested by the caller." Matiz: el RFC admite «none» cuando el JWT ya va protegido de otro modo ("can be perfectly acceptable"), así que no escriba que el RFC lo prohíbe | CONFIRMADO con matiz |
| Claves HMAC débiles (§2.2 y §3.5) | §2.2: "a weak symmetric key with insufficient entropy (such as a human-memorable password). Such keys are vulnerable to offline brute-force or dictionary attacks". §3.5 Ensure Cryptographic Keys Have Sufficient Entropy: "human-memorizable passwords MUST NOT be directly used as the key to a keyed-MAC algorithm such as "HS256"." | CONFIRMADO. El RFC no fija una longitud mínima: remite a RFC 7515 §10.1 y RFC 7518 §8.8 |
| Validar iss (§3.8) y aud (§3.9) | §3.8: "the application MUST validate that the cryptographic keys used ... belong to the issuer. If they do not, the application MUST reject the JWT." §3.9: "if the audience value is not present or not associated with the recipient, it MUST reject the JWT." (la condición es que un mismo emisor sirva a varias partes) | CONFIRMADO |
| Validar exp | RFC 8725 **no trata** exp. La regla está en RFC 7519 §4.1.4: "the expiration time on or after which the JWT MUST NOT be accepted for processing" | INCORRECTO si se atribuye a RFC 8725: cítelo como RFC 7519 §4.1.4 |
| Extra (§3.10) | "blindly following a "jku" ... or "x5u" ... header ... could result in server-side request forgery (SSRF) attacks." | Útil para enlazar JWT con SSRF |

## 5. RFC 7519, https://www.rfc-editor.org/rfc/rfc7519

| Afirmación | Cita | Veredicto |
|---|---|---|
| Cada parte va en base64url | §3: "A JWT is represented as a sequence of URL-safe parts separated by period ('.') characters. Each part contains a base64url-encoded value." | CONFIRMADO |
| Un JWT firmado (JWS) no está cifrado | §3: si la cabecera es JWS, "the JWT is represented as a JWS and the claims are digitally signed or MACed, with the JWT Claims Set being the JWS Payload". Solo con JWE "the claims are encrypted". §12: "ensure that JWTs containing unencrypted privacy-sensitive information are only transmitted using protocols utilizing encryption ... such as ... (TLS). Omitting privacy-sensitive information from a JWT is the simplest way of minimizing privacy issues." | CONFIRMADO. El RFC no usa la frase literal «no está cifrado»; la afirmación se deduce del §3 y del §12 |

## 6. npm `jsonwebtoken` (auth0/node-jsonwebtoken)

Fuentes: README, CHANGELOG, `verify.js` y `sign.js` en la rama master de https://github.com/auth0/node-jsonwebtoken, y la wiki "Migration Notes: v8 to v9". Versión actual: **9.0.3** (registro de npm, `latest`; CHANGELOG "9.0.3 - 2025-12-04").

| Afirmación | Cita | Veredicto |
|---|---|---|
| v9 rechaza «none» por defecto | CHANGELOG 9.0.0: "The verify() function no longer accepts unsigned tokens by default." verify.js: `if (!hasSignature && !options.algorithms) → 'please specify "none" in "algorithms" to verify unsigned tokens'`, y si hay secreto y no hay firma, `'jwt signature is required'`. Wiki: "Verifying unsigned tokens now requires explicitly providing `none` in `options.algorithms`." | CONFIRMADO |
| `algorithms` por defecto con un secreto de texto | README: "If not specified a defaults will be used based on the type of key provided * secret - ['HS256', 'HS384', 'HS512'] * rsa - ['RS256', 'RS384', 'RS512'] * ec - [...] * default - ['RS256', 'RS384', 'RS512']" (el código también añade PS256–PS512 a la lista de RSA) | CONFIRMADO: HS256, HS384 y HS512 |
| v9 rechaza secretos HMAC cortos | Ni README, ni CHANGELOG, ni sign.js ni verify.js comprueban la longitud de un secreto HMAC. El mínimo de v9 es para **RSA**: "RSA key size must be 2048 bits or greater" (se salta con `allowInsecureKeySizes`). Además, las claves asimétricas no sirven para HS* | **INCORRECTO**: v9 acepta secretos HMAC de cualquier longitud (una cadena vacía falla por otro motivo: "secretOrPrivateKey must have a value") |
| CVE corregidos en 9.0.0 | "CVE-2022-23529", "CVE-2022-23540 (Insecure default algorithm in jwt.verify())", "CVE-2022-23541 (... RSA to HMAC)", "CVE-2022-23539" | CONFIRMADO |

## 7. Node.js child_process, https://nodejs.org/api/child_process.html (fuente: doc/api/child_process.md en nodejs/node main)

| Afirmación | Cita | Veredicto |
|---|---|---|
| exec pasa por un shell | "Spawns a shell then executes the `command` within that shell ... The `command` string passed to the exec function is processed directly by the shell" y "**Never pass unsanitized user input to this function. Any input containing shell metacharacters may be used to trigger arbitrary command execution.**" | CONFIRMADO |
| execFile no abre un shell por defecto | "The `child_process.execFile()` function is similar to `child_process.exec()` except that it does not spawn a shell by default. Rather, the specified executable `file` is spawned directly as a new process" y "If the `shell` option is enabled, do not pass unsanitized user input to this function." | CONFIRMADO. La misma página advierte que en Windows los .bat y .cmd necesitan shell |

## 8. Express 5 `res.sendFile`, https://expressjs.com/en/5x/api/ (fuente: src/content/api/5x/api/response/index.mdx en expressjs/expressjs.com). Versión actual de express: 5.2.1.

| Afirmación | Cita | Veredicto |
|---|---|---|
| Hace falta una ruta absoluta o la opción `root` | "Unless the `root` option is set in the options object, `path` must be an absolute path to the file." | CONFIRMADO |
| Con `root` rechaza que `..` salga del directorio | "When the `root` option is provided, the `path` argument is allowed to be a relative path, including containing `..`. Express will validate that the relative path provided as `path` will resolve within the given `root` option." Código de `send` (pillarjs/send index.js): con root normaliza la ruta y, si todavía sube (`UP_PATH_REGEXP`), responde `this.error(403)` con el comentario "malicious path" | CONFIRMADO. Matiz: `..` se permite mientras la ruta resuelva dentro de `root` (a/../b vale); lo que escapa de `root` recibe un 403 |
| `dotfiles` | Opción `dotfiles`, por defecto `"ignore"`, valores "allow", "deny", "ignore" | CONFIRMADO. Es otra protección: no tiene que ver con el recorrido de rutas |

## 9. SSRF

| Afirmación | Fuente abierta | Cita | Veredicto |
|---|---|---|---|
| IMDS en 169.254.169.254 | https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/configuring-instance-metadata-service.html | "the IPv4 address of the Instance Metadata Service (IMDS): `169.254.169.254`" (IPv6: `[fd00:ec2::254]`) | CONFIRMADO |
| IMDSv2 exige un token de sesión que se pide con PUT | misma página | "IMDSv2 uses session-oriented requests." "Use a `PUT` request to initiate a session to the instance metadata service. The `PUT` request returns a token that must be included in subsequent `GET` requests ... The token is required to access metadata using IMDSv2." "`PUT` requests are rejected if they contain an X-Forwarded-For header." "the response to `PUT` requests has a response hop limit ... of `1`" | CONFIRMADO. Matiz: la misma página dice "By default, you can use either IMDSv1 or IMDSv2, or both": IMDSv2 solo protege si se configura como obligatorio |
| OWASP: lista de permitidos | https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html | "The allowlist approach is a viable option..."; "Deny-lists are bypass-prone. Prefer allow-lists." | CONFIRMADO |
| OWASP: bloquear rangos privados | misma | Para destinos externos arbitrarios: "the provided IP (V4 + V6) is not part of the official private networks ranges including also *localhost* and *IPv4/v6 Link-Local* addresses". Tabla "Deny-list (Last Resort)": 169.254.169.254, 127.0.0.0/8, 0.0.0.0/8, ::1/128, 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 224.0.0.0/4, ff00::/8 | CONFIRMADO. La hoja lo presenta como último recurso, no como la defensa principal |
| OWASP: desactivar redirecciones | misma | "Disable the support for the following of the redirection in your web client in order to prevent the bypass of the input validation" | CONFIRMADO |
| OWASP: IMDSv2 | misma | "To leverage this protection migrate to IMDSv2 and disable old IMDSv1." | CONFIRMADO |

## 10. Autenticación y almacenamiento de contraseñas

| Afirmación | Fuente abierta | Cita | Veredicto |
|---|---|---|---|
| NIST: no más de 100 intentos fallidos consecutivos | https://pages.nist.gov/800-63-4/sp800-63b.html §3.2.2 "Rate Limiting (Throttling)" (SP 800-63B-4, versión final) | "the verifier SHALL limit consecutive failed authentication attempts using a specific authenticator on a single subscriber account to no more than 100 by disabling that authenticator." "The limit of 100 attempts is an upper bound, and agencies MAY impose lower limits." | CONFIRMADO |
| NIST: longitud de contraseña (relacionado) | misma | "Verifiers and CSPs SHALL require passwords that are used as a single-factor authentication mechanism to be a minimum of 15 characters in length" (mínimo de 8 si forman parte de MFA) | CONFIRMADO |
| OWASP Authentication CS: limitar intentos | https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html | Sección "Login Throttling / Account Lockout": "The counter of failed logins should be associated with the account itself, rather than the source IP address". MFA "is by far the best defense against the majority of password-related attacks" | CONFIRMADO. OWASP no da un número fijo |
| Argon2id: parámetros recomendados | https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html | "Use Argon2id with a minimum configuration of 19 MiB of memory, an iteration count of 2, and 1 degree of parallelism." Equivalentes: m=47104 (46 MiB) t=1; m=19456 (19 MiB) t=2; m=12288 t=3; m=9216 t=4; m=7168 t=5; todos con p=1 | CONFIRMADO |
| bcrypt: factor de trabajo de 10 o más | misma | "For legacy systems using bcrypt, use a work factor of 10 or more and with a password limit of 72 bytes." bcrypt "should only be used for password storage in legacy systems where Argon2 and scrypt are not available." | CONFIRMADO. Matiz: OWASP deja bcrypt para sistemas heredados; no lo presente como recomendación general |

## 11. OWASP CSRF Prevention Cheat Sheet, https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html

| Afirmación | Cita | Veredicto |
|---|---|---|
| Recomienda token | "If the framework does not have built-in CSRF protection, add CSRF tokens to all state-changing requests ... and validate them on the backend." "Stateful software should use the synchronizer token pattern." | CONFIRMADO |
| SameSite como defensa en profundidad | SameSite está bajo "Defense In Depth Techniques". "`SameSite` is useful as a defense-in-depth control but it does not replace a proper CSRF defense in most deployments." "`Lax` only blocks unsafe methods" | CONFIRMADO |
| Fetch Metadata (Sec-Fetch-Site) | "If your software targets only modern browsers, you may rely on Fetch Metadata headers together with the fallback options described below". "Sec-Fetch-Site ... should be the primary signal". "reject non-safe methods (POST / PUT / PATCH / DELETE) when `Sec-Fetch-Site: cross-site`". Además, "a fallback to standard origin verification headers **is a mandatory requirement**" | CONFIRMADO. Presente Fetch Metadata como alternativa válida al token solo en navegadores modernos y siempre con la comprobación de Origin como respaldo |
| Precaución | La hoja dice "Chrome implemented `SameSite=Lax` as the default behavior in 2020, and Firefox and Edge have followed suit." No lo comprobé contra una fuente primaria de cada navegador y hay dudas sobre Firefox, así que no repita esa frase | NO VERIFICABLE: no la cite |

## 12. NordPass, https://nordpass.com/most-common-passwords-list/

| Afirmación | Cita | Veredicto |
|---|---|---|
| «123456» es la contraseña más común en 2025 | "It's official: "123456" has once again claimed the controversial title of the world's most common password — and one of the weakest. That marks six out of seven years this password has topped our chart, with "password" claiming the honor just once." Método: "joint effort between NordPass and NordStellar ... data breaches and dark web repositories were analyzed from September 2024 to September 2025", 44 países | CONFIRMADO. La tabla global con los recuentos se carga por JavaScript y no se pudo leer, así que no cite cifras de recuento |

## 13. Verizon DBIR (credenciales robadas como vector de acceso inicial)

**Importante:** ya existe el **DBIR 2026**, y su conclusión es distinta. Si el artículo dice que las credenciales robadas son el vector número uno, eso era cierto en el DBIR 2025 y ya no lo es.

| Afirmación | Fuente abierta | Cita | Veredicto |
|---|---|---|---|
| DBIR 2025: credenciales robadas, primer vector | https://www.verizon.com/business/resources/Te3/reports/2025-dbir-data-breach-investigations-report.pdf (p. 10 y p. 21) | p. 10: explotación de vulnerabilidades "reaching 20%. This value approaches that of credential abuse, which is still the most common vector." p. 21: "our current Use of stolen credentials amount of 22%, which is down from 31% ... Phishing is just chilling around 15%" (Fig. 5, n=9,891, brechas que no son Error ni Misuse) | CONFIRMADO para 2025: 22 % |
| DBIR 2025, Basic Web Application Attacks | mismo PDF, p. 52 | "In this pattern, about 88% of the breaches involve the Use of stolen credentials" | CONFIRMADO |
| DBIR 2026: lo más reciente | https://www.verizon.com/business/resources/Te3/reports/2026-dbir-data-breach-investigations-report.pdf (p. 10 y p. 16) | p. 10: "Exploitation of vulnerabilities is now the most common initial access vector for breaches. It has risen to 31% ... while credential abuse—the previous leader—is down to 13%." p. 16: "Credential abuse ... has fallen steeply from 22% in the 2025 DBIR to 13% ... this value without the addition of Pretexting would have been 16%." p. 54, Basic Web Application Attacks: "typically driven by stolen credentials and unpatched vulnerabilities"; "The Use of stolen creds continues its historic run in this pattern" | CONFIRMADO. Recomendación: cite el DBIR 2026 (explotación 31 %, abuso de credenciales 13 %, o 16 % con el método anterior). En las aplicaciones web básicas las credenciales robadas siguen dominando |

## Resumen de correcciones

1. CWE-506 va en **A08**, no en A03.
2. CWE-1392 y CWE-1393 van en **A07**, no en A02.
3. CWE-209 va en **A10**, no en A02.
4. CWE-347 y CWE-321 van en **A04**, no en A07.
5. `exp` se valida según **RFC 7519 §4.1.4**; RFC 8725 no lo trata.
6. RFC 8725 no prohíbe «none»: dice que las bibliotecas SHOULD NOT aceptarlo salvo que se pida de forma explícita.
7. jsonwebtoken v9 **no** exige una longitud mínima para los secretos HMAC; el mínimo de 2048 bits es para RSA.
8. DBIR: en 2026 la explotación de vulnerabilidades (31 %) superó al abuso de credenciales (13 %).
9. Para «robo de sesión», CWE-384 (fijación) no sirve; use CAPEC-593 con CWE-1004 y CWE-613.
10. El nombre de A08 aparece de dos formas en el sitio de OWASP; use el del índice: "Software or Data Integrity Failures".

## Referencias recomendadas

| Fuente | Título | URL |
|---|---|---|
| OWASP | OWASP Top 10:2025 | https://top10.owasp.org/2025/ |
| OWASP | Introduction (OWASP Top 10:2025) | https://top10.owasp.org/2025/0x00_2025-Introduction/ |
| OWASP | A01:2025 Broken Access Control | https://top10.owasp.org/2025/A01_2025-Broken_Access_Control/ |
| OWASP | A02:2025 Security Misconfiguration | https://top10.owasp.org/2025/A02_2025-Security_Misconfiguration/ |
| OWASP | A03:2025 Software Supply Chain Failures | https://top10.owasp.org/2025/A03_2025-Software_Supply_Chain_Failures/ |
| OWASP | A05:2025 Injection | https://top10.owasp.org/2025/A05_2025-Injection/ |
| OWASP | A07:2025 Authentication Failures | https://top10.owasp.org/2025/A07_2025-Authentication_Failures/ |
| MITRE | CWE-639 (y las demás en https://cwe.mitre.org/data/definitions/<id>.html) | https://cwe.mitre.org/data/definitions/639.html |
| MITRE | CAPEC-600: Credential Stuffing | https://capec.mitre.org/data/definitions/600.html |
| MITRE | CAPEC-593: Session Hijacking | https://capec.mitre.org/data/definitions/593.html |
| IETF | RFC 8725: JSON Web Token Best Current Practices | https://www.rfc-editor.org/rfc/rfc8725 |
| IETF | RFC 7519: JSON Web Token (JWT) | https://www.rfc-editor.org/rfc/rfc7519 |
| Auth0 | node-jsonwebtoken (README) | https://github.com/auth0/node-jsonwebtoken |
| Auth0 | Migration Notes: v8 to v9 | https://github.com/auth0/node-jsonwebtoken/wiki/Migration-Notes:-v8-to-v9 |
| Node.js | Child process | https://nodejs.org/api/child_process.html |
| Express | 5.x API Reference (res.sendFile) | https://expressjs.com/en/5x/api/ |
| AWS | Use the Instance Metadata Service to access instance metadata | https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/configuring-instance-metadata-service.html |
| OWASP | Server-Side Request Forgery Prevention Cheat Sheet | https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html |
| OWASP | Cross-Site Request Forgery Prevention Cheat Sheet | https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html |
| OWASP | Authentication Cheat Sheet | https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html |
| OWASP | Password Storage Cheat Sheet | https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html |
| NIST | SP 800-63B-4, Digital Identity Guidelines: Authentication and Authenticator Management (§3.2.2) | https://pages.nist.gov/800-63-4/sp800-63b.html |
| NordPass | Top 200 Most Common Passwords | https://nordpass.com/most-common-passwords-list/ |
| Verizon | 2026 Data Breach Investigations Report | https://www.verizon.com/business/resources/Te3/reports/2026-dbir-data-breach-investigations-report.pdf |
| Verizon | 2025 Data Breach Investigations Report (solo si se compara con el año anterior) | https://www.verizon.com/business/resources/Te3/reports/2025-dbir-data-breach-investigations-report.pdf |

Nota sobre la URL del DBIR: la ruta sin prefijo `/reports/2026-...pdf` devolvió HTML en una prueba con curl. El PDF se descargó desde `/business/resources/Te3/reports/2026-dbir-data-breach-investigations-report.pdf`. No comprobé la URL canónica en un navegador. Lo más seguro es citar la página HTML del informe, https://www.verizon.com/business/resources/reports/dbir/.
