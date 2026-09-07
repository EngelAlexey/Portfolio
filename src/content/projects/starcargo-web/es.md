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

Star Cargo mueve carga marítima, aérea y terrestre entre seis países de Centroamérica. Por el sitio entra un importador a pedir cotización, consultar corredores de consolidación o localizar la oficina que le corresponde.

El sitio está en español, inglés, chino e hindi, porque de esos mercados viene buena parte de los embarques.

El sitio no termina en el formulario. Lo que se envía queda en un portal con sesión: el cliente sigue sus solicitudes y abre sus adjuntos, y el equipo las recibe clasificadas por tipo, junto a los clientes, las incidencias y las candidaturas.

## Problema

El encargo fue un cambio de marca y una modernización del sitio, no un retoque del anterior.

Star Cargo vende en mercados que no comparten idioma, y el sitio es donde un importador pide cotización antes de hablar con nadie. Tiene que servir en español, inglés, chino e hindi con el mismo contenido y la misma estructura en los cuatro.

Los trámites del sitio anterior colgaban de un desplegable sin página propia, no aparecían en el pie y tres no tenían ningún otro enlace. Su portal devolvía 404 en producción, así que una solicitud enviada no se podía consultar después.

## Decisiones técnicas

El sitio anterior funcionaba, así que la opción inmediata era editar sobre él, heredando su build, sus dependencias y sus decisiones previas. El resultado habría sido el mismo sitio con otra capa de estilos.

Proyecto separado desde el primer día: build propio, dependencias propias, ninguna configuración compartida. Se fijó una fecha a partir de la cual dejó de recibir código del sitio anterior.

El backend empezó como copia y hoy es código de este proyecto: se edita aquí y en ningún otro lugar. Sin esa fecha habrían quedado dos proyectos parcialmente fusionados, sin una fuente autoritativa.

## Arquitectura

El sistema visual es tema oscuro sobre un lienzo redondeado. Cada sección declara un tono: oscuro, azul marino o papel. Ese tono redefine un conjunto de variables CSS para superficie, línea, texto y acción.

Los componentes no reciben el tono como propiedad ni lo consultan. Leen las variables vigentes en el punto donde se dibujan. El mismo botón en una sección clara y en una oscura es el mismo componente, sin condicionales.

El portal reparte catorce pantallas entre dos audiencias: seis para el cliente y ocho para el equipo. El menú no está escrito a mano. Cada entrada se filtra por audiencia y por permiso, así que una opción sin permiso no llega a dibujarse.

Los permisos no viven en este proyecto. Se resuelven contra el ERP en cada petición y el repositorio no guarda ninguna tabla de permisos. Una cuenta sin permisos entra y no ve nada. El selector de sucursal cambia lo que ve la misma cuenta, y sin el permiso de datos personales un expediente sale con esos campos ocultos y sus documentos de esa clase no se sirven.

Los adjuntos se abren dentro del control de acceso: se comprueba el token contra el expediente, el solicitante contra su propiedad y el documento contra su carpeta. El cliente abre los suyos sin salir a un almacenamiento externo.

## Resultado

El sitio está en producción en los cuatro idiomas, con la misma estructura y el mismo contenido en todos.

Los ocho trámites envían contra el ERP y los clientes usan el portal. Los empleados entran con Google, con la comprobación puesta en el dominio firmado del token y no en el texto del correo; los clientes entran por invitación de un empleado.

El conjunto de verificaciones se define una vez y corre en dos momentos, al integrar un cambio y al desplegar. Comprueba tipos, pruebas y un tope de advertencias que no puede subir sin justificarlo en el commit; que los cuatro idiomas tengan exactamente las mismas claves de traducción; y que la política de seguridad de contenido siga activa. El despliegue termina con una prueba de humo contra el sitio publicado.

## Lo que aprendí

Heredar código del sitio anterior obligaba a aplicar cada mejora dos veces, y cualquier divergencia entre los dos parecía un error de sincronización en lugar de una decisión. La fecha de corte quitó esa ambigüedad: desde ahí el sitio anterior es una referencia y no una fuente de cambios.
