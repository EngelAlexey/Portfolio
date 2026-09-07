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

An Advanced Databases project, in a team of four. I took the analytical database, the ETL and the report, and later the full migration to the cloud. My teammates covered partitioning and indexes, high availability, and performance and documentation.

The case describes a tourism operation whose data accumulated in separate systems, bought or built at different times, and that now needs a single view to make decisions on.

## Problem

The data lived in four places with incompatible shapes: an operational relational database, a document database with reviews and web interactions, and loose files in two formats.

Answering a single business question meant querying each source separately and cross-referencing the results by hand, which meant no answer was reproducible.

Some of those files arrived deliberately malformed, so that validation had something to reject and the process was not designed assuming clean data.

## Technical decisions

A Python process extracts each source to flat files. From there they go in batches to a staging area and then into the model's tables.

Every dimension carries a "not applicable" row. With it, all joins can be inner joins and no fact row disappears because a source was incomplete, which is the error that makes a report balance while undercounting.

Daily occupancy stores numerator and denominator separately and never the percentage, because a percentage cannot be summed across rows and any report that grouped would produce a false number.

The move to the cloud was a deliberate lift, with no redesign. The value sat in the model, the procedures and the report's measures, so the engines were moved without rewriting any of it.

## Architecture

Eight dimensions and six fact tables, with 8.6 million fact rows. Incremental loading is controlled by watermarks in a separate schema, which records every run, every stage and every rejection with its rule and its original record.

Before migrating, a pilot ran on ten per cent of the data, chosen deterministically, to test the tooling against real data rather than a convenient sample.

## Result

The four sources ended up in a single star schema, queryable from the report with nothing cross-referenced by hand.

The pilot answered the question that was blocking the design: RDS for SQL Server supports user filegroups, so the scripts migrated unmodified. The "primary filegroup only" restriction, which nearly forced a redesign of the model, belongs to Azure SQL Database and not to managed services in general.

## What I learned

Instance class becomes the limit before the storage ceiling does. A `db.t3.micro` instance with 995 MB of RAM left SQL Server with a 125 MB target memory.

A bulk insert of 2,923 rows sat waiting on `RESOURCE_SEMAPHORE` without being granted. It was not failing: it was waiting, with no error and no timeout. Moving up one instance class fixed it, and the diagnosis was the expensive part, because a process that does not fail leaves no trace to search for.
