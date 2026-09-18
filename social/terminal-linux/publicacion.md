# Aprende a usar la terminal de Linux

Carrusel explicativo, solo de Instagram, preparado el 16 de septiembre de 2026. Las seis láminas están en `png/`, numeradas en el orden de subida.

Van 20 órdenes y símbolos, y el resumen los repite todos:
- **Moverse:** `pwd`, `ls`, `cd`, `~` y `..`.
- **Archivos:** `mkdir`, `touch`, `cp`, `mv` y `rm`.
- **Leer y buscar:** `cat`, `less`, `tail`, `grep` y `find`.
- **Redirigir:** `>`, `>>`, `2>`, `2>&1` y `|`.

Los permisos quedan fuera porque ya los explica `permisos-linux/`, y el texto de la publicación remite a él. Cada orden de las láminas se ejecutó en Bash 5.2 (Git Bash) con GNU coreutils 8.32, grep 3.0 y findutils 4.10.0 antes de escribirla.

## Portada

- **Color: oliva.** Es un tono nuevo de la paleta (`olive`), con el ámbar de acento. Ninguna portada publicada ni en cola es de ese color, y el verde bosque de `codigos-http/` queda a dos filas.
- **Encuadre.** El título ocupa dos renglones, y todo el contenido va de 168 a 912 px, dentro del recorte de la cuadrícula.
- **«de Linux».** Va en el título porque «terminal» sola también nombra los datáfonos en las búsquedas.

## Texto de la publicación

```
¿Cómo se usa la terminal de Linux? 🐧⌨️

Con unas pocas órdenes ya puedes moverte entre carpetas, crear y borrar archivos, buscar texto y guardar el resultado en un archivo. También funcionan en Git Bash, en Windows.

En este carrusel te comparto 20 órdenes y símbolos, qué hace cada uno y una lámina final para guardarlos.

⚠️ Un detalle de seguridad: curl https://… | bash descarga un script y lo ejecuta sin que lo leas. Guárdalo antes en un archivo, léelo y después ejecútalo.

💡 ¿Y los permisos, como chmod 755? Están en el carrusel de permisos en Linux del perfil.

👉 ¡Desliza y guarda la última lámina!
🔗 Más sobre programación y seguridad en alexherrera.dev/es/blog (link en bio).

¿Qué orden de la terminal usas más? ¡Te leo en los comentarios! 👇💬

#Linux #Terminal #Programacion #Bash
```

Sigue el estilo de las publicaciones anteriores de la cuenta: pregunta de gancho con emoji, «En este carrusel te comparto…», 👉 y 🔗 con «(link en bio)», una pregunta para los comentarios y cuatro hashtags.

## Historia del mismo día

- **Qué se publica.** La publicación compartida en la historia, con el texto «¿Qué hace 2>&1?».
- **Adhesivo de enlace.** Con el texto «Más en el blog» y esta dirección:
  `https://www.alexherrera.dev/es/blog?utm_source=instagram&utm_medium=story&utm_campaign=terminal-linux`

El temario enlaza este carrusel con «Cómo proteger un servidor Linux», que está sin escribir, así que la historia lleva al índice del blog, como la de `puertos/`.

## Programación

Programado en Meta Business Suite el 17 de septiembre de 2026 para el lunes 5 de octubre, 7:00 p. m., la hora que Meta sugería para los lunes. La historia se sube a mano ese mismo día.

## Auditoría

Las órdenes se ejecutaron el 16 de septiembre de 2026 en una carpeta de prueba. La ayuda citada es la de cada herramienta (`--help` o `help`).

| Afirmación | Comprobación | Veredicto |
|---|---|---|
| `pwd` muestra la ruta de la carpeta actual | `help pwd`: «Print the name of the current working directory». Ejecutado | Correcta |
| `ls` lista el contenido; `-a` añade los ocultos y `-l`, los detalles | `ls --help`: lista la carpeta actual por defecto; `-a` «do not ignore entries starting with .»; `-l` «use a long listing format» | Correcta |
| `cd carpeta` entra en ella, y `cd` solo vuelve a la carpeta personal | `help cd`: «The default DIR is the value of the HOME shell variable». Ejecutado: `cd` llevó a `/c/Users/alexh` | Correcta |
| `~` es la carpeta personal | Manual de Bash §3.5.2: la tilde se sustituye por el valor de `HOME` | Correcta |
| `..` es la carpeta de arriba y `.`, la actual | POSIX: «dot-dot» y «dot» (resolución de rutas, §4.16). Ejecutado `cd ..` | Correcta |
| `mkdir -p a/b` crea también las intermedias | `mkdir --help`: «make parent directories as needed». Ejecutado | Correcta |
| `touch` crea un archivo vacío, y si existe solo le actualiza la fecha | `touch --help`: actualiza las fechas de acceso y modificación, y crea vacío el que no existe. Ejecutado: la hora pasó de 23:28:50 a 23:28:51 | Correcta |
| `cp` duplica un archivo, y una carpeta necesita `-r` | `cp --help`: «-R, -r, --recursive copy directories recursively». Ejecutado: sin `-r`, «cp: -r not specified; omitting directory» | Correcta |
| `mv` mueve o renombra | `mv --help`: «Rename SOURCE to DEST, or move SOURCE(s) to DIRECTORY». Ejecutado | Correcta |
| `rm` no pasa por la papelera; `rm -r` borra una carpeta y su contenido | `rm --help`: «Remove (unlink) the FILE(s)» y «-r… remove directories and their contents recursively». Ejecutado | Correcta. La ayuda añade que a veces se puede recuperar parte del contenido con técnicas forenses |
| `cat` imprime el archivo entero | `cat --help`: «Concatenate FILE(s) to standard output» | Correcta |
| `less` avanza con la barra espaciadora y se sale con `q` | `less --help`: «SPACE… Forward one window» y «q… Exit» | Correcta |
| `tail -n 20` enseña las últimas 20 líneas, y `-f` sigue las nuevas | `tail --help`: «-n… output the last NUM lines» y «-f… output appended data as the file grows». Ejecutado `tail -n 2` | Correcta |
| `grep -r "TODO" .` busca en la carpeta y en las de dentro | `grep --help`: «-r, --recursive». Ejecutado: encontró `./log.txt:TODO x` | Correcta |
| `find . -name "*.log"` lista los que terminan en .log | `find --help`: `-name PATTERN`, con la carpeta actual por defecto. Ejecutado con `*.txt` | Correcta |
| `>` crea el archivo o reemplaza lo que tenía | Manual de Bash §3.6.2: «If the file does not exist it is created; if it does exist it is truncated to zero size». Ejecutado | Correcta |
| `>>` escribe detrás de lo que había | Manual de Bash §3.6.3 (añadir). Ejecutado: el archivo quedó con «dos» y «tres» | Correcta |
| Los errores van por otro canal, y `2>` los guarda aparte | Manual de Bash §3.6: el descriptor 2 es la salida de errores. Ejecutado: `ls noexiste > out.txt 2> err.txt` dejó el error solo en `err.txt` | Correcta |
| `orden > log.txt 2>&1` guarda las dos cosas, y el orden importa | Manual de Bash §3.6: `ls > dirlist 2>&1` manda las dos a `dirlist`, y `ls 2>&1 > dirlist` solo la salida normal. Ejecutado en los dos órdenes | Correcta |
| `\|` pasa la salida de una orden a la siguiente | Manual de Bash §3.2.3: «The output of each command in the pipeline is connected via a pipe to the input of the next command». Ejecutado `ls \| grep txt` | Correcta |
| Las órdenes también funcionan en Git Bash, en Windows | Todas se ejecutaron ahí para esta auditoría | Correcta |
| `curl … \| bash` ejecuta el script sin que se lea | Manual de Bash §3.2.3: la salida de `curl` entra directamente en `bash` | Correcta |

Fuentes:
- Ayuda de GNU coreutils 8.32, grep 3.0, findutils 4.10.0 y less 668, y `help` de Bash 5.2
- Manual de Bash: [redirecciones](https://www.gnu.org/software/bash/manual/html_node/Redirections.html), [tuberías](https://www.gnu.org/software/bash/manual/html_node/Pipelines.html) y [expansión de la tilde](https://www.gnu.org/software/bash/manual/html_node/Tilde-Expansion.html)
- [POSIX, definiciones](https://pubs.opengroup.org/onlinepubs/9799919799/basedefs/V1_chap03.html)
