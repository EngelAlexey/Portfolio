# Temario de los próximos posts

Los pasos siguientes y el estado de la cuenta están en `docs/plan.md`.

Evaluación del 16 de septiembre de 2026 de las 100 consultas que pasó Alex, más una derivada (x1). La lista no trae volumen ni fuente, así que se trata como hipótesis.

## Títulos (versión vigente)

Notas de Alex, en orden:
1. Los temas ya dan ganas de leer, pero hay que escribirlos más simple, por ejemplo «¿Tu router sabe qué buscas?».
2. No todo va en forma de pregunta: el 41 va como «Configurar Docker de manera segura». Cada título debe corresponder a su tema y llamar la atención.
3. En Instagram, títulos más generales: «¿Qué es una dirección IP?», «¿Cómo se configuran los permisos en Linux?» y «Aprende a usar GitHub».
4. El primer carrusel incluye también los 300, y el criterio general se aplica a todos los títulos, no solo a los de Instagram.

Criterio:
- **Concepto.** El título nombra el concepto general, al nivel de quien empieza.
- **Formas:**
  - «¿Qué es…?» o «¿Cómo…?»;
  - guía («Cómo…», «Configurar… de manera segura»);
  - invitación («Aprende a…»);
  - una pregunta sobre algo cotidiano («¿Tu router sabe qué buscas?»).
- **El caso concreto va dentro.** El error, el número o el incidente se explican en el post, no en el título.
- **Lenguaje.** Simple y de 8 palabras o menos, sin contar las cifras; los nombres de herramientas conocidas caben.
- **Promesa.** El post responde lo que promete el título con un hecho comprobable.
- **Listas.** El formato lista («Tres…») solo va en carruseles: el reel que abría con una lista retuvo 4 s, frente a 14 s del que abría con un dato.

### Artículos

Cada artículo sale en español y en inglés, con su carrusel o reel. Los títulos generales coinciden con búsquedas reales, así que valen tal cual para el blog; la tagline y `description` llevan el término técnico cuando hace falta.

| Título | Qué va dentro | Temas de la lista | Señal de búsqueda (autocompletado, ES) |
|---|---|---|---|
| ¿Tu router sabe qué buscas? | Qué ven el router y el proveedor (DNS), qué oculta HTTPS y cuándo falla una VPN | 90 | «mi proveedor de internet ve lo que busco» |
| Configurar Docker de manera segura | Secretos fuera de la imagen, el grupo docker equivale a root, ADD frente a COPY, no montar docker.sock, compilación por etapas | 41, 31, 32, 35, 38 | «configurar docker», «seguridad en contenedores docker» |
| ¿Qué son las variables de entorno? | Por qué las contraseñas van ahí, `.gitignore`, y qué hacer si una llegó a Git: sigue en el historial y hay que cambiarla | 7, 24 | «variables de entorno» |
| Cómo deshacer cambios en Git | reset, restore, revert, amend y conflictos | 1, 5, 9, 10, 11 | «como deshacer cambios en git» |
| ¿Qué es CORS y para qué sirve? | Por qué Postman sí y el navegador no; qué protege y qué no | 55 | «que es cors» |
| ¿Cómo funcionan las cookies? | La sesión, HttpOnly y SameSite; cookie o localStorage frente a un XSS | 61 | «como funcionan las cookies» |
| ¿Qué es un ataque de fuerza bruta? | Cómo funciona y cómo se frena: límite de intentos y respuesta 429 | 65 | «que es un ataque de fuerza bruta en ciberseguridad» |
| ¿Es segura la verificación en dos pasos? | SMS, aplicación y passkeys; cómo entraron a Uber en 2022 aprobando una notificación | 95 | «es segura la verificacion en dos pasos» (también con WhatsApp y Gmail) |
| ¿Qué es una filtración de datos? | Cómo una app muestra datos de otro usuario (ChatGPT, marzo de 2023) y cómo evitarlo | 79 | «que es una filtracion de datos» |
| ¿Qué es un certificado SSL? | Qué comprueba el navegador y qué pasa al ignorar el aviso | 60 | «que es un certificado ssl y para que sirve» |
| Cómo instalar paquetes npm de manera segura | Scripts de instalación, npm 12 y `allowScripts`, `.npmrc` | x1 | «npm install seguro» |
| Cómo proteger un servidor Linux | Permisos, claves SSH, puertos abiertos y servicios | 18, 22, 28, 30 | Sin señal |
| Aprende a escribir JavaScript seguro | Contaminación de prototipo y otros errores del lenguaje | 71 | Poca demanda |

### Carruseles de Instagram

Van como carrusel, una lámina por concepto, y la historia del mismo día enlaza al artículo relacionado.

| Título | Qué explica dentro | Temas de la lista | Historia con enlace a | Señal de búsqueda (autocompletado, ES) |
|---|---|---|---|---|
| ¿Qué significan los códigos 200, 300, 400 y 500? | Las familias 2xx, 3xx, 4xx y 5xx con 19 códigos, cada uno con su nombre y qué significa, y un resumen de todos | 56, 57 | ¿Qué es CORS y para qué sirve? Hasta que exista, «Siete cosas que revisar», sección 2 (404 en lugar de 403) | «codigos http», «códigos http 400» |
| ¿Cómo funciona una página web? | Los cuatro pasos de una visita: URL, DNS, TCP, TLS, GET, HTML, DOM y más (16 piezas) | 60, 62 | ¿Tu router sabe qué buscas? Hasta que exista, «Siete cosas que revisar», sección 4 | «como funciona una pagina web» |
| ¿Qué es una dirección IP? | IPv4 e IPv6, privadas y pública, 127.0.0.1, 0.0.0.0 y 169.254, y cómo ver la tuya (17 términos) | 93 | ¿Tu router sabe qué buscas? Hasta que exista, el índice del blog | «que es una dirección ip y para que sirve» |
| ¿Qué es un puerto de red? | Rangos, servicios, bases de datos y desarrollo, y cómo ver y cerrar los que sobran (19 términos) | 19, 28 | Cómo proteger un servidor Linux. Hasta que exista, el índice del blog | «que es un puerto de red» |
| ¿Cómo se configuran los permisos en Linux? | Letras, usuarios, 644, 755, 600, 700 y 777, y chmod, chown y umask (18 filas) | 18 | Cómo proteger un servidor Linux. Hasta que exista, el artículo de npm, sección 1 | — |
| Aprende a usar GitHub | Conceptos, órdenes en el equipo, con GitHub y para colaborar (20 términos) | 1 a 15 | Cómo deshacer cambios en Git. Hasta que exista, «Primeros pasos», sección 12 | «como usar github» |
| ¿Qué es una API? | Piezas, métodos, qué lleva una petición y qué comprueba el servidor (20 términos) | 58 | ¿Qué es CORS y para qué sirve? Hasta que exista, «Siete cosas que revisar», sección 2 | «que es una api y para que sirve» |
| ¿Cuáles son los ataques web más comunes? | 14 ataques en cuatro familias, en el orden del OWASP Top 10:2025, y cómo se evita cada uno | 49, 61 | ¿Cómo funcionan las cookies? Hasta que exista, «Siete cosas que revisar», sección 3 | «ataques web mas comunes» |
| Aprende a usar la terminal de Linux | Moverse, archivos, leer y buscar, y redirecciones (20 órdenes y símbolos). Los permisos ya están en su carrusel | 23 | Cómo proteger un servidor Linux. Hasta que exista, el índice del blog | «como usar la terminal» se confunde con los datáfonos, por eso lleva «de Linux» |

Con dos publicaciones por semana, los 9 carruseles cubren unas cuatro semanas y media, intercalados con las piezas de los 13 artículos.

**Estado.** Los cinco primeros carruseles están programados en Meta Business Suite desde el 16 de septiembre de 2026, con el texto de cada `publicacion.md`:

| Publicación | Carrusel | Carpeta | Portada |
|---|---|---|---|
| jueves 17, 2:00 p. m. | ¿Qué significan los códigos 200, 300, 400 y 500? | `codigos-http/` | verde bosque |
| viernes 18, 1:00 p. m. | ¿Cómo funciona una página web? | `pagina-web/` | magenta |
| miércoles 23, 1:00 a. m. | ¿Qué es una dirección IP? | `direccion-ip/` | verde azulado |
| viernes 25, 1:00 p. m. | ¿Qué es un puerto de red? | `puertos/` | carmín |
| miércoles 30, 1:00 a. m. | ¿Cómo se configuran los permisos en Linux? | `permisos-linux/` | azul petróleo |

Las horas son las que sugiere Meta en «Active times», que se calculan con la actividad de los seguidores en los 7 días anteriores. El 16 de septiembre sugería jueves 17 a las 2:00 p. m., viernes 18 a la 1:00 p. m. y miércoles 23 a la 1:00 a. m. Para los dos últimos no había franja, así que se repitió la hora sugerida para ese día de la semana. Alex eligió la primera. Las historias con enlace se suben a mano, sin recordatorio en el calendario: Alex pidió quitarlos. El orden de publicación es el de `docs/vista-perfil-serie.png`, así que los colores de portada siguen sin repetirse al lado.

Los cuatro restantes quedaron listos el 16 de septiembre de 2026 y se programaron el 17, detrás de los cinco anteriores. El orden lo eligió Claude para que ninguna portada quede junto a otra de color parecido mientras se van publicando:

| Publicación | Carrusel | Carpeta | Portada |
|---|---|---|---|
| viernes 2 de octubre, 1:00 p. m. | ¿Cuáles son los ataques web más comunes? | `ataques-web/` | magenta |
| lunes 5, 7:00 p. m. | Aprende a usar la terminal de Linux | `terminal-linux/` | oliva |
| jueves 8, 2:00 p. m. | ¿Qué es una API? | `api/` | ciruela |
| lunes 12, 7:00 p. m. | Aprende a usar GitHub | `github/` | pizarra |

El 17 de septiembre, «Active times» sugería jueves a las 2:00 p. m., viernes a la 1:00 p. m. y lunes a las 7:00 p. m. Las fechas quedaban fuera de su ventana, así que se repitió la hora sugerida para cada día de la semana. Business Suite solo deja programar unos 29 días por delante: el 17 de septiembre, el último día disponible era el 16 de octubre.

Con ellos se agotan los carruseles de esta tabla. La pizarra y la oliva son tonos nuevos. `ataques-web/` salió primero en ocre y Alex pidió una paleta más bonita aunque repitiera color: quedó en magenta, como `pagina-web/`, con la que en la cuadrícula solo toca en diagonal.

**Formato de los carruseles de esta tabla.** Nota de Alex a la primera versión, que llevaba dos códigos por familia: el diseño estaba bien, pero hacían falta más códigos, que cada uno explicara qué hace y un cierre que los resumiera todos. Así que cada uno lleva una lámina por familia, con tres a cinco términos, cada uno con su nombre y qué significa, y un resumen al final. Detalle en el README, «Carruseles explicativos».

## Relectura por curiosidad

Los ganchos y los títulos de esta sección quedan reemplazados por «Títulos (versión vigente)». Los temas, las demostraciones y las fuentes siguen valiendo.

Nota de Alex sobre la primera selección: los temas eran buenos, pero muy específicos, y no despertaban curiosidad; el 41 era la excepción. Criterio que se aplica desde entonces: el post tiene que interesar también a quien no tiene el problema. Se usan tres patrones:

| Patrón | Evidencia en la cuenta |
|---|---|
| A. Riesgo oculto en algo que se hace a diario (el del 41) | El reel «Un paquete puede traer un script dentro» retuvo 14 s de media. El que abría con una lista («Tres vulnerabilidades…») retuvo 4 s. |
| B. Pregunta que se hace cualquiera que programa | «¿Se aprende a programar si la IA escribe el código?» fue la publicación con más interacciones (11), aunque parte vino de la red de Alex. |
| C. Incidente real explicado | Sin probar todavía en la cuenta. |

| # | Patrón | Gancho (portada o primer segundo del reel) | Artículo | Demostración o fuente |
|---|---|---|---|---|
| 41 | A | Tu imagen de Docker puede llevar tus contraseñas dentro | Cómo pasar secretos a Docker sin que queden en la imagen | `docker history --no-trunc` con `ARG` y con `RUN --mount=type=secret` |
| 7 | A | Borrar una contraseña de Git no la borra | Qué hacer si subiste una contraseña a Git | `git log -p`. GitGuardian 2025: 23,8 millones de secretos filtrados en GitHub público en 2024, y el 70 % de los filtrados en 2022 seguía activo |
| 71 | A | Un JSON puede dar permisos de administrador a todos los objetos de tu aplicación | Qué es la contaminación de prototipo en JavaScript y cómo evitarla | Merge ingenuo con `__proto__` → `({}).isAdmin === true`; `structuredClone` no la produce. Comprobado en Node 24.19.0 |
| 90 | A | Tu VPN puede estar diciendo qué sitios visitas | Qué es una fuga de DNS y cómo comprobar tu VPN | Consultas DNS fuera del túnel, vistas con Wireshark; documentación de Proton VPN |
| 55 | B | ¿Por qué el navegador bloquea tu petición y Postman no? | Qué es CORS y qué protege realmente | La misma petición con `fetch` y con `curl` |
| 61 | B | ¿Dónde guarda una web tu sesión y quién puede leerla? | Cookie HttpOnly o JWT en localStorage: qué puede robar un XSS | `document.cookie` y `localStorage` desde la consola |
| 65 | B | ¿Por qué una web te bloquea después de varios intentos? | Cómo limitar intentos para frenar la fuerza bruta | Script de carga contra un endpoint con límite, que responde 429 |
| 95 | C | Así entraron a Uber: aprobando una notificación | Qué es la fatiga de MFA y por qué las passkeys la evitan | Uber, septiembre de 2022; contrastar con la nota de seguridad de Uber al redactar |
| 79 | C | Por qué ChatGPT mostró conversaciones de otros usuarios | Cómo una aplicación termina mostrando datos de otro usuario | Informe de OpenAI del 20 de marzo de 2023 (fallo en redis-py); un Singleton con estado de la petición, demostrado con dos sesiones |

**Solo Instagram:**
- 23: ¿Qué significa el `2>&1` que copias sin leer?
- 57: ¿Qué quiere decir exactamente un error 502?
- 93: ¿Por qué tu PC tiene una IP 169.254?
- 16: salir de Vim, verificando la cifra antes de publicarla.
- 49: Cómo un apóstrofo expone una base de datos. Sale del punto 3 de «Siete cosas que revisar».

**Vía búsqueda, sin portada propia:** x1, 60, 31, 18 y 22 siguen sirviendo como artículos que responden a un error concreto. En Instagram entran como secciones sueltas, no como piezas principales.

Fuentes de los ganchos:
- [OpenAI, incidente del 20 de marzo de 2023](https://openai.com/index/march-20-chatgpt-outage/)
- [GitGuardian, State of Secrets Sprawl 2025](https://blog.gitguardian.com/the-state-of-secrets-sprawl-2025/)
- [Proton VPN, fugas de DNS](https://protonvpn.com/support/dns-leaks-privacy)
- Caso Uber, en resúmenes secundarios, por ejemplo [centrexIT](https://centrexit.com/blog/mfa-fatigue-uber-breach-2022/); falta la fuente primaria.

Lo que sigue es la primera selección, hecha con criterio de búsqueda.

## Criterios

| Criterio | Escala | Qué mide |
|---|---|---|
| Encaje | 0–3 | Relación con «seguridad en desarrollo», que es la promesa del blog y de la bio de Instagram. |
| Oportunidad | 0–3 | Posibilidad real de posicionar un dominio nuevo. 3 = cambio reciente con poca competencia, que es el patrón del único artículo que posicionó (pnpm 11, posición 3). 0 = consulta básica que dominan Stack Overflow y la documentación oficial. |
| Reproducible | 0–2 | Si el artículo puede llevar el comando, la salida y la versión exacta, como exigen las reglas del blog. |
| Instagram | 0–2 | Si da para un carrusel de consulta rápida o un reel con una afirmación concreta al inicio. |
| Demanda | 0–2 | Autocompletado de Google, en español (Costa Rica) y en inglés (EE. UU.). 2 = 8 o más sugerencias. Solo indica que la búsqueda existe, no cuánto volumen tiene. |
| Solapamiento | 0 o −2 | Si ya lo cubre un artículo publicado o un artículo pendiente. |

## Resultado

| Veredicto | Temas |
|---|---|
| Escribir ya | #31, #41, #55, #60, #x1, #7, #18, #22, #61, #65 |
| Siguiente tanda | #79, #95, #9, #28, #30, #32, #37, #38, #71 |
| Búsqueda, fuera del núcleo | #73, #75 |
| Dentro de un artículo pendiente | #56 |
| Sustituir por x1 | #72 |
| Ya cubierto | #49, #85 |
| Solo Instagram | #23, #1, #2, #5, #10, #17, #19, #33, #57, #3, #12, #40, #58, #63, #64, #76, #94 |
| Aplazar | #24, #26, #35, #36, #46, #48, #50, #53, #89, #90, #96, #4, #8, #13, #14, #15, #20, #21, #27, #34, #39, #45, #62, #78, #83 |
| Descartar por ahora | #6, #11, #16, #25, #29, #42, #43, #44, #47, #59, #66, #67, #69, #70, #74, #77, #84, #87, #88, #93, #98, #100, #52, #68, #80, #81, #51, #54, #82, #86, #92, #97, #91, #99 |

## Ángulo de los temas que avanzan

- **#31 Cannot connect to the Docker daemon** (Escribir ya). La corrección habitual, añadir el usuario al grupo docker, equivale a darle root; se demuestra montando / en un contenedor. Alternativa: Docker sin root.
- **#41 Secretos en contenedores** (Escribir ya). Lo que pasa por ARG o ENV queda en docker history; RUN --mount=type=secret no deja rastro. Se comprueba con docker history --no-trunc.
- **#55 Error de CORS** (Escribir ya). CORS lo aplica el navegador: curl recibe la respuesta igual, así que no protege la API. La corrección es una lista de orígenes, no *.
- **#60 SSL certificate problem: self signed certificate** (Escribir ya). Desactivar la verificación (-k, NODE_TLS_REJECT_UNAUTHORIZED=0, verify=False) quita la protección contra intermediarios (CWE-295). La corrección es confiar en la CA.
- **#x1 npm 12: allowScripts y scripts bloqueados (sale del 72)** (Escribir ya). El aviso exacto de npm 12, cómo aprobar un paquete y qué pasa con dependencias git y URL. El anuncio de GitHub del 9 de junio nombra npm approve-scripts y deny-scripts; el aviso de npm 12.0.2 remite a npm install-scripts ls/approve, y en 12.0.2 existen las dos formas (comprobado el 16 de septiembre). Explicar las dos con la versión exacta es la aportación.
- **#7 Dejar de rastrear un archivo (git rm --cached)** (Escribir ya). Un .env que se deja de rastrear sigue en el historial: se comprueba con git log -p, se rota el secreto y se reescribe con git filter-repo.
- **#18 chmod 777, 755 y 644** (Escribir ya). Qué concede cada dígito y por qué 777 da escritura a cualquier usuario del sistema; cómo dar el mínimo.
- **#22 Claves SSH (ssh-keygen/ssh-copy-id)** (Escribir ya). Ed25519, frase de paso y agente: acceso sin contraseña del servidor sin dejar la clave desprotegida.
- **#61 JWT vs cookies HttpOnly/SameSite** (Escribir ya). Qué puede leer un XSS en cada caso y qué cubre SameSite frente a CSRF, con la prueba en el navegador.
- **#65 Rate limiting: token bucket vs leaky bucket** (Escribir ya). Ráfagas permitidas y respuesta 429 medidas con un script de carga.
- **#79 Transient, Scoped y Singleton** (Siguiente tanda). Un Singleton que guarda datos de la petición los comparte entre usuarios; se demuestra con dos sesiones.
- **#95 Fatiga MFA y passkeys** (Siguiente tanda). Por qué se aprueba una notificación por cansancio; coincidencia de números y passkeys.
- **#30 Servicio persistente con systemd** (Siguiente tanda). El servicio con endurecimiento: NoNewPrivileges, ProtectSystem y la nota de systemd-analyze security.
- **#32 COPY vs ADD** (Siguiente tanda). ADD descarga una URL sin verificar su contenido y descomprime tar solo; COPY no hace ninguna de las dos cosas.
- **#71 Copia profunda con structuredClone** (Siguiente tanda). Copia profunda frente a merge ingenuo: contaminación de prototipo con __proto__.
- **#73 tsconfig para producción** (Búsqueda, fuera del núcleo). TypeScript 6.0 declara obsoleto moduleResolution node10 y baseUrl: qué poner según el tipo de proyecto. Fuera del núcleo de seguridad.
- **#75 Module not found en Vite/Webpack/Next** (Búsqueda, fuera del núcleo). Vite 8 con Rolldown: «failed to resolve import» tras actualizar. Competencia de issues y blogs pequeños. Fuera del núcleo de seguridad.
- **#56 401 vs 403** (Dentro de un artículo pendiente). Va dentro del artículo pendiente «ocultar un botón no es un permiso».
- **#72 npm, pnpm y bun** (Sustituir por x1). Compite con el artículo de pnpm. Se sustituye por x1.
- **#49 Inyección SQL y consultas preparadas** (Ya cubierto). Ya lo cubre el punto 3 de «Siete cosas que revisar».
- **#85 Middleware de errores y logging** (Ya cubierto). Ya lo cubre el punto 7 de «Siete cosas que revisar».
- **#89 Bloqueos de cuenta en Active Directory** (Aplazar). Enlaza con la ficha de Directorio Activo.
- **#96 Visor de eventos: 4625 y otros** (Aplazar). Enlaza con la ficha de Directorio Activo.

## Tabla completa

| # | Tema | Enc | Opo | Rep | IG | Dem | Sol | Total | Autocompletado ES/EN | Veredicto |
|---|---|---|---|---|---|---|---|---|---|---|
| 31 | Cannot connect to the Docker daemon | 3 | 2 | 2 | 2 | 2 | 0 | 11 | 10/6 | Escribir ya |
| 41 | Secretos en contenedores | 3 | 2 | 2 | 2 | 2 | 0 | 11 | 10/10 | Escribir ya |
| 55 | Error de CORS | 3 | 2 | 2 | 2 | 2 | 0 | 11 | 10/3 | Escribir ya |
| 60 | SSL certificate problem: self signed certificate | 3 | 2 | 2 | 2 | 2 | 0 | 11 | 10/10 | Escribir ya |
| x1 | npm 12: allowScripts y scripts bloqueados (sale del 72) | 3 | 3 | 2 | 2 | 1 | 0 | 11 | 2/3 | Escribir ya |
| 7 | Dejar de rastrear un archivo (git rm --cached) | 3 | 2 | 2 | 2 | 1 | 0 | 10 | 5/5 | Escribir ya |
| 18 | chmod 777, 755 y 644 | 3 | 1 | 2 | 2 | 2 | 0 | 10 | 10/5 | Escribir ya |
| 22 | Claves SSH (ssh-keygen/ssh-copy-id) | 3 | 1 | 2 | 2 | 2 | 0 | 10 | 10/10 | Escribir ya |
| 61 | JWT vs cookies HttpOnly/SameSite | 3 | 1 | 2 | 2 | 2 | 0 | 10 | 9/10 | Escribir ya |
| 65 | Rate limiting: token bucket vs leaky bucket | 3 | 1 | 2 | 2 | 2 | 0 | 10 | 10/10 | Escribir ya |
| 79 | Transient, Scoped y Singleton | 2 | 1 | 2 | 2 | 2 | 0 | 9 | 10/10 | Siguiente tanda |
| 95 | Fatiga MFA y passkeys | 3 | 1 | 1 | 2 | 2 | 0 | 9 | 2/10 | Siguiente tanda |
| 9 | Revertir un commit ya publicado (git revert) | 2 | 0 | 2 | 2 | 2 | 0 | 8 | 10/10 | Siguiente tanda |
| 28 | Puertos abiertos (ss/netstat) | 2 | 0 | 2 | 2 | 2 | 0 | 8 | 10/10 | Siguiente tanda |
| 30 | Servicio persistente con systemd | 2 | 1 | 2 | 1 | 2 | 0 | 8 | 2/10 | Siguiente tanda |
| 32 | COPY vs ADD | 2 | 1 | 2 | 2 | 1 | 0 | 8 | 2/3 | Siguiente tanda |
| 37 | Redes en docker-compose | 2 | 1 | 2 | 1 | 2 | 0 | 8 | 10/10 | Siguiente tanda |
| 38 | Compilación por etapas | 2 | 0 | 2 | 2 | 2 | 0 | 8 | 10/10 | Siguiente tanda |
| 71 | Copia profunda con structuredClone | 2 | 1 | 2 | 1 | 2 | 0 | 8 | 10/10 | Siguiente tanda |
| 73 | tsconfig para producción | 1 | 3 | 2 | 1 | 2 | 0 | 9 | 10/10 | Búsqueda, fuera del núcleo |
| 75 | Module not found en Vite/Webpack/Next | 1 | 3 | 2 | 1 | 2 | 0 | 9 | 10/10 | Búsqueda, fuera del núcleo |
| 56 | 401 vs 403 | 3 | 1 | 2 | 2 | 2 | -2 | 8 | 10/10 | Dentro de un artículo pendiente |
| 72 | npm, pnpm y bun | 3 | 3 | 2 | 2 | 2 | -2 | 10 | 10/8 | Sustituir por x1 |
| 49 | Inyección SQL y consultas preparadas | 3 | 0 | 2 | 2 | 2 | -2 | 7 | 5/10 | Ya cubierto |
| 85 | Middleware de errores y logging | 2 | 0 | 2 | 1 | 2 | -2 | 5 | 0/10 | Ya cubierto |
| 23 | 2>&1 y /dev/null | 1 | 1 | 2 | 2 | 2 | 0 | 8 | 10/10 | Solo Instagram |
| 1 | Deshacer el último commit (reset --soft/--hard) | 1 | 0 | 2 | 2 | 2 | 0 | 7 | 3/10 | Solo Instagram |
| 2 | Eliminar rama local y remota | 1 | 0 | 2 | 2 | 2 | 0 | 7 | 3/10 | Solo Instagram |
| 5 | Deshacer git add (restore --staged) | 1 | 0 | 2 | 2 | 2 | 0 | 7 | 2/10 | Solo Instagram |
| 10 | Resolver o abortar un conflicto de fusión | 1 | 0 | 2 | 2 | 2 | 0 | 7 | 8/10 | Solo Instagram |
| 17 | Buscar texto en archivos (grep/find) | 1 | 0 | 2 | 2 | 2 | 0 | 7 | 9/10 | Solo Instagram |
| 19 | Matar el proceso que ocupa un puerto | 1 | 0 | 2 | 2 | 2 | 0 | 7 | 2/10 | Solo Instagram |
| 33 | CMD vs ENTRYPOINT | 1 | 0 | 2 | 2 | 2 | 0 | 7 | 10/10 | Solo Instagram |
| 57 | 502, 503 y 504 | 1 | 0 | 2 | 2 | 2 | 0 | 7 | 8/10 | Solo Instagram |
| 3 | git fetch vs git pull | 1 | 0 | 1 | 2 | 2 | 0 | 6 | 2/10 | Solo Instagram |
| 12 | merge vs rebase | 1 | 0 | 1 | 2 | 2 | 0 | 6 | 10/10 | Solo Instagram |
| 40 | ClusterIP, NodePort e Ingress | 2 | 0 | 1 | 2 | 1 | 0 | 6 | 2/4 | Solo Instagram |
| 58 | POST, PUT y PATCH | 1 | 0 | 1 | 2 | 2 | 0 | 6 | 2/10 | Solo Instagram |
| 63 | Proxy inverso vs balanceador | 1 | 0 | 1 | 2 | 2 | 0 | 6 | 0/10 | Solo Instagram |
| 64 | WebSockets vs SSE vs long polling | 1 | 0 | 1 | 2 | 2 | 0 | 6 | 10/10 | Solo Instagram |
| 76 | Promise.all, allSettled y race | 0 | 0 | 2 | 2 | 2 | 0 | 6 | 10/10 | Solo Instagram |
| 94 | ZTNA vs VPN | 2 | 0 | 0 | 2 | 2 | 0 | 6 | 10/10 | Solo Instagram |
| 24 | Variables de entorno persistentes | 2 | 0 | 2 | 1 | 2 | 0 | 7 | 10/10 | Aplazar |
| 26 | crontab que no se ejecuta | 1 | 1 | 2 | 1 | 2 | 0 | 7 | 2/10 | Aplazar |
| 35 | volumes vs bind mounts | 2 | 0 | 2 | 1 | 2 | 0 | 7 | 10/10 | Aplazar |
| 36 | Exit code 0 vs 137 (OOM) | 1 | 1 | 2 | 1 | 2 | 0 | 7 | 10/10 | Aplazar |
| 46 | EXPLAIN ANALYZE | 1 | 1 | 2 | 1 | 2 | 0 | 7 | 10/10 | Aplazar |
| 48 | Paginación OFFSET vs keyset | 1 | 1 | 2 | 1 | 2 | 0 | 7 | 1/10 | Aplazar |
| 50 | Deadlocks en la base de datos | 1 | 1 | 2 | 1 | 2 | 0 | 7 | 2/10 | Aplazar |
| 53 | Pool de conexiones agotado | 1 | 1 | 2 | 1 | 2 | 0 | 7 | 10/10 | Aplazar |
| 89 | Bloqueos de cuenta en Active Directory | 2 | 1 | 1 | 1 | 2 | 0 | 7 | 1/10 | Aplazar |
| 90 | Fugas DNS en VPN y split tunneling | 2 | 1 | 1 | 1 | 2 | 0 | 7 | 0/10 | Aplazar |
| 96 | Visor de eventos: 4625 y otros | 2 | 1 | 1 | 1 | 2 | 0 | 7 | 5/10 | Aplazar |
| 4 | Renombrar una rama y sincronizarla | 1 | 0 | 2 | 1 | 2 | 0 | 6 | 7/10 | Aplazar |
| 8 | git clean | 1 | 0 | 2 | 1 | 2 | 0 | 6 | 10/10 | Aplazar |
| 13 | git stash | 1 | 0 | 2 | 1 | 2 | 0 | 6 | 10/10 | Aplazar |
| 14 | cherry-pick | 1 | 0 | 2 | 1 | 2 | 0 | 6 | 10/10 | Aplazar |
| 15 | HEAD detached | 1 | 0 | 2 | 1 | 2 | 0 | 6 | 10/10 | Aplazar |
| 20 | Espacio en disco (df/du) | 1 | 0 | 2 | 1 | 2 | 0 | 6 | 10/10 | Aplazar |
| 21 | Procesos que sobreviven al cerrar SSH | 1 | 0 | 2 | 1 | 2 | 0 | 6 | 10/4 | Aplazar |
| 27 | curl vs wget | 1 | 0 | 2 | 1 | 2 | 0 | 6 | 1/10 | Aplazar |
| 34 | docker system prune | 1 | 0 | 2 | 1 | 2 | 0 | 6 | 10/10 | Aplazar |
| 39 | CrashLoopBackOff | 1 | 0 | 2 | 1 | 2 | 0 | 6 | 10/10 | Aplazar |
| 45 | DROP, TRUNCATE y DELETE | 1 | 0 | 2 | 1 | 2 | 0 | 6 | 3/10 | Aplazar |
| 62 | Propagación DNS (dig/nslookup) | 1 | 0 | 2 | 1 | 2 | 0 | 6 | 10/10 | Aplazar |
| 78 | .Result/.Wait() y deadlocks | 1 | 1 | 2 | 1 | 1 | 0 | 6 | 3/3 | Aplazar |
| 83 | Consultas N+1 | 1 | 0 | 2 | 1 | 2 | 0 | 6 | 10/10 | Aplazar |
| 6 | git switch vs checkout | 1 | 0 | 1 | 1 | 2 | 0 | 5 | 10/10 | Descartar por ahora |
| 11 | git commit --amend | 1 | 0 | 2 | 1 | 1 | 0 | 5 | 5/5 | Descartar por ahora |
| 16 | Salir de Vim | 0 | 0 | 1 | 2 | 2 | 0 | 5 | 10/10 | Descartar por ahora |
| 25 | CPU y memoria en tiempo real | 1 | 0 | 1 | 1 | 2 | 0 | 5 | 4/10 | Descartar por ahora |
| 29 | tar.gz, tar.bz2 y zip | 0 | 0 | 2 | 1 | 2 | 0 | 5 | 10/10 | Descartar por ahora |
| 42 | docker save/load | 0 | 1 | 2 | 0 | 2 | 0 | 5 | 10/10 | Descartar por ahora |
| 43 | Tipos de JOIN | 0 | 0 | 1 | 2 | 2 | 0 | 5 | 10/10 | Descartar por ahora |
| 44 | WHERE vs HAVING | 0 | 0 | 1 | 2 | 2 | 0 | 5 | 6/10 | Descartar por ahora |
| 47 | Índices B-Tree, Hash y compuestos | 1 | 0 | 1 | 1 | 2 | 0 | 5 | 1/10 | Descartar por ahora |
| 59 | REST vs GraphQL vs gRPC | 1 | 0 | 0 | 2 | 2 | 0 | 5 | 10/10 | Descartar por ahora |
| 66 | == vs === | 0 | 0 | 1 | 2 | 2 | 0 | 5 | 10/10 | Descartar por ahora |
| 67 | var, let y const | 0 | 0 | 1 | 2 | 2 | 0 | 5 | 3/10 | Descartar por ahora |
| 69 | Event loop | 0 | 0 | 1 | 2 | 2 | 0 | 5 | 10/10 | Descartar por ahora |
| 70 | null vs undefined | 0 | 0 | 1 | 2 | 2 | 0 | 5 | 2/9 | Descartar por ahora |
| 74 | interface vs type | 0 | 0 | 1 | 2 | 2 | 0 | 5 | 10/10 | Descartar por ahora |
| 77 | CSR, SSR y SSG | 1 | 0 | 0 | 2 | 2 | 0 | 5 | 10/8 | Descartar por ahora |
| 84 | Garbage collector y fugas de memoria | 1 | 0 | 1 | 1 | 2 | 0 | 5 | 0/10 | Descartar por ahora |
| 87 | Hexagonal vs Clean Architecture | 1 | 0 | 0 | 2 | 2 | 0 | 5 | 1/10 | Descartar por ahora |
| 88 | Circuit Breaker | 1 | 0 | 1 | 1 | 2 | 0 | 5 | 5/10 | Descartar por ahora |
| 93 | APIPA 169.254.x.x | 0 | 1 | 1 | 1 | 2 | 0 | 5 | 10/10 | Descartar por ahora |
| 98 | BitLocker y TPM | 1 | 1 | 0 | 1 | 2 | 0 | 5 | 10/10 | Descartar por ahora |
| 100 | RTO vs RPO | 1 | 0 | 0 | 2 | 2 | 0 | 5 | 10/10 | Descartar por ahora |
| 52 | CHAR, VARCHAR y TEXT | 0 | 0 | 1 | 1 | 2 | 0 | 4 | 10/6 | Descartar por ahora |
| 68 | Eliminar un elemento de un array | 0 | 0 | 1 | 1 | 2 | 0 | 4 | 8/10 | Descartar por ahora |
| 80 | if __name__ == '__main__' | 0 | 0 | 1 | 1 | 2 | 0 | 4 | 10/10 | Descartar por ahora |
| 81 | yield y generadores | 0 | 0 | 1 | 1 | 2 | 0 | 4 | 10/10 | Descartar por ahora |
| 51 | Normalización 3NF | 0 | 0 | 0 | 1 | 2 | 0 | 3 | 8/10 | Descartar por ahora |
| 54 | Procedimientos almacenados vs ORM | 1 | 0 | 0 | 1 | 1 | 0 | 3 | 0/3 | Descartar por ahora |
| 82 | Valor vs referencia | 0 | 0 | 0 | 1 | 2 | 0 | 3 | 10/7 | Descartar por ahora |
| 86 | Herencia, composición e interfaces | 0 | 0 | 0 | 1 | 2 | 0 | 3 | 2/10 | Descartar por ahora |
| 92 | Archivos .ost/.pst | 0 | 1 | 0 | 0 | 2 | 0 | 3 | 3/10 | Descartar por ahora |
| 97 | Cola de impresión (Spooler) | 0 | 1 | 0 | 0 | 2 | 0 | 3 | 10/10 | Descartar por ahora |
| 91 | Pantallas azules (minidumps) | 0 | 1 | 0 | 0 | 1 | 0 | 2 | 0/1 | Descartar por ahora |
| 99 | Costos en la nube | 0 | 0 | 0 | 1 | 1 | 0 | 2 | 0/3 | Descartar por ahora |

## Fuentes consultadas

- npm 12: [GitHub Changelog, 9 jun 2026](https://github.blog/changelog/2026-06-09-upcoming-breaking-changes-for-npm-v12/), [InfoQ, ago 2026](https://www.infoq.com/news/2026/08/npm-12-released/).
- TypeScript 6.0: [notas de la versión](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-6-0.html).
- Vite 8: [issue #22410](https://github.com/vitejs/vite/issues/22410), [discusión #22377](https://github.com/vitejs/vite/discussions/22377).
- Secretos en Docker: [build check SecretsUsedInArgOrEnv](https://docs.docker.com/reference/build-checks/secrets-used-in-arg-or-env/).

Siguiente paso: validar en Bing Webmaster Tools, en español y en inglés, los temas de «Escribir ya» antes de redactar.
