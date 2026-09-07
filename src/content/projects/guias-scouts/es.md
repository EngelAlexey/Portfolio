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

El alcance fue abrir la presencia digital del grupo local: su sitio público y sus canales en redes. El sitio lleva la información del grupo y un formulario de ingreso, en español e inglés. Esa fue mi parte.

## Problema

La asociación nacional de Guías y Scouts tiene sitio propio; el Grupo 35 no tenía ninguno. A nivel local no había dónde publicar su información ni recibir una solicitud de ingreso, así que darse a conocer dependía del contacto directo.

El trabajo comunal termina en una fecha fija. A partir de ahí el sitio queda en manos del equipo de comunicación del grupo, que no programa.

Cualquier cambio de texto que obligara a editar un componente habría dejado el sitio congelado el día que el equipo universitario se retira.

## Decisiones técnicas

Ningún texto visible vive dentro de un componente. Todo está en catálogos de mensajes por idioma, y los datos estructurales (rutas, identificadores, colores de sección) en un archivo aparte.

Tampoco hay colores sueltos dentro de los componentes: todos salen de propiedades personalizadas de CSS.

## Arquitectura

Las dos rutas llevan prefijo de idioma siempre, y la raíz redirige al idioma por defecto. El conmutador toma la ruta sin prefijo y la reconstruye bajo el otro idioma, así que cambiar de idioma deja al visitante en la misma página.

El envío del formulario escribe la solicitud y encola una notificación. Una función de borde la toma y envía el comprobante.

## Resultado

El sitio está publicado en español e inglés, con la información del grupo y el formulario de ingreso en línea. El equipo de comunicación cambia cualquier texto editando su catálogo, sin abrir un componente.

La función de borde toma cada notificación de forma atómica, así que dos ejecuciones simultáneas no mandan el mismo comprobante dos veces. Las tablas con datos personales tienen seguridad a nivel de fila y no están expuestas a roles públicos.

## Lo que aprendí

El panel de administración quedó fuera del alcance de forma deliberada. Habría añadido autenticación, roles y una interfaz que mantener, para un grupo que no tiene quién la repare.

En su lugar se entregó documentación y una sesión de capacitación sobre los catálogos de mensajes. El costo de esa decisión es real: cualquier cambio que no sea de texto sigue necesitando un despliegue.
