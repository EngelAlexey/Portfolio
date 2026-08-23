---
slug: kaizen-ai
title: Kaizen AI
tagline: Natural-language querying over business data, with security resolved on the server.
areas: [ia, seguridad]
kind: profesional
org: Kaizen Apps CR
role: Development
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

## Context

I started it with very little experience and rebuilt it from scratch four times. Each version absorbed what the previous one could not do. This is the project where I learned to design security rather than bolt it on at the end.

## Problem

Letting a model query production data raises a question no prompt can settle: **who is allowed to read what**. If the answer depends on the model behaving, there is no answer.

## Technical decisions

The natural-language question is translated to SQL and sanitised on the server by an AST rewriter that injects three layers of filter into every query before it runs. The model proposes; the server bounds. No visibility decision lives in the prompt.

## Architecture

<SecurityLayers
	nodes={['Question', 'Model', 'Proposed SQL', 'AST rewriter', 'Executed SQL', 'Permitted data']}
	gate={3}
	layers={[
		{
			name: 'Client database',
			body: 'Every query is bounded to the database of the client asking. A user at one company cannot reach another company’s data, even if the generated SQL asked for it outright.'
		},
		{
			name: 'Session role',
			body: 'Developer, administrator and user see different sets. The filter is injected from the authenticated role, not from what the model believes applies.'
		},
		{
			name: 'Action scope',
			body: 'The specific action narrows the result once more. What the model proposes is an intent; the effective scope is decided by the server.'
		}
	]}
	caption="The three filters are injected into the query's syntax tree, not checked afterwards."
/>

## Outcome

On that base: role-based access for developer, administrator and user, sanitisation of sensitive data, an audit record for every query, and RAG with a relevance floor so the system prefers silence over invention.

## What I learned

That security added at the end shows, and security designed from the start can be demonstrated. The four rewrites were not wasted time: each one moved a security decision out of the prompt and into the code.
