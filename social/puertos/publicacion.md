# ¿Qué es un puerto de red?

Carrusel explicativo, solo de Instagram, preparado el 16 de septiembre de 2026. Las seis láminas están en `png/`, numeradas en el orden de subida.

Van 19 términos:
- **Rangos:** del sistema, registrados, dinámicos, y TCP/UDP.
- **Servicios:** 22, 25, 53, 80 y 443.
- **Datos y desarrollo:** 3306, 5432, 6379, 3000 y 5173.
- **Revisar:** `ss -tuln`, `netstat -ano`, 127.0.0.1, 0.0.0.0 y firewall.

## Portada

- **Color: carmín.** Es un tono nuevo de la paleta, y ninguna portada publicada es roja. El naranja profundo quedó descartado porque se lee como café.
- **Encuadre.** El contenido va de 168 a 912 px, dentro del recorte de la cuadrícula.

## Texto de la publicación

```
¿Qué es un puerto de red y para qué sirve? 🔌🔐

La IP lleva al equipo, y el puerto, al programa que atiende dentro: el 443 lleva a la web cifrada, el 22 a SSH y el 5432 a PostgreSQL.

En este carrusel te comparto los rangos de puertos, los de los servicios conocidos, los de bases de datos y desarrollo, y cómo cerrar los que no usas.

⚠️ Un detalle de seguridad: MySQL escucha por defecto en todas las interfaces del equipo, mientras que PostgreSQL solo acepta conexiones del propio equipo.

💡 Revisa los tuyos con ss -tuln en Linux o netstat -ano en Windows.

👉 ¡Desliza y guarda la última lámina!
🔗 Más sobre programación y seguridad en alexherrera.dev/es/blog (link en bio).

¿Cuál de estos puertos usas más? ¡Te leo en los comentarios! 👇💬

#Redes #Ciberseguridad #Programacion #Servidores
```

Sigue el estilo de las publicaciones anteriores de la cuenta: pregunta de gancho con emoji, «En este carrusel te comparto…», 👉 y 🔗 con «(link en bio)», una pregunta para los comentarios y cuatro hashtags.

## Historia del mismo día

- **Qué se publica.** La publicación compartida en la historia, con el texto «¿Qué puertos tienes abiertos?».
- **Adhesivo de enlace.** Con el texto «Más en el blog» y esta dirección:
  `https://www.alexherrera.dev/es/blog?utm_source=instagram&utm_medium=story&utm_campaign=puertos`

El temario enlaza este carrusel con «Cómo proteger un servidor Linux», que está sin escribir, así que la historia lleva al índice del blog.

## Programación

Programado en Meta Business Suite para el viernes 25 de septiembre de 2026, 1:00 p. m., la hora que Meta sugería para los viernes. La historia se sube a mano ese mismo día.

## Auditoría

| Afirmación | Comprobación | Veredicto |
|---|---|---|
| Un puerto es un número del 0 al 65535 | RFC 9293 y RFC 768: campos de puerto de 16 bits; RFC 6335 §6 | Correcta |
| Del 0 al 1023, los del sistema o conocidos | RFC 6335 §6: «System Ports, also known as the Well Known Ports, from 0-1023» | Correcta |
| En Linux, abrir uno pide privilegios | capabilities(7): `CAP_NET_BIND_SERVICE` para los puertos por debajo de 1024 | Correcta |
| Hasta el 49151, los registrados, que IANA asigna a aplicaciones como MySQL | RFC 6335 §6 («User Ports… 1024-49151, assigned by IANA») y el registro de IANA (3306, mysql) | Correcta |
| Hasta el 65535, los dinámicos, que IANA no asigna nunca | RFC 6335 §6: «Dynamic Ports… 49152-65535 (never assigned)» | Correcta |
| Cada número existe en TCP y en UDP, y se registra por separado | Registro de IANA: una fila por protocolo (el 6379 es redis en TCP y está reservado en UDP) | Correcta |
| 22 SSH, 25 SMTP, 53 DNS, 80 HTTP y 443 HTTPS | Registro de IANA: ssh, smtp, domain, http y https | Correcta |
| 443: la web cifrada con TLS | IANA: «http protocol over TLS/SSL»; RFC 9110 §4.2.2 | Correcta |
| 3306 MySQL, 5432 PostgreSQL y 6379 Redis | Registro de IANA: mysql, postgresql y redis | Correcta |
| MySQL escucha por defecto en todas las interfaces | Manual de MySQL 8.4: `bind_address`, valor por defecto `*` | Correcta |
| PostgreSQL por defecto solo acepta conexiones del propio equipo | Documentación de PostgreSQL: `listen_addresses`, «The default value is localhost» | Correcta |
| La documentación de Redis desaconseja exponerlo a internet | Redis, «Security»: «not a good idea to expose the Redis instance directly to the internet» | Correcta |
| 3000: el servidor de desarrollo de Next.js, e IANA lo tiene asignado a otro servicio | Documentación de `next dev` («Default: 3000») y registro de IANA (3000, hbci) | Correcta |
| 5173: Vite; si está ocupado, prueba el siguiente | Documentación de Vite: `server.port`, «Default: 5173», y prueba el siguiente puerto libre | Correcta |
| `ss -tuln` lista los puertos TCP y UDP que escuchan | ss(8): `-t`, `-u`, `-l` (solo los que escuchan) y `-n` (sin resolver nombres) | Correcta |
| `netstat -ano` hace lo mismo y añade el proceso | Microsoft: `-a` (conexiones y puertos a la escucha), `-n` (números) y `-o` (PID) | Correcta |
| 127.0.0.1: lo que escucha ahí no se ve desde fuera | RFC 1122 §3.2.1.3 | Correcta |
| 0.0.0.0: escucha en cualquier dirección del equipo | ip(7): INADDR_ANY enlaza a todas las interfaces locales | Correcta |
| Un firewall bloquea las conexiones de fuera a los puertos que no deben recibirlas | Definición general, sin cifras | Correcta |

Fuentes:
- [RFC 6335](https://www.rfc-editor.org/rfc/rfc6335), [RFC 9293](https://www.rfc-editor.org/rfc/rfc9293) y [RFC 768](https://www.rfc-editor.org/rfc/rfc768)
- [Registro de puertos de IANA](https://www.iana.org/assignments/service-names-port-numbers/service-names-port-numbers.xhtml)
- [capabilities(7)](https://man7.org/linux/man-pages/man7/capabilities.7.html)
- [MySQL, bind_address](https://dev.mysql.com/doc/refman/8.4/en/server-system-variables.html#sysvar_bind_address)
- [PostgreSQL, listen_addresses](https://www.postgresql.org/docs/current/runtime-config-connection.html)
- [Redis, Security](https://redis.io/docs/latest/operate/oss_and_stack/management/security/)
- [Next.js, next CLI](https://nextjs.org/docs/app/api-reference/cli/next)
- [Vite, server.port](https://vite.dev/config/server-options)
- [ss(8)](https://man7.org/linux/man-pages/man8/ss.8.html)
- [netstat, Microsoft](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/netstat)
- [RFC 1122](https://www.rfc-editor.org/rfc/rfc1122) e [ip(7)](https://man7.org/linux/man-pages/man7/ip.7.html)
