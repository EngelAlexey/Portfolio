# ¿Cómo se configuran los permisos en Linux?

Carrusel explicativo, solo de Instagram, preparado el 16 de septiembre de 2026. Las seis láminas están en `png/`, numeradas en el orden de subida.

Van 18 filas. El resumen repite 17 y cambia la fila «de tres en tres» por `ls -l`, la orden que la enseña:
- **Letras:** r, w, x y -.
- **Usuarios:** u, g, o, a y la lectura de tres en tres.
- **Números:** 644, 755, 600, 700 y 777.
- **Órdenes:** `chmod`, `chown`, `-R` y `umask`.

## Portada

- **Color: azul petróleo.** Ninguna portada publicada ni en cola usa ese color.
- **Encuadre.** El título ocupa cuatro renglones, y todo el contenido va de 168 a 912 px, dentro del recorte de la cuadrícula.

## Texto de la publicación

```
¿Cómo se configuran los permisos en Linux? 🐧🔐

Cada archivo define quién puede leerlo (r = 4), modificarlo (w = 2) y ejecutarlo (x = 1), para el dueño, el grupo y los demás. Por eso 644 significa: el dueño lee y escribe, y el resto solo lee.

En este carrusel te comparto las letras, los tipos de usuario, los números 644, 755, 600, 700 y 777, y las órdenes chmod, chown y umask.

⚠️ Un detalle de seguridad: los permisos te protegen de otros usuarios, no de los programas que ejecutas tú. Un script de instalación de npm corre con tus permisos y puede leer lo mismo que tú.

👉 ¡Desliza para ver cómo se calculan!
🔗 Cómo bloquear esos scripts, en alexherrera.dev/es/blog/npm-vs-pnpm-seguridad (link en bio).

¿Alguna vez usaste chmod 777 para salir del paso? ¡Te leo en los comentarios! 👇💬

#Linux #Ciberseguridad #Programacion #Terminal
```

Sigue el estilo de las publicaciones anteriores de la cuenta: pregunta de gancho con emoji, «En este carrusel te comparto…», 👉 y 🔗 con «(link en bio)», una pregunta para los comentarios y cuatro hashtags.

## Historia del mismo día

- **Qué se publica.** La publicación compartida en la historia, con el texto «Tus permisos no te protegen de tus propios programas».
- **Adhesivo de enlace.** Con el texto «Leer el artículo» y esta dirección, que apunta a la sección 1. No está comprobado que el navegador de Instagram baje hasta ella; como mínimo abre el artículo:
  `https://www.alexherrera.dev/es/blog/npm-vs-pnpm-seguridad?utm_source=instagram&utm_medium=story&utm_campaign=permisos-linux#1-la-instalaci%C3%B3n-ejecuta-c%C3%B3digo-de-terceros`
- **Después.** Guardar la historia en la destacada del artículo.

El temario enlaza este carrusel con «Cómo proteger un servidor Linux», que está sin escribir. La sección 1 del artículo de npm explica qué alcanza el permiso con el que corre un script de instalación, que es el matiz del texto de la publicación.

## Programación

Programado en Meta Business Suite para el miércoles 30 de septiembre de 2026, 1:00 a. m., la hora que Meta sugería para los miércoles. La historia se sube a mano ese mismo día.

## Auditoría

| Afirmación | Comprobación | Veredicto |
|---|---|---|
| r: leer; en una carpeta, listar | GNU coreutils, «Mode Structure»: «For directories, this means permission to list the contents» | Correcta |
| w: modificar; en una carpeta, crear y borrar archivos | GNU coreutils: «permission to create and remove files in the directory» | Correcta |
| x: ejecutar; en una carpeta, entrar en ella | GNU coreutils: «permission to access files in the directory» | Correcta, simplificada |
| -: permiso no concedido | POSIX, `ls`: «if '-', the file is not readable», y lo mismo para w y x | Correcta |
| u dueño, g grupo, o otros | GNU coreutils: el dueño, los usuarios del grupo del archivo y todos los demás | Correcta |
| a: los tres a la vez, como en `chmod a+r` | GNU coreutils, «Setting Permissions»: «a: all users; the same as ugo» | Correcta |
| `ls -l`: tras el tipo de archivo van dueño, grupo y otros | POSIX, `ls`: el tipo de entrada y luego tres campos de tres caracteres (dueño, grupo y otros) | Correcta |
| r = 4, w = 2, x = 1 | POSIX, `chmod`: 0400, 0200 y 0100 para el dueño, y lo mismo por grupo y otros | Correcta |
| 644, 755, 600, 700 y 777: lo que concede cada uno | Suma de los valores anteriores | Correcta |
| Una clave SSH va con 600 | ssh(1): las claves privadas deben ser legibles por el usuario y no accesibles por otros | Correcta |
| ~/.ssh va con 700 | ssh(1): «recommended permissions are read/write/execute for the user, and not accessible by others» | Correcta |
| ssh ignora una clave con 777 | ssh(1): «ssh will simply ignore a private key file if it is accessible by others» | Correcta |
| `chmod 644` y `chmod u+x` | GNU coreutils: modos numéricos y simbólicos | Correcta |
| `chown ana:dev`; cambiar el dueño pide privilegios | chown(2): «Only a privileged process… may change the owner of a file» | Correcta |
| `-R` aplica el cambio a todo lo que contiene la carpeta | GNU coreutils, `chmod`: «Recursively change permissions of directories and their contents» | Correcta |
| Con umask 022, los archivos nacen con 644 y las carpetas con 755 | POSIX: `touch` crea con 0666 y `mkdir` con 0777, y la máscara quita 022 | Correcta. Otros programas pueden crear archivos con otro modo |
| Los permisos protegen de otros usuarios, no de los programas que ejecutas tú | credentials(7): un proceso hijo hereda los identificadores de usuario y grupo de su padre. Artículo de npm, sección 1 | Correcta |

Fuentes:
- [GNU coreutils, File permissions](https://www.gnu.org/software/coreutils/manual/html_node/File-permissions.html)
- [POSIX, chmod](https://pubs.opengroup.org/onlinepubs/9799919799/utilities/chmod.html), [ls](https://pubs.opengroup.org/onlinepubs/9799919799/utilities/ls.html), [touch](https://pubs.opengroup.org/onlinepubs/9799919799/utilities/touch.html) y [mkdir](https://pubs.opengroup.org/onlinepubs/9799919799/utilities/mkdir.html)
- [chown(2)](https://man7.org/linux/man-pages/man2/chown.2.html) y [credentials(7)](https://man7.org/linux/man-pages/man7/credentials.7.html)
- [ssh(1)](https://man.openbsd.org/ssh.1)
