---
slug: guias-scouts
title: Guías y Scouts | Sitio e inscripciones
tagline: Sitio del grupo en dos idiomas, dos formularios que sustituyen la boleta de papel y un portal interno para la junta, pensado para que lo mantenga gente que no programa.
areas: [fullstack]
kind: academico
org: Universidad Técnica Nacional — TCU
role: Arquitectura y desarrollo
period:
  start: '2026-05'
  end: '2026-08'
tier: ficha
home: false
visibility: publico
repo: https://github.com/EngelAlexey/Guias-Scout
site: null
stack:
  - Next.js
  - React
  - TypeScript
  - Supabase
  - PostgreSQL
  - Resend
  - Vercel
cover: null
shots:
  - src: /img/shots/gs-portada.jpg
    alt: "Portada del sitio del Grupo 35, con el titular, las cifras del programa y el botón de inscripción"
    caption: "Portada. Edades, secciones y método, con la inscripción a un clic."
  - src: /img/shots/gs-unete.jpg
    alt: "Página de inscripción, con el titular Únete al grupo y los tres pasos del proceso"
    caption: "Inscripción en línea, el trámite que antes se hacía solo en papel."
  - src: /img/shots/gs-secciones-en.jpg
    alt: "La página de secciones servida en inglés, con las cuatro etapas por edad"
    caption: "La misma página en inglés. Los dos idiomas salen de la misma fuente de contenido."
order: null
---

## Contexto

Trabajo comunal universitario, la modalidad de servicio a la comunidad que exige la carrera. El equipo buscó al Grupo 35 de Guías y Scouts de Esparza, les presentó la propuesta y ejecutó el proyecto bajo los lineamientos del TCU.

Éramos tres. Yo llevé la arquitectura del software, el modelo de datos, la seguridad de la información personal y el control de versiones, y construí la mayor parte de la aplicación; el sistema de diseño visual, y el levantamiento de requerimientos con la accesibilidad del contenido, fueron de mis dos compañeros.

La condición que marcó el proyecto es su final. El trabajo comunal termina en una fecha fija, y a partir de ahí el sitio queda en manos del equipo de comunicación del grupo, que no programa.

## Problema

La asociación nacional de Guías y Scouts tiene sitio propio; el Grupo 35 no tenía ninguno. A nivel local no había dónde publicar su información ni recibir una solicitud de ingreso, así que darse a conocer dependía del contacto directo y de que alguien conociera a alguien.

Los trámites de admisión se hacían en papel, y lo que llegaba por mensajería quedaba disperso entre conversaciones. Una familia interesada no tenía forma de averiguar qué hace el grupo, dónde se reúne ni cómo inscribir a un menor sin preguntar en persona.

## Decisiones técnicas

El sitio tiene que seguir vivo sin el equipo que lo construyó. Cualquier cambio de texto que obligara a editar un componente lo habría dejado congelado el día de la entrega.

Por eso ningún texto visible vive dentro de un componente. Todo está en catálogos de mensajes por idioma, y los datos estructurales, como rutas, identificadores y colores de sección, en un archivo aparte. Tampoco hay colores sueltos dentro de los componentes: todos salen de propiedades personalizadas de CSS.

Los dos formularios guardan datos personales, y uno de ellos datos de menores de edad. Sus tablas llevan seguridad a nivel de fila y, además, todos los permisos revocados para los roles anónimo y autenticado: no existe política pública que conceder, así que solo el servidor con su clave secreta puede escribir o leer. El consentimiento de la persona encargada no es una casilla de la interfaz sino una columna obligatoria con su marca de tiempo, junto a la solicitud que autoriza.

El portal interno de la junta es deliberadamente delgado. Muestra las solicitudes, permite cambiar su estado y administra quién entra; no tiene roles ni permisos, ni historial de conversaciones, ni exportaciones. Desactivar una cuenta es el único control disponible. Cada función de más habría sido superficie que alguien tiene que reparar cuando nosotros ya no estemos.

El grupo no tiene correo saliente propio, así que el portal no manda invitaciones ni enlaces mágicos: quien agrega a una persona encargada ve una clave temporal en pantalla y se la entrega por el medio que el grupo use. La clave sirve una vez y el portal obliga a cambiarla antes de dejar pasar a las demás pantallas.

## Arquitectura

Las dos rutas llevan prefijo de idioma siempre, y la raíz redirige al idioma por defecto. El conmutador toma la ruta sin prefijo y la reconstruye bajo el otro idioma, así que cambiar de idioma deja al visitante en la misma página.

El envío del formulario escribe la solicitud y encola una notificación. Una función de borde la toma y envía el comprobante al solicitante.

El portal vive en su propio grupo de rutas, detrás de una sesión por cookie, y solo en español: es interno.

## Resultado

El sitio está publicado en español e inglés, con la información del grupo, el catálogo de proyectos y los dos formularios en línea. Una familia interesada encuentra al grupo, lee qué hace y envía la solicitud sin hablar con nadie primero; la junta la ve en su portal y le cambia el estado conforme la atiende.

El equipo de comunicación cambia cualquier texto editando su catálogo, sin abrir un componente. Se entregó documentación y una sesión de capacitación sobre esos catálogos y sobre el portal.

Antes de publicar se dejó por escrito la verificación de accesibilidad: contraste de cada color de sección, enlace de salto al contenido, foco visible en todo elemento interactivo y un solo encabezado de primer nivel por página.

La función de borde toma cada notificación de forma atómica, así que dos ejecuciones simultáneas no mandan el mismo comprobante dos veces.

## Lo que aprendí

El alcance no lo fijó lo que el sitio podía hacer, sino lo que un equipo de comunicación sin perfil técnico podía sostener después de la entrega. Esa regla decidió tanto lo que se construyó como lo que se dejó fuera dentro de lo construido: el portal existe porque hacía falta, y es corto por la misma razón por la que existe.
