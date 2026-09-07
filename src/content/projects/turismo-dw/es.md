---
slug: turismo-dw
title: TurismoDW | Almacén de datos
tagline: Cuatro orígenes incompatibles, con archivos mal formados a propósito para que la validación tuviera algo que rechazar, quedan juntos en un esquema estrella.
areas: [datos, infra]
kind: academico
org: Universidad Técnica Nacional
role: Ingeniería de datos
period:
  start: '2026-08'
  end: '2026-08'
tier: ficha
home: false
visibility: publico
repo: null
site: null
stack:
  - Python
  - PostgreSQL
  - MongoDB
  - SQL Server
  - Docker
  - AWS
  - Power BI
cover: null
order: null
---

## Contexto

Proyecto de Bases de Datos Avanzadas, en equipo de cuatro. Me tocó la base analítica, el ETL y el informe, y después la migración completa a la nube. Mis compañeros llevaron particionado e índices, alta disponibilidad, y rendimiento y documentación.

## Problema

Los datos vivían en cuatro sitios con formas incompatibles: una base relacional operativa, una base documental con reseñas e interacciones web, y archivos sueltos en dos formatos.

Una parte de esos archivos venía deliberadamente mal formada, para que la validación tuviera algo que rechazar. Consultar los cuatro orígenes juntos no era cuestión de escribir una consulta más grande.

## Decisiones técnicas

Un proceso en Python extrae cada origen a archivos planos. De ahí van por lote a un área de preparación y luego a las tablas del modelo.

Cada dimensión lleva una fila de "no aplica". Con ella todas las uniones pueden ser internas y ninguna fila de hechos desaparece por un origen incompleto.

La ocupación diaria guarda numerador y denominador por separado y nunca el porcentaje, porque un porcentaje no se puede sumar entre filas.

## Arquitectura

Ocho dimensiones y seis tablas de hechos, con 8,6 millones de filas de hechos. La carga incremental se controla con marcas de agua en un esquema aparte. Ese esquema registra cada ejecución, cada etapa y cada rechazo, con su regla y su registro original.

La migración fue un traslado deliberado, sin rediseño. El valor estaba en el modelo, los procedimientos y las medidas del informe, así que se movieron los motores sin reescribir nada. Antes se corrió un piloto con el diez por ciento de los datos, elegido de forma determinista, para comprobar las herramientas.

## Resultado

El piloto respondió la pregunta que bloqueaba el diseño: RDS for SQL Server admite grupos de archivos de usuario, así que los scripts migraron sin modificaciones.

La restricción de "solo el grupo primario" que casi obliga a rediseñar el modelo pertenece a Azure SQL Database, no a los servicios gestionados en general.

## Lo que aprendí

La clase de instancia limita antes que el tope de almacenamiento. Una instancia `db.t3.micro` con 995 MB de RAM dejó a SQL Server con 125 MB de memoria objetivo.

Una inserción masiva de 2 923 filas se quedó esperando `RESOURCE_SEMAPHORE` sin recibir concesión. No fallaba: esperaba, sin error y sin agotar tiempo de espera. Subir un escalón de clase de instancia lo resolvió, y el diagnóstico fue lo que costó.
