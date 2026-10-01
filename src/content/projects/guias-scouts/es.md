---
slug: guias-scouts
title: Guías y Scouts | Sitio e inscripciones
tagline: Sitio bilingüe con formularios y un portal para la junta, pensado para que lo mantenga un equipo que no programa.
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
    caption: "Portada, con las edades, las secciones y el método, y la inscripción a un clic."
  - src: /img/shots/gs-unete.jpg
    alt: "Página de inscripción, con el titular Únete al grupo y los tres pasos del proceso"
    caption: "Inscripción en línea, el trámite que antes se hacía solo en papel."
  - src: /img/shots/gs-secciones-en.jpg
    alt: "La página de secciones servida en inglés, con las cuatro etapas por edad"
    caption: "La misma página en inglés. Los dos idiomas salen de la misma fuente de contenido."
order: null
---

## Contexto

Es un trabajo comunal universitario (TCU), el servicio a la comunidad que exige la carrera. El equipo buscó al Grupo 35 de Guías y Scouts de Esparza, le presentó la propuesta y ejecutó el proyecto con los lineamientos del TCU.

El equipo tenía tres personas. Llevé la arquitectura del software, el modelo de datos, la seguridad de la información personal y el control de versiones. También construí la mayor parte de la aplicación. Mis dos compañeros se encargaron del sistema de diseño visual y del levantamiento de requerimientos, que incluía la accesibilidad del contenido.

El trabajo comunal termina en una fecha fija. Desde entonces, el sitio lo mantiene el equipo de comunicación del grupo, que no programa. Esa condición determinó el resto de las decisiones.

## Problema

La asociación nacional de Guías y Scouts tiene sitio propio, pero el Grupo 35 no tenía ninguno. No había dónde publicar su información ni recibir una solicitud de ingreso, así que darse a conocer dependía del contacto directo entre conocidos.

Los trámites de admisión se hacían en papel. Lo que llegaba por mensajería quedaba disperso entre conversaciones. Una familia interesada no tenía forma de averiguar qué hace el grupo, dónde se reúne ni cómo inscribir a un menor sin preguntar en persona.

## Decisiones técnicas

El sitio tiene que seguir funcionando sin el equipo que lo construyó. Si cambiar un texto obligara a editar un componente, nadie podría actualizar el sitio después de la entrega.

Por eso ningún texto visible está dentro de un componente. Todos están en catálogos de mensajes por idioma, y los datos estructurales, como rutas, identificadores y colores de sección, en un archivo aparte. Los componentes tampoco tienen colores escritos a mano: todos salen de propiedades personalizadas de CSS.

Los dos formularios guardan datos personales, y uno de ellos datos de menores de edad. Sus tablas tienen seguridad por fila y, además, todos los permisos revocados para los roles anónimo y autenticado. No hay ninguna política pública que dé acceso, así que solo el servidor, con su clave secreta, puede leer o escribir. El consentimiento de la persona encargada del menor es una columna obligatoria con su marca de tiempo, junto a la solicitud que autoriza.

El portal interno de la junta tiene pocas funciones a propósito. Muestra las solicitudes, permite cambiar su estado y administra quién entra. No tiene roles ni permisos, historial de conversaciones ni exportaciones. Desactivar una cuenta es el único control disponible. Cada función adicional habría sido código que alguien tendría que mantener cuando el equipo ya no estuviera.

El grupo no tiene correo saliente propio, así que el portal no envía invitaciones ni enlaces de acceso por correo. Quien da de alta a un miembro de la junta ve en pantalla una clave temporal y se la entrega por el medio que use el grupo. La clave sirve una sola vez, y el portal obliga a cambiarla antes de dar acceso a las demás pantallas.

## Arquitectura

Las rutas de los dos idiomas llevan siempre su prefijo, y la raíz redirige al idioma por defecto. El conmutador quita el prefijo de la ruta y la reconstruye con el del otro idioma. Así, el visitante sigue en la misma página al cambiar de idioma.

Al enviar el formulario se guarda la solicitud y se pone una notificación en cola. Una función de borde la toma y envía el comprobante al solicitante. La función toma cada notificación de forma atómica, así que dos ejecuciones simultáneas no envían el mismo comprobante dos veces.

El portal está en su propio grupo de rutas, detrás de una sesión por cookie, y solo en español, porque es interno.

## Resultado

El sitio está publicado en español e inglés, con la información del grupo, el catálogo de proyectos y los dos formularios en línea. Una familia interesada encuentra al grupo, lee qué hace y envía la solicitud sin hablar antes con nadie. La junta la ve en su portal y cambia su estado conforme la atiende.

El equipo de comunicación cambia cualquier texto editando su catálogo, sin abrir un componente. La entrega incluyó documentación y una sesión de capacitación sobre los catálogos y el portal.

Antes de publicar, la verificación de accesibilidad quedó por escrito:

- el contraste de cada color de sección;
- un enlace para saltar al contenido;
- el foco visible en todo elemento interactivo;
- un solo encabezado de primer nivel por página.

## Lo que aprendí

El alcance lo fijó lo que un equipo de comunicación sin perfil técnico podía mantener después de la entrega. Ese criterio decidió qué se construyó y qué funciones se dejaron fuera.

El portal existe porque la junta necesitaba atender las solicitudes, y tiene pocas funciones porque ese equipo tiene que poder mantenerlo.
