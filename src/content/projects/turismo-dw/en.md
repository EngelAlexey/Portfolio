---
slug: turismo-dw
title: TurismoDW | Data warehouse and cloud migration
tagline: Four incompatible data sources, with files malformed on purpose, brought together in a single analytical model.
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

A project for the Advanced Databases course, done in a team of four. My part was the analytical database, the ETL and the report, and later the full migration to the cloud. My teammates handled partitioning and indexes, high availability, and performance and documentation.

The case describes a tourism operation whose data accumulated in separate systems, bought or built at different times. It now needs a single view to make decisions on.

## Problem

The data sat in four places with incompatible shapes: an operational relational database, a document database with reviews and web interactions, and loose files in two formats.

Answering a single business question meant querying each source separately and cross-referencing the results by hand, so no answer was reproducible.

Some of those files arrived malformed on purpose, so that validation had something to reject and the process was not designed on the assumption of clean data.

## Technical decisions

A Python process extracts each source to flat files. From there, the data moves in batches to a staging area and then into the model's tables.

Every dimension has a "not applicable" row. With it, all joins can be inner joins and no fact row disappears because a source is incomplete. Losing those rows produces a report that balances but undercounts.

Daily occupancy stores the numerator and the denominator separately, never the percentage. A percentage cannot be summed across rows, and any report that grouped them would produce a false number.

The move to the cloud was a deliberate lift, with no redesign. The value sat in the model, the procedures and the report's measures, so the database engines were moved without rewriting anything.

## Architecture

The model has eight dimensions and six fact tables, with 8.6 million fact rows. Incremental loading is controlled by watermarks in a separate schema. That schema records every run, every stage and every rejection, with its rule and its original record.

Before migrating, a pilot ran on ten per cent of the data, chosen deterministically. That way the tooling was tested against real data rather than a convenient sample.

## Result

The four sources ended up in a single star schema, which the report queries with no manual cross-referencing.

The pilot answered the question that was blocking the design: RDS for SQL Server supports user filegroups, so the scripts migrated unmodified. The "primary filegroup only" restriction, which nearly forced a redesign of the model, belongs to Azure SQL Database and not to managed services in general.

## What I learned

Instance class becomes the limit before the storage ceiling does. A `db.t3.micro` instance with 995 MB of RAM left SQL Server with a 125 MB target memory.

A bulk insert of 2,923 rows sat waiting on `RESOURCE_SEMAPHORE` without being granted. It was not failing: it was waiting, with no error and no timeout. Moving up one instance class fixed it. The hard part was the diagnosis, because a process that does not fail leaves no trace to search for.
