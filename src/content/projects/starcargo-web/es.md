---
slug: starcargo-web
title: Plataforma de Star Cargo Service | Trámites y expedientes
tagline: Ocho trámites en línea alimentan un portal con sesión donde el cliente sigue sus solicitudes y el equipo las atiende, con el permiso resuelto contra el ERP.
areas: [fullstack]
kind: profesional
org: Star Cargo Service
role: Desarrollo
period:
  start: '2026-05'
  end: null
tier: ficha
home: true
visibility: privado
repo: null
site: https://www.starcargoservice.com
stack:
  - Next.js
  - React
  - TypeScript
  - Tailwind CSS
  - Auth.js
  - MySQL
  - Google Cloud Run
  - Playwright
cover: null
order: 3
---

## Contexto

Star Cargo Service mueve carga marítima, aérea y terrestre entre seis países de Centroamérica. Su sitio es el primer punto de contacto comercial: por ahí entra un importador a pedir cotización, a consultar corredores de consolidación o a localizar la oficina que le corresponde.

El encargo fue un cambio de marca y una plataforma nueva, no un retoque del sitio anterior. La empresa vende en mercados que no comparten idioma, y necesitaba además que lo enviado por el sitio no terminara en un correo sino en un expediente que el cliente pudiera seguir.

## Problema

El sitio anterior no llevaba a ninguna parte. Los trámites colgaban de un desplegable sin página propia, no aparecían en el pie y tres no tenían ningún otro enlace. Un importador que llegaba por buscador no encontraba cómo pedir una cotización.

Su portal devolvía 404 en producción. Una solicitud enviada no se podía consultar después, ni por el cliente ni por el equipo, y el seguimiento volvía al correo y al teléfono.

El idioma era el otro límite. Buena parte de los embarques viene de mercados que no hablan español, y el sitio solo servía bien a uno de ellos.

## Decisiones técnicas

El sitio anterior funcionaba, así que la opción inmediata era editar sobre él y heredar su build, sus dependencias y sus decisiones previas. El resultado habría sido el mismo sitio con otra capa de estilos.

Se abrió un proyecto separado desde el primer día: build propio, dependencias propias, ninguna configuración compartida. Se fijó una fecha a partir de la cual dejó de recibir código del sitio anterior.

El backend empezó como copia y hoy es código de este proyecto: se edita aquí y en ningún otro lugar. Sin esa fecha habrían quedado dos proyectos parcialmente fusionados, sin una fuente autoritativa.

Los permisos no se guardan en este proyecto. Se resuelven contra el ERP en cada petición, porque copiarlos aquí habría creado una segunda verdad que mantener sincronizada con la primera.

## Arquitectura

El sitio público sirve los cuatro idiomas con la misma estructura y el mismo contenido. Cada sección declara un tono visual y los componentes leen las variables vigentes en el punto donde se dibujan. El mismo botón sirve en una sección clara y en una oscura, sin condicionales.

Los ocho trámites del sitio envían contra el ERP y quedan en un portal con sesión. El portal reparte catorce pantallas entre dos audiencias: seis para el cliente, que sigue sus solicitudes y abre sus adjuntos, y ocho para el equipo, que las recibe clasificadas por tipo junto a los clientes, las incidencias y las candidaturas.

El menú no está escrito a mano. Cada entrada se filtra por audiencia y por permiso, así que una opción sin permiso no llega a dibujarse. Una cuenta sin permisos entra y no ve nada.

Los adjuntos se abren dentro del control de acceso: se comprueba el token contra el expediente, el solicitante contra su propiedad y el documento contra su carpeta. El cliente abre los suyos sin salir a un almacenamiento externo.

## Resultado

El sitio está en producción en español, inglés, chino e hindi, con la misma estructura y el mismo contenido en los cuatro. Los ocho trámites envían contra el ERP y los clientes siguen sus solicitudes en el portal, sin llamar ni escribir para preguntar en qué estado están.

Los empleados entran con Google, con la comprobación puesta en el dominio firmado del token y no en el texto del correo. Los clientes entran por invitación de un empleado.

El conjunto de verificaciones se define una vez y corre en dos momentos, al integrar un cambio y al desplegar. Comprueba tipos y pruebas, un tope de advertencias que no puede subir sin justificarlo en el commit, que los cuatro idiomas tengan exactamente las mismas claves de traducción, y que la política de seguridad de contenido siga activa. El despliegue termina con una prueba de humo contra el sitio publicado.

## Lo que aprendí

Heredar código del sitio anterior obligaba a aplicar cada mejora dos veces, y cualquier divergencia entre los dos parecía un error de sincronización en lugar de una decisión.

La fecha de corte quitó esa ambigüedad: desde ahí el sitio anterior es una referencia y no una fuente de cambios. En una migración conviene fijar esa fecha al principio, mientras todavía no hay dos versiones de la misma corrección que reconciliar.
