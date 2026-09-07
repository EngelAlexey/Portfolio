---
slug: turismo-dw
title: TurismoDW | Almacén de datos y migración a la nube
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

El caso plantea una operación turística cuyos datos se acumularon en sistemas distintos, comprados o construidos en momentos distintos, y que ahora necesita una vista única para decidir sobre ellos.

## Problema

Los datos vivían en cuatro sitios con formas incompatibles: una base relacional operativa, una base documental con reseñas e interacciones web, y archivos sueltos en dos formatos.

Responder una sola pregunta de negocio exigía consultar cada origen por separado y cruzar los resultados a mano, con lo que ninguna respuesta era reproducible.

Una parte de esos archivos venía deliberadamente mal formada, para que la validación tuviera algo que rechazar y el proceso no se diseñara suponiendo datos limpios.

## Decisiones técnicas

Un proceso en Python extrae cada origen a archivos planos. De ahí van por lote a un área de preparación y luego a las tablas del modelo.

Cada dimensión lleva una fila de «no aplica». Con ella todas las uniones pueden ser internas y ninguna fila de hechos desaparece por un origen incompleto, que es el error que hace que un informe cuadre pero cuente de menos.

La ocupación diaria guarda numerador y denominador por separado y nunca el porcentaje, porque un porcentaje no se puede sumar entre filas y cualquier informe que agrupe daría un número falso.

La migración a la nube fue un traslado deliberado, sin rediseño. El valor estaba en el modelo, los procedimientos y las medidas del informe, así que se movieron los motores sin reescribir nada.

## Arquitectura

Ocho dimensiones y seis tablas de hechos, con 8,6 millones de filas de hechos. La carga incremental se controla con marcas de agua en un esquema aparte, que registra cada ejecución, cada etapa y cada rechazo con su regla y su registro original.

Antes de migrar se corrió un piloto con el diez por ciento de los datos, elegido de forma determinista, para comprobar las herramientas sobre datos reales y no sobre una muestra conveniente.

## Resultado

Los cuatro orígenes quedaron en un solo esquema estrella, consultable desde el informe sin cruzar nada a mano.

El piloto respondió la pregunta que bloqueaba el diseño: RDS for SQL Server admite grupos de archivos de usuario, así que los scripts migraron sin modificaciones. La restricción de «solo el grupo primario», que casi obliga a rediseñar el modelo, pertenece a Azure SQL Database y no a los servicios gestionados en general.

## Lo que aprendí

La clase de instancia limita antes que el tope de almacenamiento. Una instancia `db.t3.micro` con 995 MB de RAM dejó a SQL Server con 125 MB de memoria objetivo.

Una inserción masiva de 2 923 filas se quedó esperando `RESOURCE_SEMAPHORE` sin recibir concesión. No fallaba: esperaba, sin error y sin agotar tiempo de espera. Subir un escalón de clase de instancia lo resolvió, y el diagnóstico fue lo que costó, porque un proceso que no falla no deja rastro que buscar.
