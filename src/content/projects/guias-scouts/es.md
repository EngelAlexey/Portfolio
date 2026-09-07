---
slug: guias-scouts
title: Guías y Scouts | Sitio e inscripciones
tagline: Información del grupo y formulario de ingreso con comprobante por correo, en dos idiomas, pensado para que lo mantenga gente que no programa.
areas: [fullstack]
kind: academico
org: Universidad Técnica Nacional — TCU
role: Desarrollo
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
order: null
---

## Contexto

Trabajo comunal universitario, la modalidad de servicio a la comunidad que exige la carrera. El equipo buscó al Grupo 35 de Guías y Scouts, les presentó la propuesta y ejecutó el proyecto bajo los lineamientos del TCU.

El alcance fue abrir la presencia digital del grupo: su sitio público y sus canales en redes. El sitio lleva la información del grupo y un formulario de ingreso, en español e inglés. Esa fue mi parte.

La condición que marcó el proyecto es su final. El trabajo comunal termina en una fecha fija, y a partir de ahí el sitio queda en manos del equipo de comunicación del grupo, que no programa.

## Problema

La asociación nacional de Guías y Scouts tiene sitio propio; el Grupo 35 no tenía ninguno. A nivel local no había dónde publicar su información ni recibir una solicitud de ingreso, así que darse a conocer dependía del contacto directo y de que alguien conociera a alguien.

Una familia interesada no tenía forma de averiguar qué hace el grupo, dónde se reúne ni cómo inscribir a un menor sin preguntar en persona.

## Decisiones técnicas

El sitio tiene que seguir vivo sin el equipo que lo construyó. Cualquier cambio de texto que obligara a editar un componente lo habría dejado congelado el día de la entrega.

Por eso ningún texto visible vive dentro de un componente. Todo está en catálogos de mensajes por idioma, y los datos estructurales, como rutas, identificadores y colores de sección, en un archivo aparte. Tampoco hay colores sueltos dentro de los componentes: todos salen de propiedades personalizadas de CSS.

El panel de administración quedó fuera del alcance de forma deliberada. Habría añadido autenticación, roles y una interfaz que mantener, para un grupo que no tiene quién la repare.

## Arquitectura

Las dos rutas llevan prefijo de idioma siempre, y la raíz redirige al idioma por defecto. El conmutador toma la ruta sin prefijo y la reconstruye bajo el otro idioma, así que cambiar de idioma deja al visitante en la misma página.

El envío del formulario escribe la solicitud y encola una notificación. Una función de borde la toma y envía el comprobante al solicitante.

## Resultado

El sitio está publicado en español e inglés, con la información del grupo y el formulario de ingreso en línea. Una familia interesada encuentra al grupo, lee qué hace y envía la solicitud sin hablar con nadie primero.

El equipo de comunicación cambia cualquier texto editando su catálogo, sin abrir un componente. Se entregó documentación y una sesión de capacitación sobre esos catálogos.

La función de borde toma cada notificación de forma atómica, así que dos ejecuciones simultáneas no mandan el mismo comprobante dos veces. Las tablas con datos personales tienen seguridad a nivel de fila y no están expuestas a roles públicos.

## Lo que aprendí

Dejar fuera el panel de administración tiene un coste real: cualquier cambio que no sea de texto sigue necesitando un despliegue, y para eso hace falta alguien técnico.

Aun así fue la decisión correcta para este cliente. El alcance no lo fijó lo que el sitio podía hacer, sino lo que un equipo de comunicación sin perfil técnico podía sostener después de la entrega.
