---
slug: starcargo-crm
title: Star CRM | Gestión de ventas
tagline: Clientes, contactos, cotizaciones, citas y negocios de embarque en un registro único. El permiso por rol y sucursal se aplica en el servidor y en la base.
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

CRM a la medida para una empresa de carga con varias sucursales. Gestiona clientes, contactos, negocios de embarque, citas, cotizaciones y sucursales, y es el registro donde los ejecutivos comerciales llevan su gestión diaria.

El proyecto se pidió porque la operación comercial crecía y la información de ventas no estaba en ningún sistema. Vivía en hojas de cálculo repartidas entre las personas que las escribían.

## Problema

Cada ejecutivo anotaba su gestión en una hoja de cálculo y se la enviaba a la gerencia. Ahí alguien trasladaba esos datos al resto de los archivos.

La misma información se escribía varias veces, la consolidación dependía de que una persona la hiciera a mano, y la gerencia solo veía el estado de la cartera cuando ese trabajo terminaba. Con varias sucursales operando así, ninguna versión del archivo era la buena.

## Decisiones técnicas

Centralizar el registro convierte el permiso de lectura en una regla que hay que aplicar en cada consulta, y esa regla cambia cada vez que la empresa reorganiza un rol.

Por eso los permisos viven en una tabla y no en el código. Un decorador marca lo que exige cada endpoint y un guard lo comprueba antes de ejecutar nada. Cambiar lo que puede hacer un rol es editar una fila, no desplegar una versión.

El ORM salió a mitad del proyecto. Los servicios pasaron a hablar con la base por el cliente de Supabase, que transporta la identidad del usuario y queda sujeto a las políticas de fila. Un ORM con su propia conexión las habría dejado fuera, y el aislamiento entre sucursales habría dependido solo del código de aplicación.

## Arquitectura

Cliente en Next.js y servidor en NestJS, en un mismo repositorio. La sesión la emite Supabase y el servidor valida el token por su cuenta, en lugar de confiar en que el cliente ya lo hizo.

Hay dos capas de permiso que responden preguntas distintas. El guard del servidor decide si la petición procede. Las políticas de fila de la base deciden qué filas devuelve la consulta.

Casi toda entidad lleva su sucursal, y el usuario elige cuál tiene activa. El perfil, las sucursales asignadas y los permisos por rol se siguen en tiempo real, así que un cambio de rol se refleja en la interfaz sin recargar.

## Resultado

El CRM sustituyó la operación en hojas de cálculo. Clientes, contactos, negocios de embarque, citas, cotizaciones y sucursales viven en un solo registro, y la consolidación la hace el sistema en lugar de una persona.

El diseño se puso a prueba con un ejecutivo que recibía 403 al abrir el tablero: los indicadores exigían permiso de informes cuando el dato que devolvían era de negocios. Se bajó el permiso requerido después de comprobar que el servicio ya aislaba los registros por usuario.

## Lo que aprendí

El servidor autorizaba una operación de administración con su guard y después usaba el token restringido del usuario para escribirla. La base rechazaba entonces una escritura que la aplicación ya había aprobado.

Las dos capas responden preguntas distintas y no se sustituyen entre sí. La corrección fue usar la identidad de servicio para esa escritura, y solo después de que el guard autorizara. Repetir una comprobación en dos capas no sobra cuando cada una contesta algo diferente, pero obliga a tener claro qué contesta cada una.
