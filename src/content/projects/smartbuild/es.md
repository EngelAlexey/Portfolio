---
slug: smartbuild
title: Smart Build | Gestión de obra
tagline: Presupuesto, planilla, subcontratos y gastos de cada obra en un solo sistema, con el costo real contrastado contra lo presupuestado.
areas: [fullstack]
kind: academico
org: Universidad Técnica Nacional
role: Desarrollo del cliente web
period:
  start: '2025-07'
  end: '2025-09'
tier: ficha
home: false
visibility: publico
repo: https://github.com/ITI-524-ProyectoIntegrador-2-25/ConstruApp
site: null
stack:
  - React
  - JavaScript
  - Bootstrap
  - ASP.NET Core
  - Dapper
  - SQL Server
cover: null
order: null
---

## Contexto

Proyecto Integrador I, en equipo de cinco. Smart Build reúne en un solo sistema lo que cuesta una obra: el presupuesto, la planilla, los subcontratos y sus pagos, la materia prima y los gastos adicionales. Mi aporte fue el cliente web.

El caso plantea una constructora que lleva cada obra por separado y no puede decir cuánto lleva gastado un proyecto sin ir a recoger la cifra a tres sitios distintos.

## Problema

El costo real de una obra vive repartido. La planilla de la semana, los pagos al subcontratista, la materia prima y los gastos adicionales se registran cada uno por su lado, así que contrastarlos contra el presupuesto es un trabajo manual que se hace tarde o no se hace.

La planilla es la parte que más se equivoca. Cada empleado tiene sus horas, su seguro y sus deducciones, y el neto sale de encadenar todo eso: basta un error en una fila para que el pago salga mal.

## Decisiones técnicas

Las validaciones se declaran como esquema y el formulario las consume, en vez de repartir comprobaciones campo por campo. Un formulario nuevo declara su esquema y hereda el mismo comportamiento de error que los demás.

La planilla se separó en dos pantallas: el listado y el detalle por empleado, donde el seguro y el neto se calculan mientras se escribe. Ver el número antes de guardar es lo que evita descubrir el error cuando el empleado reclama.

Los listados se paginan en lugar de traer todo de una vez. Una obra acumula cientos de líneas de gasto y de planilla, y la vista tenía que abrir igual de rápido al final del proyecto que al principio.

La interfaz es responsive y la barra lateral se colapsa, porque la obra se consulta desde el teléfono y no desde un escritorio.

## Arquitectura

Cliente y servidor separados. El cliente es una aplicación React que consume un API en ASP.NET Core, con un controlador por entidad: clientes, contactos, empleados, planilla y su detalle, presupuestos, subcontratos, pagos, materia prima, gastos adicionales y actividades.

El acceso a datos va con Dapper sobre SQL Server, con las consultas escritas a mano en lugar de un mapeo automático. Los modelos del servidor están divididos por área, y el cliente sigue esa misma división en su navegación.

## Resultado

El sistema cubre el ciclo de una obra: se registra el cliente, se arma el presupuesto y se cargan contra ese proyecto la planilla, los subcontratos, la materia prima y los gastos adicionales, con exportación a PDF y a hoja de cálculo.

Del lado del cliente quedó una base compartida entre pantallas: el mismo esquema de validación, la misma tabla paginada y el mismo formulario de detalle para cada entidad, en lugar de una implementación por pantalla.

## Lo que aprendí

Un formulario no se valida en el campo, se valida en el esquema. Mientras cada pantalla resolvía sus reglas por su cuenta, dos formularios pedían el mismo dato con mensajes distintos y corregirlo obligaba a tocar los dos.

En un equipo de cinco eso es lo que decide el ritmo. Declarar la regla una vez y que el formulario la consuma dejó de multiplicar el mismo trabajo entre cinco personas.
