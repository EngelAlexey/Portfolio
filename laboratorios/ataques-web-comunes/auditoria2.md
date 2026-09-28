# Second audit: ataques-web-comunes (changed parts and citations)

Date: 2026-09-27. Line numbers are es.mdx; en.mdx has the same numbering. Evidence: the updated lab.mjs, mediciones.txt (re-run), mediciones2.txt, lab-prompt/fase1-3.txt, fase4-5.txt and tiempos.txt. I also ran two new probes in WSL with Node 24.19.0: `aud2.mjs` (BlockList ranges and the options Node passes to `lookup`) and `aud3.mjs` (a timeout after the response headers have arrived).

## Rows that are not OK

| # | Location | Claim | Check done | Verdict | Correction |
|---|---|---|---|---|---|
| 1 | es:334 / en:334 | Stack output `at file:///.../lab.mjs:110:17` | The re-run mediciones.txt, taken with the updated lab, now says `lab.mjs:111:17`. The query sits on lab.mjs line 111 | WRONG (the output no longer matches the lab) | Change it to `111:17` in both files |
| 2 | es:480, es:502 (and en) | Set-Cookie `sid=2e0e5749…` and JWT `iat 1790558539 / exp 1790559439` | The re-run of mediciones.txt replaced these values (`sid=afac5234…`, `iat 1790559836`). The article's values no longer appear in any evidence file. They are real outputs from the first run, whose lab had the same routes | UNVERIFIED (provenance only) | Copy the values from the current mediciones.txt, or keep the first run's output in a saved file |
| 3 | es:550 / en:550 | Demonstration run: 3 min to phase 3, 13 confirmed and 1 possible, 10 min more, 17 tests, 12 fixes, 16 passing, 2FA and `.npmrc` pending | tiempos.txt says 203 s and 596 s. fase1-3 has 13 "Confirmado", 1 "Posible" and 1 "Sin hallazgos". fase4-5 says red 17, green 16/17, 12 "Corregido", and the `.npmrc` write was blocked. Every number matches | MISLEADING by omission | Three things the paragraph leaves out. (a) In phase 2 the agent confirmed path traversal by reading `../..×15/Windows/win.ini`, a system file outside the repository. The prompt it ran already forbade this ("No leas archivos del sistema ni de fuera del repositorio"), so the agent broke a rule, and the text presents the run as clean. (b) The run happened at 19:37–19:47 and the prompt files were changed at 19:46, so the run used an earlier version (older CSRF, SSRF and session items), not the prompt the button copies. (c) It ran on Windows (the agent mentions the `\C:\` DIR problem), while the intro says the measurements were made on Ubuntu. Suggested fix: add "En la fase 2 leyó un archivo del sistema para confirmar el recorrido de rutas, aunque el prompt lo prohíbe; revise qué órdenes ejecuta." Also say the run used an earlier version of the prompt, or re-run it with the current one |
| 4 | es:492 / en:492 | "Max-Age … así que la caducidad se aplica también en el servidor" | The lab's `sesiones` Map never expires anything (lab.mjs:29-37, 74), so the corrected route does not do what the sentence describes | MISLEADING | Make it an instruction: "…así que aplique la caducidad también en el servidor (punto 5 de Cómo proteger)" |
| 5 | es:206-216 / lab.mjs:213 | SSRF fix with `https.get(..., { timeout: 5000 })` | The old code used `AbortSignal.timeout(5000)`, which caps the whole request. The `timeout` option here is only a socket *idle* timeout, so a server that sends one byte every 4 s keeps the request open forever. `cuerpo` also accumulates the whole body even though only 300 characters are sent. aud3.mjs shows that a stall after the headers does reach the `error` handler, and the process does not crash | MISLEADING (a regression against the previous version) | Add a total limit (`setTimeout(() => peticion.destroy(...), 5000)`), and stop reading once 300 characters or a byte cap is reached (`r.destroy()`) |
| 6 | es:174 comment, es:166 text | "Las reglas IPv4 cubren también las direcciones IPv4 escritas en IPv6 (::ffff:127.0.0.1)"; BlockList holds the private, loopback, link-local and multicast ranges | aud2.mjs: `::ffff:127.0.0.1`, `::ffff:7f00:1` and `::ffff:10.1.2.3` → true, `fe80::1`, `febf::1` and `::` → true. **Not blocked:** `::127.0.0.1` (IPv4-compatible, deprecated), `::ffff:0:127.0.0.1` (IPv4-translated), `fec0::/10` (old site-local), `2001:db8::/32`. The test in mediciones2 "IPv4 escrita en IPv6" (`http://[::ffff:127.0.0.1]`) is rejected by the https/allowlist check, so it never reaches BlockList | OK for the claim as written; the measurement is MISLEADING | The comment is true (I verified it directly). The only gaps are corner cases, which Linux does not route in practice. Do not present the mediciones2 row as a test of BlockList. If the IPv6 case is mentioned, test it with `PERMITIDOS=localhost` and a name that resolves to `::ffff:127.0.0.1`. Optional: add `::ffff:0:0/96` and `fec0::/10` |
| 7 | es:166 | "OWASP llama a este ataque *DNS pinning*" (Cite 8) | SSRF cheat sheet l.117, 166, 304 does use "DNS pinning". The common name for the attack described (a second resolution returning another address) is DNS rebinding. "DNS pinning" is strictly the defence | OK against the source, but MISLEADING to readers | "OWASP lo describe como *DNS pinning*; también se conoce como *DNS rebinding*" |
| 8 | es:30 / en:30 | "OWASP describe también la cuenta de fábrica en A07 y el error detallado en A10" | True: A07 prose says "admin"/"admin" and lists CWE-1392/1393; A10 lists CWE-209 and has Scenario #2. But the sentence has no citation, and Cite 1 (the Introduction) does not support it | UNVERIFIED in the text (true in the source) | Cite the A07 page (and A10), or reuse an existing reference for A07. Today there is no A07 or A10 reference in the list |

## Checked and OK (not listed row by row)

- **Intro (es:24, 26):** "cinco de las diez categorías" matches the table (A01, A02, A03, A05, A07). "cada uno se evita con un cambio concreto en el código o en la configuración" fixes the earlier overstatement. The new description of what each section shows is accurate.
- **CSRF (es:109-133):**
  - The code matches lab.mjs:236-251.
  - The `Origin` fallback matches the cheat sheet.
  - The missing-token check closes the bypass from the first audit.
  - `timingSafeEqual` is guarded by the length check, so it cannot throw.
  - Every "Cómo comprobarlo" output is in mediciones2: cross-site → "origen no permitido"; no header and no token → 403 "token CSRF"; foreign `Origin` → 403; the same page with the right token → 200; a wrong token → 403.
  - The `Sec-Fetch-Site` description is now correct.
- **SSRF (es:164-226):**
  - The code matches lab.mjs:180-228; the lab reads `PERMITIDOS` from the environment, and the article says so.
  - `busquedaSegura` handles `opciones.all`. aud2.mjs shows Node 24 calls `lookup` with `{"hints":32,"all":true}` (autoSelectFamily), and returns "destino no permitido" before connecting.
  - `https.get` does not follow redirects.
  - Every "Cómo comprobarlo" output is in mediciones2: decimal IP → 400; `localhost` → 400; example.com → the page; iana.org → 502 "redirección no seguida".
  - Cite 9 (net.BlockList) and Cite 10 (http.request, `lookup` option) support their sentences.
- **Section 7:**
  - A03 Scenario #3 describes Shai-Hulud: a self-propagating npm worm that used a post-install script (Cite 14 supports it).
  - The signatures paragraph is correct.
  - npm-vs-pnpm section 5 is "Cómo esperar antes de instalar una versión recién publicada", so the link holds.
  - The `npm audit signatures` output now matches audit.txt, apart from the trailing "(use --json…)" line.
- **Section 8:** the output now opens with "...", and the new wording ("El fallo puede publicarse después…") is fine.
- **Sections 10, 14, 15, 16, 17:**
  - The Ocho cosas point 7 wording is now accurate.
  - "Tras el quinto fallo" matches the output.
  - `Retry-After` is described generically; mediciones2 shows 900.
  - The MFA sentence now says "la mayoría".
  - "Una de las vías" replaces the unsourced "la más común".
  - The `jwt.decode` sentence is fine.
  - The Pwned Passwords output is now saved in mediciones2 (52372427).
- **Prompts (es and en):**
  - The CSRF item adds the SameSite "posible" rule and the constant-time and missing-token comparison.
  - The SSRF item says "A and AAAA, in the same resolution the connection uses".
  - The session item says "caducidad de la sesión en el servidor".
  - The traversal confirmation uses a repository file.
  - All of these are technically correct, and es and en agree.
- **Citations after the renumber:** I checked all 38 `<Cite>` uses in es.mdx and en.mdx against the 33 references, which are identical in both files. Each one points at a reference that supports its sentence: 1 (intro and ranking), 2 (A01 figures), 3 (CWE-639), 4 (CWE-352), 5 (CSRF CS), 6 (CWE-918), 7 (AWS IMDS), 8 (SSRF CS ×2), 9 (BlockList), 10 (http.request), 11 (CWE-22), 12 (Express sendFile), 13 (CWE-506), 14 (A03), 15 (CWE-1395), 16 (npm audit ×2), 17 (CWE-1392), 18 (CWE-209), 19 (CWE-89), 20 (CWE-79), 21 (CWE-78), 22 (child_process), 23 (CWE-307), 24 (Auth CS), 25 (NIST), 26 (CAPEC-600), 27 (Credential Stuffing CS ×2), 28 (HIBP), 29 (CWE-1004), 30 (CWE-613), 31 (RFC 7519 ×2), 32 (jsonwebtoken migration notes), 33 (RFC 8725 ×2). There are no gaps and no unused references. `repeat` is used only on second uses.
- **EN parity:** every changed passage says the same as the Spanish.

## Verdict

Close to publishable. The fixes from the first audit are correct and measured, and the citations are all sound. Before publishing, fix the stack line number (110 → 111), and state in the section 18 paragraph that the agent read a system file and ran an earlier version of the prompt. The rest are one-line fixes.
