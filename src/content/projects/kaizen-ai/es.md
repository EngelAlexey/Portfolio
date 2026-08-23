---
slug: kaizen-ai
title: Kaizen AI
tagline: Consulta de datos empresariales en lenguaje natural, con la seguridad resuelta en el servidor.
areas: [ia, seguridad]
kind: profesional
org: Kaizen Apps CR
role: Desarrollo
period:
  start: '2025-09'
  end: '2026-07'
tier: ficha
home: true
visibility: privado
repo: null
demo: null
stack:
  - Next.js
  - TypeScript
  - Vercel AI SDK
  - Upstash Vector
  - Cohere rerank
  - Drizzle ORM
  - MySQL
  - Google Cloud Run
cover: null
order: 1
---

<script>
	import SecurityLayers from '$lib/components/SecurityLayers.svelte';
</script>

## Contexto

Lo empecé con muy poca experiencia y lo reconstruí desde cero cuatro veces. Cada versión incorporó lo que la anterior no sabía hacer. Es el proyecto donde aprendí a diseñar la seguridad en lugar de añadirla al final.

## Problema

Dejar que un modelo consulte datos productivos plantea una pregunta que no se resuelve con un buen prompt: **quién puede leer qué**. Si la respuesta depende de que el modelo se comporte, no hay respuesta.

## Decisiones técnicas

La consulta en lenguaje natural se traduce a SQL y se sanea en el servidor con un reescritor AST que inyecta tres niveles de filtro en cada consulta antes de ejecutarla. El modelo propone; el servidor acota. Ninguna decisión de visibilidad vive en el prompt.

## Arquitectura

<SecurityLayers
	nodes={['Pregunta', 'Modelo', 'SQL propuesto', 'Reescritor AST', 'SQL ejecutado', 'Datos permitidos']}
	gate={3}
	layers={[
		{
			name: 'Base de datos del cliente',
			body: 'Cada consulta queda acotada a la base del cliente que pregunta. Un usuario de una empresa no alcanza los datos de otra, aunque el SQL generado lo pidiera explícitamente.'
		},
		{
			name: 'Rol de la sesión',
			body: 'Desarrollador, administrador y usuario ven conjuntos distintos. El filtro se inyecta según el rol autenticado, no según lo que el modelo crea que corresponde.'
		},
		{
			name: 'Alcance de la acción',
			body: 'La acción concreta acota el resultado una vez más. Lo que el modelo propone es una intención; el alcance efectivo lo decide el servidor.'
		}
	]}
	caption="Los tres filtros se inyectan en el árbol sintáctico de la consulta, no se comprueban después."
/>

## Resultado

Sobre esa base: control de acceso para desarrollador, administrador y usuario, saneamiento de datos sensibles, auditoría de cada consulta, y RAG con piso de relevancia para que el sistema prefiera callar antes que inventar.

## Lo que aprendí

Que la seguridad que se añade al final se nota, y la que se diseña desde el principio se demuestra. Las cuatro reescrituras no fueron tiempo perdido: cada una movió una decisión de seguridad del prompt al código.
