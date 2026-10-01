---
slug: starcargo-crm
title: Star CRM | Gestión de ventas
tagline: Sustituye las hojas de cálculo de varias sucursales por un solo registro, con permisos por rol y sucursal.
areas: [fullstack, seguridad]
kind: profesional
org: Star Cargo Service
role: Desarrollo
period:
  start: '2026-01'
  end: '2026-04'
tier: ficha
home: true
visibility: privado
repo: null
site: null
stack:
  - Next.js
  - React
  - TypeScript
  - NestJS
  - Supabase
  - PostgreSQL
  - Playwright
cover: null
order: 4
---

## Contexto

Es un CRM a la medida para Star Cargo Service, una empresa de carga con varias sucursales. Gestiona clientes, contactos, negocios de embarque, citas, cotizaciones y sucursales, y es el registro donde los ejecutivos comerciales llevan su gestión diaria.

El proyecto se pidió porque la operación comercial crecía y la información de ventas no estaba en ningún sistema. Estaba en hojas de cálculo repartidas entre las personas que las escribían.

## Problema

Cada ejecutivo anotaba su gestión en una hoja de cálculo y se la enviaba a la gerencia. Allí alguien trasladaba esos datos al resto de los archivos.

La misma información se escribía varias veces, y la consolidación dependía de que una persona la hiciera a mano. La gerencia solo veía el estado de la cartera cuando ese trabajo terminaba. Con varias sucursales trabajando así, ninguna versión del archivo era la correcta.

## Decisiones técnicas

Centralizar el registro convierte el permiso de lectura en una regla que hay que aplicar en cada consulta. Además, esa regla cambia cada vez que la empresa reorganiza un rol.

Por eso los permisos están en una tabla y no en el código. Un decorador marca lo que exige cada ruta del API, y un *guard* (la clase de NestJS que autoriza una petición) lo comprueba antes de ejecutar nada. Cambiar lo que puede hacer un rol es editar una fila, no desplegar una versión.

A mitad del proyecto se retiró el ORM. Los servicios pasaron a consultar la base con el cliente de Supabase, que lleva la identidad del usuario y queda sujeto a las políticas de fila. Un ORM con su propia conexión las habría dejado fuera, y el aislamiento entre sucursales habría dependido solo del código de aplicación.

## Arquitectura

El cliente usa Next.js y el servidor NestJS, en un mismo repositorio. Supabase emite la sesión y el servidor valida el token por su cuenta, en lugar de confiar en que el cliente ya lo hizo.

Hay dos capas de permiso que responden preguntas distintas. El *guard* del servidor decide si la petición procede, y las políticas de fila de la base deciden qué filas devuelve la consulta.

Casi toda entidad lleva su sucursal, y el usuario elige cuál tiene activa. El perfil, las sucursales asignadas y los permisos por rol se actualizan en tiempo real, así que un cambio de rol se refleja en la interfaz sin recargar.

## Resultado

El CRM sustituyó la operación en hojas de cálculo. Todos los datos comerciales están en un solo registro, y la consolidación la hace el sistema en lugar de una persona.

La gerencia ve el estado de la cartera de todas las sucursales sin pedirle su archivo a nadie. Cada ejecutivo trabaja sobre los registros que le corresponden.

## Lo que aprendí

El servidor autorizaba una operación de administración con su *guard* y después usaba el token restringido del usuario para escribirla. La base rechazaba entonces una escritura que la aplicación ya había aprobado.

La corrección fue usar la identidad de servicio para esa escritura, solo después de que el *guard* la autorizara. Repetir una comprobación en dos capas no sobra cuando cada una contesta algo distinto, pero obliga a saber qué contesta cada una.
