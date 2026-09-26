# Configurar este proyecto para trabajar con un agente de programación

Eres el agente de programación que se ejecuta en este repositorio. Vas a dejar configurado el entorno de trabajo: un archivo de instrucciones del proyecto, una regla que impide leer secretos, y tres revisores (seguridad, calidad y pruebas) con una skill que los lanza sobre cada cambio.

Este texto sirve para cualquier herramienta. Tú sabes cuál eres y dónde lee tu herramienta cada cosa. Donde este texto dice «el directorio de skills» o «el directorio de subagentes», usa el que corresponda a tu herramienta. Si no estás seguro de una ruta, consulta la documentación oficial de tu herramienta antes de escribir; no la inventes.

Créditos: los revisores adaptan ideas de cloudflare/security-audit-skill (MIT, © 2025-2026 Cloudflare, Inc., https://github.com/cloudflare/security-audit-skill) y de affaan-m/ECC (MIT, © 2026 Affaan Mustafa, https://github.com/affaan-m/ECC). Conserva esta línea de créditos en cada archivo de revisor que generes.

## Reglas para toda la tarea

- No instales dependencias, plugins ni servidores MCP. No actives ningún modo que omita permisos.
- No modifiques código de la aplicación. Solo creas archivos de configuración y documentación del agente.
- Si un archivo que vas a crear ya existe, no lo sobrescribas: muestra la diferencia y pregunta.
- Toda orden que escribas en un archivo la has ejecutado antes en este repositorio y ha terminado bien. Si no se puede ejecutar, no la escribas.
- Escribe en el idioma en que está la documentación del repositorio. Si no hay, en el idioma de esta conversación.

## Fase 1. Reconocer el proyecto (solo lectura)

1. Identifica tu herramienta y anota tres rutas: dónde lee las instrucciones del proyecto, dónde lee las skills del proyecto y dónde lee los subagentes del proyecto, si los admite.
2. Lee los manifiestos que existan (`package.json`, `pyproject.toml`, `go.mod`, `Cargo.toml`, `pom.xml`, `composer.json`, `Gemfile`, `*.csproj` y equivalentes) y los archivos de bloqueo. Anota lenguaje, versión del entorno de ejecución y gestor de paquetes.
3. Encuentra las órdenes reales de: instalar, compilar, ejecutar las pruebas, ejecutar una sola prueba, linter, comprobación de tipos y auditoría de dependencias. Sácalas de los scripts del manifiesto, del README y de la integración continua (`.github/workflows/`, `.gitlab-ci.yml` o equivalente).
4. Ejecuta cada una de esas órdenes una vez, salvo la de instalar si las dependencias no están instaladas: esa se lee, no se ejecuta. Anota cuáles terminan bien, cuánto tardan y cuáles fallan con el error exacto. Si una orden crea o modifica archivos, deshaz ese efecto y dilo.
5. Lee si ya existen `AGENTS.md`, `CLAUDE.md`, `.cursor/rules/`, `.github/copilot-instructions.md` o cualquier otro archivo de instrucciones para agentes.
6. Busca archivos con secretos o credenciales por nombre: `.env*`, `*.pem`, `*.key`, `secrets.*`, `credentials*`. No abras su contenido.
7. Mira `git log --oneline -20` y el estilo de los mensajes de commit.

## Fase 2. Proponer y esperar

Antes de escribir nada, presenta:

- una tabla con cada archivo que vas a crear o modificar, su ruta y una línea que diga para qué sirve;
- las órdenes de la fase 1 con su resultado;
- lo que no pudiste determinar.

Después **detente y pide confirmación**. No continúes hasta recibirla. Si la respuesta cambia algo, aplica el cambio a la propuesta y vuelve a presentarla.

## Fase 3. Archivo de instrucciones del proyecto

Crea `AGENTS.md` en la raíz. Es el archivo canónico porque lo leen varias herramientas. Comprueba en la documentación actual si tu herramienta lo lee por sí sola; no lo supongas de memoria (Claude Code, por ejemplo, lo lee directamente desde la versión 2.1.277 si no hay un `CLAUDE.md`). Si tu herramienta no lo lee, o si el repositorio ya tiene el archivo propio de tu herramienta, añade a ese archivo una línea que importe `AGENTS.md` según su sintaxis documentada (por ejemplo, `@AGENTS.md` en un `CLAUDE.md`), y debajo solo lo específico de tu herramienta. Si ya existe un archivo de instrucciones, no lo sustituyas: propón mover su contenido a `AGENTS.md` y espera respuesta.

`AGENTS.md` tiene menos de 200 líneas y solo contiene lo que no se deduce leyendo el código:

```markdown
# <nombre del proyecto>

## Órdenes
- Instalar: <orden>
- Pruebas: <orden>            (una sola: <orden con el patrón>)
- Linter: <orden>
- Tipos: <orden>
- Auditoría de dependencias: <orden>

## Entorno
- <lenguaje y versión exacta>, <gestor de paquetes y versión>

## Convenciones
- <convención concreta y comprobable, p. ej. «las fechas se guardan en UTC y se formatean solo en la interfaz»>
- Formato de commit: <el que usa el historial>

## Antes de dar una tarea por terminada
1. <orden de pruebas> termina en 0.
2. <orden de linter> y <orden de tipos> terminan sin avisos.
3. No se añadió ninguna dependencia que la tarea no pidiera.

## Revisión
Antes de confirmar un cambio, ejecuta la skill `revisar-cambio`.
```

Cada línea es una instrucción verificable. «Usa indentación de 2 espacios» vale; «escribe código limpio» no. No listes directorios ni dependencias.

## Fase 4. Los secretos no se leen

Añade a la configuración de permisos de tu herramienta una regla que deniegue la lectura de los archivos de secretos encontrados en la fase 1, como mínimo `.env` y `.env.*`. La regla va en la configuración que la herramienta aplica, no en `AGENTS.md`: una instrucción en texto la interpreta el modelo, y una regla de permisos la aplica la herramienta. En Claude Code es:

```json
{ "permissions": { "deny": ["Read(./.env)", "Read(./.env.*)"] } }
```

en `.claude/settings.json`. En otra herramienta, usa su mecanismo documentado equivalente (un archivo de exclusión, una regla de permisos). Si tu herramienta no tiene ninguno, dilo en el informe final en lugar de sustituirlo por una instrucción. Si la regla solo cubre la herramienta de lectura y no la terminal, dilo también.

Compruébalo: intenta leer `.env` con tu herramienta de lectura. Tiene que devolver un bloqueo. Que tú decidas no leerlo no cuenta como comprobación.

## Fase 5. Tres revisores

Crea tres skills en el directorio de skills del proyecto, cada una en su carpeta con un `SKILL.md` que sigue el estándar abierto Agent Skills (https://agentskills.io/specification): cabecera YAML con `name` (minúsculas, números y guiones, igual que el nombre de la carpeta) y `description` (qué hace y cuándo usarla, menos de 1024 caracteres), y las instrucciones debajo.

Si tu herramienta admite subagentes, crea además un subagente por revisor que cargue su skill, con acceso de solo lectura más ejecución de órdenes (en Claude Code: `.claude/agents/<nombre>.md` con `tools: Read, Grep, Glob, Bash` y `skills: [<nombre>]`). Un subagente trabaja en su propia ventana de contexto, así que cada revisor lee el cambio sin el sesgo de la conversación que lo escribió.

Sustituye en las tres plantillas `<orden de pruebas>` y las demás marcas por las órdenes reales de la fase 1.

### Contrato común de los tres

Copia este bloque, sin cambios, al principio de las instrucciones de cada revisor:

```markdown
## Contrato del hallazgo

Un hallazgo sin estos cinco campos no se reporta:

- **archivo:línea** exactos.
- **fallo**: entrada o estado concreto → qué pasa → qué resultado malo produce.
- **gravedad**: crítica, alta, media o baja (anclas abajo).
- **arreglo**: el cambio mínimo, en el punto donde se toma la decisión.
- **comprobado**: qué ejecutaste o leíste para confirmarlo y qué devolvió.

Antes de escribir un hallazgo, responde sí a las cuatro:
1. ¿Puedo citar la línea exacta?
2. ¿Puedo nombrar la entrada que lo dispara y el resultado?
3. ¿He leído quién llama a este código y sus pruebas? Muchos fallos aparentes ya se controlan un nivel más arriba.
4. ¿La gravedad se sostiene si otra persona la discute?

Si alguna es no o dudosa: baja la gravedad o descarta el hallazgo.

- Crítica y alta exigen el fragmento, el escenario de fallo y por qué las protecciones existentes (tipos, validación, el framework) no lo detienen. Sin las tres cosas, es media como máximo.
- La duda entre defecto y decisión deliberada es baja, y el arreglo empieza por «confirmar si…».
- Un hallazgo por defecto, no por archivo. Cinco funciones con el mismo fallo son un hallazgo.
- Un falso positivo cuesta un cambio en código que funcionaba. Vale más un informe con tres hallazgos ciertos que con quince dudosos.
- **Cero hallazgos es un resultado válido.** No fabriques hallazgos para justificar la revisión.
- No reportes nombres, formato, orden de argumentos ni prosa. Nunca.
- Solo revisas lo que el cambio toca. Un defecto previo en código no tocado es aviso de una línea, salvo que sea de gravedad crítica.

## Informe

Veredicto (limpio / con avisos / bloquea), tabla de hallazgos (archivo:línea, gravedad, fallo en una línea) y la lista de lo que ejecutaste con su resultado. Nada más.

Créditos: adaptado en parte de cloudflare/security-audit-skill (MIT, © 2025-2026 Cloudflare, Inc.) y affaan-m/ECC (MIT, © 2026 Affaan Mustafa).
```

### revisor-seguridad

```markdown
---
name: revisor-seguridad
description: Revisa un cambio buscando fallos de seguridad con consecuencia real (acceso indebido, inyección, secretos expuestos, datos perdidos). Úsala sobre el diff antes de confirmar, o cuando se pida revisar la seguridad de un cambio.
---

# Revisor de seguridad

Tu pregunta es una: **¿este cambio deja que alguien haga o vea algo que no debería?**

[pega aquí el contrato común]

## Qué es un hallazgo de seguridad

Un hallazgo cruza una frontera de confianza y produce un resultado. Para cada candidato nombra:
quién tiene menos confianza (un usuario anónimo, otro inquilino, una entrada externa), qué entrada controla,
qué control debería detenerlo, qué frontera cruza, y qué recurso o persona resulta afectada.
Sin esas cinco piezas no es un hallazgo: es una buena práctica que falta, y eso no se reporta como vulnerabilidad.

## Qué buscas

- Autorización: una ruta, acción o consulta que no comprueba quién la pide ni si el recurso le pertenece.
  Ocultar un botón en la interfaz no es un permiso.
- Inyección: entrada que llega sin parametrizar a SQL, a una orden de sistema, a una plantilla o a HTML.
- Secretos: credenciales en el código, en el paquete que descarga el navegador o en los registros.
- Validación que existe en el cliente y no en el servidor.
- Errores que devuelven detalle interno (trazas, consultas, rutas) a quien llama.
- Dependencias nuevas: que existan en el registro público, que la versión esté fijada y que el cambio las necesite.
- Datos que se pierden, se sobrescriben o quedan a medias; dos escrituras que compiten sin transacción.

## Gravedad

- **crítica**: sin autenticarse, alguien ejecuta código, accede al almacén de datos entero o toma cuentas ajenas.
- **alta**: alguien anula por completo un control explícito con consecuencia real (saltarse la autenticación, leer o escribir datos de otro inquilino, script persistente que afecta a otros usuarios).
- **media**: una frontera se viola con alcance limitado o condiciones poco comunes.
- **baja**: se expone información interna no secreta, o el efecto exige mucho esfuerzo para poco resultado.

Si no puedes decir el daño concreto, la gravedad es menor de lo que parece.

## Qué no haces

- No supones cómo está configurado el despliegue (proxy, cabeceras, proveedor). Si el hallazgo depende de eso, dilo como «pendiente de confirmar» con el dato exacto que falta.
- No pruebas contra servicios desplegados ni externos. Solo código fuente y pruebas locales.
- No marcas como fallo el uso de `Math.random()` fuera de criptografía, credenciales de prueba en archivos de prueba, ni valores de `.env.example`.
- Si ves un problema de calidad o de pruebas, una línea de aviso y sigue: son de los otros dos revisores.
```

### revisor-calidad

```markdown
---
name: revisor-calidad
description: Revisa si un cambio se va a poder mantener (primitivas duplicadas, errores que se tragan, dos partes que deben coincidir y nada las compara). Úsala sobre el diff antes de confirmar. No juzga seguridad ni la fuerza de las pruebas.
---

# Revisor de calidad

Tu pregunta es una: **¿este cambio se va a poder sostener?** Buscas el defecto que se paga meses después, no el estilo.

[pega aquí el contrato común]

## Las seis formas que buscas, en este orden

1. **La función correcta ya existe y no se usa.** El cambio reimplementa algo que el proyecto ya tiene. Antes de afirmarlo, búscala (`grep -rn "nombre" .` o equivalente) y cita dónde está.
2. **Dos mitades que deben coincidir y nada las compara.** Validación del cliente contra la del servidor, esquema de base de datos contra el código que escribe en él, dos idiomas de la interfaz, un tipo contra la respuesta real de la API. Que se parezcan es el diseño; que puedan separarse sin que falle nada es el defecto.
3. **El error se confunde con el éxito.** Un `catch` que devuelve un valor por omisión, «no existe» y «no se pudo leer» en la misma rama, un código de salida que siempre es 0, un campo que el cliente envía y el servidor no lee.
4. **El parámetro que se pierde al delegar.** Una función recibe un argumento y llama a otra sin pasárselo.
5. **Un número que decide un límite, escrito en medio del código** en lugar de en la configuración. No cuentan 0, 1, códigos HTTP ni constantes obvias por su nombre.
6. **Lo que el cambio añade sin prueba.** Solo miras si existen pruebas para lo nuevo; si esas pruebas miden bien es del revisor de pruebas.

## Falsos positivos que no reportas

- «Falta manejo de errores» cuando quien llama o el framework ya lo maneja. Lee al menos un llamador.
- «Falta validación» en una función interna cuyos llamadores ya validan.
- «Función demasiado larga» en un `switch` exhaustivo, una tabla de pruebas o configuración.
- «Posible null» cuando la línea anterior ya lo descarta.
- Cambiar de lenguaje, de biblioteca o de arquitectura. Sigues las convenciones de `AGENTS.md`.

Pregúntate antes de cada uno: ¿alguien con experiencia en este equipo lo cambiaría en una revisión? Si no, no lo reportas.

## Cómo mides

Ejecuta solo las pruebas de los archivos que el cambio toca: `<orden para una sola prueba>`. La suite completa la ejecuta el revisor de pruebas.
```

### revisor-pruebas

```markdown
---
name: revisor-pruebas
description: Comprueba si las pruebas de un cambio pueden fallar de verdad, mutando el código que defienden, y cierra la revisión juntando los tres informes. Úsala al final de revisar-cambio o cuando se pida revisar las pruebas.
---

# Revisor de pruebas

Eres el último de los tres. Tienes dos trabajos.

[pega aquí el contrato común]

## Trabajo uno: ¿las pruebas miden lo que dicen medir?

Una prueba solo se acepta si se ha visto fallar. Las cuatro formas de prueba que no mide:

1. **No puede ponerse roja.** Compara dos valores que salen de la misma fuente, afirma sobre un objeto que la propia prueba acaba de crear, o recorre una lista vacía.
2. **Fija el defecto como esperado.** Arreglar el código pondría la suite en rojo. Es la peor: bloquea el arreglo y parece cobertura.
3. **Mide su propia copia.** El doble de prueba calcula el resultado con la misma fórmula que el código, así que los dos se equivocan igual.
4. **Depende de la ortografía y no de la conducta.** Renombrar una variable la rompe; cambiar el comportamiento no.

**La herramienta es la mutación.** Cambia una línea de lo que el diff añade (invierte una condición, quita una comprobación, cambia un límite en uno) y ejecuta solo las pruebas de ese archivo con `<orden para una sola prueba>`. Si siguen en verde, la prueba no defiende esa línea: es un hallazgo. Con unas ocho mutaciones basta; más solo si un hallazgo concreto lo pide.

Restaura cada mutación con `git show HEAD:<ruta> > <ruta>`. **Nunca** con `git checkout --` ni `git restore`, que descartan también cambios sin confirmar que no son tuyos. Si el archivo no está confirmado todavía, guarda una copia antes de mutar y restáurala desde esa copia.

Casos límite que deberían tener prueba cuando el cambio los toca: entrada nula o vacía, tipo incorrecto, valores en el límite, la ruta de error (red, disco, base de datos), caracteres especiales.

Una prueba débil bloquea solo si lo que no mide lo introduce este cambio y su fallo haría daño real. Un hueco que ya existía es aviso.

## Trabajo dos: desmontar lo que los otros dos dieron por bueno

Lee los informes de revisor-seguridad y revisor-calidad y desconfía de ellos:

- Lo que declararon correcto: abre el archivo en la línea citada y compruébalo.
- Lo que dieron por cubierto «porque tiene prueba»: ¿esa prueba muerde?
- Un hallazgo suyo que no se sostiene: lo bajas o lo quitas, y lo dices con el motivo.

## La suite

Ejecuta la suite completa una vez, al final: `<orden de pruebas>`, y `<orden de tipos>` si existe. Anota los números exactos.

## Veredicto

Juntas los hallazgos de los tres en un solo informe. **Bloquea** si hay alguna crítica o alta, o una media de seguridad o de pruebas. Lo demás son avisos.
```

## Fase 6. La skill que lanza la revisión

Crea la skill `revisar-cambio`:

```markdown
---
name: revisar-cambio
description: Revisa el cambio actual en tres fases (seguridad, calidad, pruebas) antes de confirmarlo o de abrir un pull request. Úsala cuando se pida revisar un cambio, un diff o una rama.
---

# Revisar un cambio

1. Obtén el cambio: si hay cambios sin confirmar, `git add -A && git diff --cached`; si no, `git diff <rama base>...HEAD`. Lista los archivos con `--stat`, incluidos los nuevos.
2. Si no hay cambios, dilo y termina.
3. Lanza revisor-seguridad y revisor-calidad sobre ese diff. Si tu herramienta admite subagentes, en paralelo y cada uno en su propio contexto; si no, uno detrás de otro.
4. Cuando terminen los dos, lanza revisor-pruebas con el diff y los dos informes.
5. Muestra el veredicto final y la tabla de hallazgos. No arregles nada sin que se pida: el informe es el producto.
```

## Fase 7. Comprobar y cerrar

1. Comprueba que las cuatro skills aparecen en tu herramienta (en Claude Code, escribiendo `/` en la sesión) y que la cabecera de cada una es válida.
2. Comprueba de nuevo la regla de secretos de la fase 4.
3. Crea un cambio de prueba pequeño y descartable, por ejemplo una función con un `catch` vacío que devuelve `[]`, en un archivo nuevo. Ejecuta `revisar-cambio` sobre él y comprueba que el revisor de calidad lo señala. Después borra ese archivo y confirma con `git status --porcelain` que el árbol queda como estaba.
4. Termina con un informe corto: la lista de archivos creados, las órdenes que quedaron en `AGENTS.md` con su resultado, lo que no se pudo configurar en tu herramienta y por qué, y cómo se lanza la revisión (`/revisar-cambio` o su equivalente).
