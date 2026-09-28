# Third audit: ataques-web-comunes (final text, commit f99b426)

Date: 2026-09-27. Line numbers are es.mdx; en.mdx has the same numbering, and its code blocks are identical to the Spanish ones (checked with a diff).

## What I checked and found OK (no rows)

- **SSRF code:**
  - The article's code is identical to `lab.mjs:182-238`. The only difference is `PERMITIDOS`, which the lab reads from the environment; the text says so.
  - `fec0::/10` is in the list. The article claims a total `setTimeout` of 5 s, a 300-character cap with `r.destroy()`, and a `close` handler; the code does all three.
  - To rule out two responses, I reproduced the exact handler over http (`aud4.mjs` in the session scratchpad) and counted calls to `res.send`. Short body → 200, 1 send. 200 KB body → 200 with 300 characters, 1 send. Redirect → 502, 1 send. Stall after the headers (the timer destroys the request mid-stream) → 502, 1 send. Server that never answers → 502, 1 send. There were no uncaught exceptions and no `ERR_HTTP_HEADERS_SENT`.
  - The `limite` constant is safe to use inside the callback, because the callback always runs asynchronously, after the constant is initialised.
- **Wording:** the pinning/rebinding sentence (es:166) is fine.
- **A07 and A10 citations (es:30, Cites 3 and 4):** the A07 text names `admin`/`admin` and lists CWE-1392/1393; A10 lists CWE-209 and has Scenario #2. Both support the sentence.
- **Updated outputs:**
  - The stack line `lab.mjs:111:17` is in mediciones.txt.
  - `sid=74ece7c4…` (es:490) matches mediciones.txt:5.
  - `iat 1790560542 / exp 1790561442` (es:512) matches mediciones.txt:136.
- **Full pass over every bash block in es.mdx:** each command and output line is in mediciones.txt, mediciones2.txt, audit.txt, fabrica.txt or jwt-texto.txt. The only differences are the allowed ones: commands split across lines with `\`, the elisions marked with "..." (stack trace, `groups=`, npm audit), `$NONE`/`$DEBIL` in place of literal tokens (jwt-texto.sh), and `-c /tmp/lab-cookies` dropped. The single exception is Pwned Passwords (row 1).
- **"Cómo comprobarlo" claims:**
  - All the SSRF ones are in mediciones2: decimal IP 400, localhost 400, example.com, redirect 502, and 300 bytes via `wc -c`.
  - The CSRF ones are in mediciones2: cross-site, no header and no token, foreign Origin, right token, wrong token.
  - Retry-After 900 is in mediciones2.
- **Section 18 numbers:**
  - 152 s → "2,5 minutos" and 368 s → "6 minutos" (prompt-tiempos.txt).
  - "19 tests, 18 fail before, 19 pass after" and "2FA and hashing pending" match prompt-fase4-5.txt.
  - `prompt-usado.md` (scratchpad) is identical to the published prompt.es.md.
- **promptMinutes [5, 15]:** consistent with the run (≈8.5 min).
- **Citations 1–35:** all 40 `<Cite>` uses in es and en are identical. Every number points at the reference that supports its sentence (spot-checked each line). There are no gaps, no unused references, and `repeat` appears only on second uses.

## Rows that are not OK

| # | Location | Claim | Check done | Verdict | Correction |
|---|---|---|---|---|---|
| 1 | es:476-481 / en | Pwned Passwords output `1E4C9B93…:52372427`, "más de 52 millones" on 27 September | It is no longer in any committed evidence file. The re-run of mediciones2.txt dropped it, although notas.md says `medir2.sh` includes it. I verified it live on 27 Sep (my second report) and got the same value | UNVERIFIED in the committed evidence (true) | Put the Pwned Passwords block back into mediciones2.txt, or fix notas.md |
| 2 | es:558 / en:558 | "Para el recorrido de rutas pidió `../package.json`, como indica el prompt" | The phase 1–3 transcript of the re-run is not committed. The scratchpad copy (`lab-prompt2-fase1-3.txt`) keeps only the agent's last message. The only evidence of `../package.json` is the test the agent wrote in phase 4 (`prompt-pruebas-generadas.test.mjs.txt:189`). In the phase 5 table, path traversal is "Posible" in phase 2, so it was not confirmed with any request. Nothing shows which request, if any, it made in phase 2 | UNVERIFIED | "Su prueba del recorrido de rutas usa `../package.json`, como indica el prompt", or commit the phase 1–3 transcript that shows the request |
| 3 | es:556-564 / en | "Dejó pendientes la verificación en dos pasos y el hash de las contraseñas" and, in the same section, "`git diff` muestra solo las correcciones confirmadas y sus pruebas" | prompt-fase4-5.txt: the agent also left `.npmrc`/`ignore-scripts` pending, along with the breached-password check and CI. Under "Decisiones que tomé con mi criterio" it says it changed `/f/ordenar` and `/f/token` "aunque en la fase 3 no los había marcado como fallos confirmados". It also rewrote the `/v/` and `/v2/` routes and changed `npm start` in package.json. The prompt says "Solo cambias el código de las correcciones confirmadas… No refactorices" | MISLEADING by omission | Add one sentence: "También cambió dos rutas que no había marcado en la fase 3 y el script de arranque; revise el `git diff` antes de aceptarlo." Optional: name `.npmrc` among the pending items |

## Verdict

PUBLICABLE. The technical content, code, outputs and citations are correct. The three rows affect the evidence record and the description of the demonstration run, not what the article teaches; row 3 deserves a sentence before publishing.
