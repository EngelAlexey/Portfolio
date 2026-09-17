# ¿Qué es una dirección IP?

Carrusel explicativo, solo de Instagram, preparado el 16 de septiembre de 2026. Las seis láminas están en `png/`, numeradas en el orden de subida.

Van 17 términos:
- **Versiones:** IPv4, IPv6, /24 y DHCP.
- **Privadas y públicas:** 10, 172.16, 192.168, NAT y pública.
- **Especiales:** 127.0.0.1, ::1, 0.0.0.0 y 169.254.
- **Ver la tuya:** Windows, Linux, macOS y la pública.

Las direcciones de ejemplo son privadas o de documentación (`2001:db8::`), para no señalar a nadie.

## Portada

- **Color: verde azulado.** Ninguna portada publicada ni en cola usa ese color.
- **Encuadre.** El contenido va de 168 a 912 px, dentro del recorte de la cuadrícula.

## Texto de la publicación

```
¿Qué es una dirección IP y para qué sirve? 🌍📡

Es el número que identifica a cada equipo en una red. En una red de casa con NAT, tu equipo usa una IP privada y el router sale a internet con una pública.

En este carrusel te comparto las dos versiones (IPv4 e IPv6), las IP privadas, las direcciones especiales como 127.0.0.1 y cómo ver la tuya en Windows, Linux y macOS.

💡 Un detalle que confunde al programar: un servidor que escucha en 127.0.0.1 solo se ve desde tu equipo. Uno que escucha en 0.0.0.0 recibe conexiones por cualquier interfaz, incluida la de tu red.

👉 ¡Desliza y guarda la última lámina como referencia!
🔗 Más sobre programación y seguridad en alexherrera.dev/es/blog (link en bio).

¿Alguna vez te apareció una IP 169.254? ¡Te leo en los comentarios! 👇💬

#Redes #Programacion #Ciberseguridad #Tecnologia
```

Sigue el estilo de las publicaciones anteriores de la cuenta: pregunta de gancho con emoji, «En este carrusel te comparto…», 👉 y 🔗 con «(link en bio)», una pregunta para los comentarios y cuatro hashtags.

«Qué es una dirección IP y para qué sirve» es una de las frases que sugiere el autocompletado.

## Historia del mismo día

- **Qué se publica.** La publicación compartida en la historia, con el texto «¿127.0.0.1 o 0.0.0.0?».
- **Adhesivo de enlace.** Con el texto «Más en el blog» y esta dirección:
  `https://www.alexherrera.dev/es/blog?utm_source=instagram&utm_medium=story&utm_campaign=direccion-ip`

No hay un artículo sobre redes, así que la historia lleva al índice del blog y no promete un artículo concreto.

## Programación

Programado en Meta Business Suite para el miércoles 23 de septiembre de 2026, 1:00 a. m., sugerida por Meta. La historia se sube a mano ese mismo día.

## Auditoría

| Afirmación | Comprobación | Veredicto |
|---|---|---|
| IPv4: cuatro números del 0 al 255 | RFC 791: «four octets (32 bits)» | Correcta |
| Hay unos 4300 millones | 2³² = 4 294 967 296 | Correcta |
| IPv6: ocho grupos en hexadecimal, como 2001:db8::1 | RFC 4291 §2.2 («x:x:x:x:x:x:x:x», de uno a cuatro dígitos hexadecimales) y RFC 3849 (2001:db8::/32 es el prefijo de documentación) | Correcta |
| «::» resume los ceros | RFC 5952 §4.2.1: se acorta todo lo posible | Correcta |
| /24: los 24 primeros bits son de la red | RFC 4632 §3.1, con el ejemplo 192.168.99.0/24 | Correcta |
| DHCP reparte las IP de forma automática | RFC 2131: «automatic allocation of reusable network addresses» | Correcta |
| 10, 172.16–172.31 y 192.168 son privadas | RFC 1918 §3 | Correcta |
| NAT hace que la red salga con una sola IP pública | RFC 3022: NAPT traduce muchas direcciones a una sola | Correcta |
| La pública es única en internet | RFC 1918 y RFC 3022: direcciones «globally unique» | Correcta |
| 127.0.0.1 es tu equipo y no se ve desde fuera | RFC 1122 §3.2.1.3: «MUST NOT appear outside a host»; RFC 6890 | Correcta |
| Se llama localhost | RFC 6761 §6.3: localhost resuelve a la dirección de loopback | Correcta |
| ::1 es lo mismo en IPv6 | RFC 4291 §2.5.3 | Correcta |
| 0.0.0.0: el servidor recibe conexiones por cualquier interfaz | ip(7): con INADDR_ANY, el socket queda enlazado a todas las interfaces locales | Correcta |
| 169.254: sin DHCP, el equipo se asigna una él mismo | RFC 3927 §1 y RFC 6890 (Link Local) | Correcta |
| `ipconfig` muestra la IP en Windows | Microsoft: muestra la configuración TCP/IP actual | Correcta |
| `ip addr` lista las interfaces en Linux | ip(8): «address can be abbreviated as addr»; ip-address(8) | Correcta |
| `ipconfig getifaddr en0` en macOS | ss64, página de ipconfig para macOS | Correcta. Fuente secundaria; en0 es el nombre de una interfaz |
| Detrás de NAT, el equipo solo conoce la privada | RFC 3022: la traducción la hace el router | Correcta |

Fuentes:
- [RFC 791](https://www.rfc-editor.org/rfc/rfc791), [RFC 4291](https://www.rfc-editor.org/rfc/rfc4291), [RFC 3849](https://www.rfc-editor.org/rfc/rfc3849) y [RFC 5952](https://www.rfc-editor.org/rfc/rfc5952)
- [RFC 4632](https://www.rfc-editor.org/rfc/rfc4632)
- [RFC 2131](https://www.rfc-editor.org/rfc/rfc2131)
- [RFC 1918](https://www.rfc-editor.org/rfc/rfc1918) y [RFC 3022](https://www.rfc-editor.org/rfc/rfc3022)
- [RFC 1122](https://www.rfc-editor.org/rfc/rfc1122), [RFC 6890](https://www.rfc-editor.org/rfc/rfc6890) y [RFC 6761](https://www.rfc-editor.org/rfc/rfc6761)
- [RFC 3927](https://www.rfc-editor.org/rfc/rfc3927)
- [ip(7)](https://man7.org/linux/man-pages/man7/ip.7.html) e [ip(8)](https://man7.org/linux/man-pages/man8/ip.8.html)
- [ipconfig, Microsoft](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/ipconfig)
- [ipconfig en macOS, ss64](https://ss64.com/mac/ipconfig.html)
