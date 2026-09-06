---
slug: starcargo-crm
title: Star CRM
tagline: Cuatro roles y varias sucursales sobre los mismos datos. El permiso se aplica en el servidor y en la base.
areas: [fullstack, seguridad]
kind: profesional
org: Star Cargo Service
role: Desarrollo
period:
  start: '2026-01'
  end: '2026-04'
tier: ficha
home: false
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
order: null
---

## Contexto

CRM a la medida para una empresa de carga. Gestiona clientes, contactos, negocios de embarque, citas, cotizaciones y sucursales, y sustituye la operación que antes vivía en hojas de cálculo.

## Problema

Cada ejecutivo anotaba su gestión en una hoja de cálculo y se la enviaba a la gerencia. Ahí alguien trasladaba esos datos al resto de los archivos. La misma información se escribía varias veces y la consolidación dependía de que alguien la hiciera a mano.

Con seis sucursales operando así, el objetivo fue centralizar el registro y que la consolidación la haga el sistema. Centralizarlo convierte además el «quién ve qué» en una regla que hay que aplicar en cada consulta.

## Decisiones técnicas

Los permisos viven en una tabla, no en el código. Un decorador marca lo que exige cada endpoint y un guard lo comprueba antes de ejecutar nada. Cambiar lo que puede hacer un rol es editar una fila, no desplegar.

El ORM salió a mitad del proyecto. Los servicios pasaron a hablar con la base por el cliente de Supabase. Ese cliente transporta la identidad del usuario, así que queda sujeto a las políticas de fila. Un ORM con su propia conexión las habría dejado fuera.

## Arquitectura

Cliente en Next.js y servidor en NestJS, en un mismo repositorio. La sesión la emite Supabase y el servidor valida el token por su cuenta, en lugar de confiar en que el cliente ya lo hizo.

Hay dos capas de permiso que responden preguntas distintas. El guard del servidor decide si la petición procede. Las políticas de fila de la base deciden qué filas devuelve la consulta.

Casi toda entidad lleva su sucursal, y el usuario elige cuál tiene activa. Hay suscripciones en tiempo real sobre el perfil, las sucursales asignadas y los permisos por rol. Un cambio de rol se refleja en la interfaz sin recargar.

## Resultado

El caso que puso a prueba el diseño fue un comercial que recibía 403 al abrir el tablero. Los indicadores exigían permiso de informes, cuando el dato que devolvían era de negocios.

Se bajó el permiso requerido después de comprobar que el servicio ya aislaba los registros por usuario. El permiso pedido era más alto que el dato entregado, y eso también es un error de diseño.

## Lo que aprendí

El servidor autorizaba una operación de administración con su guard y después usaba el token restringido del usuario para escribirla. La base rechazaba una escritura que la aplicación ya había aprobado.

Las dos capas no son la misma comprobación repetida. El guard decide si la operación procede; la base decide con qué identidad se ejecuta. La corrección fue usar la identidad de servicio para esa escritura, y solo después de que el guard autorizara.
