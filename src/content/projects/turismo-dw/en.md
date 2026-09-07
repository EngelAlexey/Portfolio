---
slug: turismo-dw
title: TurismoDW | Data warehouse and cloud migration
tagline: Four incompatible sources, including files deliberately malformed so validation had something to reject, become queryable in one star schema.
areas: [datos, infra]
kind: academico
org: Universidad Técnica Nacional
role: Data engineering
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

## Context

An Advanced Databases project, built by a team of four. I took the analytical base, the ETL and the report, and then the full cloud migration. My teammates carried partitioning and indexes, high availability, and performance and documentation.

## Problem

The data lived in four places with incompatible shapes: an operational relational database, a document store holding reviews and web interactions, and loose files in two formats.

A share of those files arrived deliberately malformed, so that validation had something real to reject. Querying the four sources together was not a matter of writing a bigger query.

## Technical decisions

A Python process extracts each source into flat files. From there they are bulk-loaded into a staging area and then into the model's tables.

Every dimension carries a "not applicable" row. With it, all joins can be inner joins and no fact row disappears because one source was incomplete.

Daily occupancy stores numerator and denominator separately and never the percentage, because a percentage cannot be summed across rows.

## Architecture

Eight dimensions and six fact tables, holding 8.6 million fact rows. Incremental loading is controlled with watermarks in a separate control schema. That schema records every run, every stage and every rejection, with its rule and its original record.

The migration was a deliberate rehost, with no redesign. The value was in the model, the procedures and the report's measures, so the engines moved and nothing was rewritten. A pilot with ten percent of the data, selected deterministically, ran first to verify the tooling.

## Result

The pilot answered the question that was blocking the design: RDS for SQL Server does support user filegroups, so the scripts migrated without modification.

The "primary filegroup only" restriction that nearly forced a redesign belongs to Azure SQL Database, not to managed services in general.

## What I learned

The instance class binds before the storage cap does. A `db.t3.micro` instance with 995 MB of RAM left SQL Server with a 125 MB target memory.

A bulk insert of 2,923 rows sat waiting on `RESOURCE_SEMAPHORE` with no grant. It was not failing: it was waiting, with no error and no timeout. Moving up one instance class resolved it, and the diagnosis was the expensive part.
