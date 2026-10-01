---
slug: veterinaria-scrum
title: Clínica veterinaria | Proyecto con Scrum
tagline: "El producto es pequeño a propósito para practicar Scrum: backlog priorizado, roles que rotan, sprints y revisión al cierre."
areas: [fullstack]
kind: academico
org: Universidad Técnica Nacional
role: Desarrollo en equipo
period:
  start: '2026-06'
  end: '2026-07'
tier: ficha
home: false
visibility: publico
repo: https://github.com/SebastianRodMes/veterinaria-scrum
site: null
stack:
  - JavaScript
  - HTML
  - CSS
  - LocalStorage
cover: null
shots:
  - src: /img/shots/vet-cliente.jpg
    alt: "Vista de cliente con los horarios disponibles por día y el formulario de datos de la cita"
    caption: "Vista de cliente. Horarios libres, seleccionados y ocupados, y el resumen de la reserva."
  - src: /img/shots/vet-cuenta.jpg
    alt: "Pantalla de acceso de clientes, con las pestañas de iniciar sesión y crear cuenta"
    caption: "Acceso con dos roles. El rol decide a qué vista entra la sesión."
  - src: /img/shots/vet-admin.jpg
    alt: "Panel de administración con la cola de citas ordenada por fecha y hora, los contadores por estado y el botón de confirmar"
    caption: "Panel del administrador. La cola FIFO, los contadores por estado y la acción de confirmar."
order: null
---

## Contexto

Es un proyecto del curso Metodologías Ágiles de Desarrollo de Software, hecho por el mismo equipo, esta vez con Scrum. Como en el [proyecto de Programación Extrema](/es/proyectos/red-social-xp), el producto es pequeño a propósito para practicar el marco de trabajo. Ese marco incluye los roles de Product Owner, Scrum Master y desarrolladores, el backlog priorizado y los sprints con planificación, revisión y retrospectiva.

El caso es una clínica veterinaria que agenda consultas. Mi aporte fueron cuatro historias, además de llevar el diseño entregado a la arquitectura del proyecto.

## Problema

El backlog tenía diez historias con tres niveles de prioridad, y el tiempo no alcanzaba para todas. El ejercicio obliga a elegir y a dejar la elección por escrito. Las historias de prioridad uno se entregan completas antes de tocar las demás, y lo que no entra se queda en el backlog con su prioridad.

En el dominio, había que resolver el ciclo de una consulta. Una cita reservada no es una cita confirmada, y el cliente necesita saber cuál de las dos tiene antes de presentarse con su mascota.

## Decisiones técnicas

Los roles se reasignaron a mitad del proyecto en lugar de fijarse al inicio. Rotar quién lleva el backlog y quién facilita obliga a que todos entiendan los dos lados. Esa parte del marco se pierde cuando un equipo reparte los papeles una sola vez.

Cada historia se trabajó en su rama y entró por solicitud de incorporación, fusionada por otro integrante. El tablero limita el trabajo en curso, para que un cuello de botella aparezca en la columna donde se acumula y no en la revisión del sprint.

El glosario del dominio se escribió antes que el código y está en el repositorio. Así, «consulta» significa lo mismo en la historia y en la implementación.

En el producto, la decisión central fue modelar la consulta como una máquina de estados, con las transiciones declaradas en un solo lugar. Los estados son pendiente, confirmada, en curso, completada y cancelada. Confirmar deja de ser marcar una casilla: el administrador asigna fecha y hora, la consulta cambia de estado y el cliente recibe el aviso con esos datos.

## Arquitectura

Es un sitio estático sin dependencias. El CSS está organizado en capas: base, estructura, componentes y estilos por vista. El JavaScript separa una biblioteca de utilidades, que resuelve almacenamiento, DOM, rutas y validación, de los módulos del dominio: consultas, mascotas, horarios, notificaciones y sesión.

El registro distingue al cliente del administrador para decidir a qué vista entra la sesión. Se resuelve en el navegador sobre LocalStorage, así que solo separa las dos vistas del ejercicio y no protege nada.

Las pruebas son páginas de especificación por módulo, que se abren en el navegador y ejecutan sus casos.

## Resultado

Un cliente reserva la consulta de su mascota eligiendo entre los horarios disponibles. El administrador la ve en su panel, le asigna fecha y hora y la confirma.

Las historias de prioridad uno quedaron entregadas, y con ellas varias de prioridad dos. La entrega final se validó historia por historia contra la definición de Terminado.

## Lo que aprendí

Aprendí Scrum practicándolo, desde la planificación del sprint y la reunión diaria hasta la revisión del incremento y la retrospectiva.

La práctica enseña para qué sirve cada pieza. Un backlog priorizado sirve sobre todo para decidir qué no se hace. Eso solo se entiende cuando el tiempo no alcanza y hay que dejar por escrito lo que queda fuera.
