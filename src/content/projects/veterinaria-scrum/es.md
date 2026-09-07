---
slug: veterinaria-scrum
title: Clínica veterinaria | Proyecto con Scrum
tagline: "Proyecto bajo Scrum. El producto es pequeño a propósito: lo que se practica es el marco, con backlog priorizado, roles que rotan, sprints y revisión al cierre."
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

Curso de Metodologías Ágiles de Desarrollo de Software, el mismo equipo trabajando esta vez con Scrum. Igual que en el proyecto de Programación Extrema, el producto es pequeño a propósito: lo que se practica es el marco —Product Owner, Scrum Master y desarrolladores, backlog priorizado, sprints con planificación, revisión y retrospectiva.

El caso es una clínica veterinaria que agenda consultas. Mi aporte fueron cuatro historias, además de llevar el diseño entregado a la arquitectura del proyecto.

## Problema

Diez historias, tres niveles de prioridad y una ventana que no alcanza para todas. El ejercicio obliga a elegir y a que la elección quede escrita: las de prioridad uno se entregan completas antes de tocar las demás, y lo que no entra permanece en el backlog con su prioridad en lugar de desaparecer del alcance.

Del dominio, lo que había que resolver es el ciclo de una consulta. Una cita reservada no es una cita confirmada, y el cliente necesita saber cuál de las dos tiene antes de presentarse con su mascota.

## Decisiones técnicas

Los roles se reasignaron a mitad del proyecto en lugar de fijarse al inicio. Rotar quién lleva el backlog y quién facilita obliga a que todos entiendan los dos lados, y es justo la parte del marco que se pierde cuando un equipo se reparte los papeles una sola vez.

Cada historia se trabajó en su rama y entró por solicitud de incorporación, fusionada por otro integrante. Sobre el tablero se limitó el trabajo en curso, para que el cuello de botella aparezca en la columna donde se acumula y no en la revisión del sprint.

El glosario del dominio se escribió antes que el código y vive en el repositorio. Es lo que evita que consulta signifique una cosa en la historia y otra en la implementación.

Del producto, la decisión que sostiene el resto es modelar la consulta como una máquina de estados —pendiente, confirmada, en curso, completada, cancelada— con las transiciones declaradas en un solo lugar. Confirmar deja de ser marcar una casilla: el administrador asigna fecha y hora, la consulta cambia de estado y el cliente recibe el aviso con esos datos.

## Arquitectura

Sitio estático sin dependencias. El CSS va en capas —base, estructura, componentes y estilos por vista— y el JavaScript separa una biblioteca de utilidades, que resuelve almacenamiento, DOM, rutas y validación, de los módulos del dominio: consultas, mascotas, horarios, notificaciones y sesión.

El registro distingue cliente de administrador para decidir a qué vista entra la sesión, resuelto en el navegador sobre LocalStorage: separa las dos vistas del ejercicio, no protege nada.

Las pruebas son páginas de especificación por módulo, que se abren en el navegador y ejecutan sus casos.

## Resultado

Un cliente reserva la consulta de su mascota eligiendo entre los horarios disponibles, y el administrador la ve en su panel, le asigna fecha y hora y la confirma. Las historias de prioridad uno quedaron entregadas, y con ellas varias de prioridad dos.

Lo que no entró permaneció en el backlog con su prioridad, no borrado del alcance. La entrega final se validó historia por historia contra la definición de Terminado.

## Lo que aprendí

Aprendí a usar Scrum practicándolo: los roles de Product Owner, Scrum Master y desarrollador, el backlog priorizado, la planificación del sprint y la reunión diaria, la revisión del incremento y la retrospectiva al cierre.

Practicarlo es lo que enseña para qué sirve cada pieza. Un backlog priorizado sirve sobre todo para decidir qué no se hace, y eso solo se entiende cuando la ventana no alcanza y hay que dejar por escrito lo que queda fuera.
