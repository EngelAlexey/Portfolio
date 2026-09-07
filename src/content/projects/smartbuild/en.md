---
slug: smartbuild
title: Smart Build | Construction management
tagline: Budget, payroll, subcontracts and expenses for each site in one system, with real cost set against what was budgeted.
areas: [fullstack]
kind: academico
org: Universidad Técnica Nacional
role: Web client development
period:
  start: '2025-07'
  end: '2025-09'
tier: ficha
home: false
visibility: publico
repo: https://github.com/ITI-524-ProyectoIntegrador-2-25/ConstruApp
site: null
stack:
  - React
  - JavaScript
  - Bootstrap
  - ASP.NET Core
  - Dapper
  - SQL Server
cover: null
order: null
---

## Context

Integrative Project I, in a team of five. Smart Build brings together in one system everything a construction site costs: the budget, the payroll, the subcontracts and their payments, raw materials and additional expenses. My contribution was the web client.

The case sets out a construction firm that runs every site separately and cannot say how much a project has spent without collecting the figure from three different places.

## Problem

The real cost of a site lives scattered. The week's payroll, the payments to the subcontractor, raw materials and additional expenses are each recorded on their own, so setting them against the budget is manual work that happens late or does not happen at all.

Payroll is the part that goes wrong most. Every employee has their hours, their insurance and their deductions, and net pay comes out of chaining all of it together: one wrong row is enough for the payment to be wrong.

## Technical decisions

Validation is declared as a schema and consumed by the form, rather than scattering checks field by field. A new form declares its schema and inherits the same error behaviour as the rest.

Payroll was split into two screens: the listing and the per-employee detail, where insurance and net pay are computed as you type. Seeing the number before saving is what stops the error being discovered when the employee complains.

Listings are paginated instead of fetching everything at once. A site accumulates hundreds of expense and payroll lines, and the view had to open as quickly at the end of the project as at the start.

The interface is responsive and the sidebar collapses, because a site gets checked from a phone rather than from a desk.

## Architecture

Client and server are separate. The client is a React application consuming an ASP.NET Core API, with one controller per entity: clients, contacts, employees, payroll and its detail, budgets, subcontracts, payments, raw materials, additional expenses and activities.

Data access goes through Dapper over SQL Server, with the queries written by hand rather than mapped automatically. The server's models are split by area, and the client follows that same split in its navigation.

## Result

The system covers the life of a site: the client is registered, the budget is drawn up, and payroll, subcontracts, raw materials and additional expenses are recorded against that project, with export to PDF and to spreadsheet.

On the client side what remained was a shared base across screens: the same validation schema, the same paginated table and the same detail form for each entity, rather than one implementation per screen.

## What I learned

A form is not validated at the field, it is validated at the schema. While each screen resolved its own rules, two forms asked for the same value with different messages, and fixing it meant touching both.

In a team of five that is what sets the pace. Declaring the rule once and having the form consume it stopped the same work being multiplied across five people.
