---
slug: turismo-dw
title: TurismoDW | Almacén de datos y migración a la nube
tagline: Cuatro orígenes de datos incompatibles, con archivos mal formados a propósito, reunidos en un solo modelo de análisis.
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

Es un proyecto del curso Bases de Datos Avanzadas, hecho en un equipo de cuatro. Mi parte fue la base analítica, el ETL y el informe, y después la migración completa a la nube. Mis compañeros se encargaron del particionado y los índices, de la alta disponibilidad y del rendimiento y la documentación.

El caso plantea una operación turística cuyos datos se acumularon en sistemas distintos, comprados o construidos en momentos distintos. Ahora necesita una vista única para tomar decisiones sobre ellos.

## Problema

Los datos estaban en cuatro lugares con formas incompatibles: una base relacional operativa, una base documental con reseñas e interacciones web, y archivos sueltos en dos formatos.

Responder una sola pregunta de negocio exigía consultar cada origen por separado y cruzar los resultados a mano, así que ninguna respuesta era reproducible.

Una parte de esos archivos venía mal formada a propósito, para que la validación tuviera algo que rechazar y el proceso no se diseñara suponiendo datos limpios.

## Decisiones técnicas

Un proceso en Python extrae cada origen a archivos planos. Desde ahí, los datos pasan por lotes a un área de preparación y luego a las tablas del modelo.

Cada dimensión tiene una fila de «no aplica». Con ella, todas las uniones pueden ser internas y ninguna fila de hechos desaparece por un origen incompleto. Perder esas filas produce un informe que cuadra pero cuenta de menos.

La ocupación diaria guarda el numerador y el denominador por separado, nunca el porcentaje. Un porcentaje no se puede sumar entre filas, y cualquier informe que agrupe daría un número falso.

La migración a la nube fue un traslado deliberado, sin rediseño. El valor estaba en el modelo, los procedimientos y las medidas del informe, así que los motores de base de datos se movieron sin reescribir nada.

## Arquitectura

El modelo tiene ocho dimensiones y seis tablas de hechos, con 8,6 millones de filas de hechos. La carga incremental se controla con marcas de agua en un esquema aparte. Ese esquema registra cada ejecución, cada etapa y cada rechazo, con su regla y su registro original.

Antes de migrar se ejecutó un piloto con el diez por ciento de los datos, elegido de forma determinista. Así las herramientas se comprobaron sobre datos reales y no sobre una muestra conveniente.

## Resultado

Los cuatro orígenes quedaron en un solo esquema estrella, que el informe consulta sin cruces manuales.

El piloto respondió la pregunta que bloqueaba el diseño: RDS for SQL Server admite grupos de archivos de usuario, así que los scripts migraron sin modificaciones. La restricción de «solo el grupo primario», que casi obligó a rediseñar el modelo, es de Azure SQL Database y no de los servicios gestionados en general.

## Lo que aprendí

La clase de instancia limita antes que el tope de almacenamiento. Una instancia `db.t3.micro` con 995 MB de RAM dejó a SQL Server con 125 MB de memoria objetivo.

Una inserción masiva de 2 923 filas se quedó esperando `RESOURCE_SEMAPHORE` sin recibir concesión. No fallaba: esperaba, sin error y sin agotar el tiempo de espera. Subir un escalón de clase de instancia lo resolvió. Lo difícil fue el diagnóstico, porque un proceso que no falla no deja rastro que buscar.
