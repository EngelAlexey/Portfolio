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

Integrative Project I, done in a team of five. Smart Build brings together in one system everything a construction site costs: the budget, the payroll, the subcontracts and their payments, raw materials and additional expenses. My contribution was the web client.

The case describes a construction firm that runs every site separately. It cannot say how much a project has spent without collecting the figure from three different places.

## Problem

The real cost of a site is scattered. The week's payroll, the payments to the subcontractor, raw materials and additional expenses are each recorded on their own. Setting them against the budget is therefore manual work that happens late or not at all.

Payroll is where most errors appear. Every employee has their hours, their insurance and their deductions, and net pay comes from chaining all of that together. One wrong row is enough for the payment to be wrong.

## Technical decisions

Validation is declared as a schema and applied by the form, instead of scattering checks field by field. A new form declares its schema and inherits the same error behaviour as the rest.

Payroll was split into two screens: the listing and the per-employee detail, where insurance and net pay are calculated while typing. Seeing the number before saving avoids discovering the error when the employee complains.

Listings are paginated instead of fetching everything at once. A site accumulates hundreds of expense and payroll lines, and the view had to open as quickly at the end of the project as at the start.

The interface is responsive and the sidebar collapses, because a site is checked from a phone rather than from a desk.

## Architecture

The client and the server are separate. The client is a React application that consumes an ASP.NET Core API, with one controller per entity. There are controllers for clients, contacts, employees, payroll and its detail, budgets, subcontracts, payments, raw materials, additional expenses and activities.

Data access uses Dapper over SQL Server, with the queries written by hand instead of mapped automatically. The server's models are split by area, and the client follows that same split in its navigation.

## Result

The system covers the life cycle of a site. The client is registered, the budget is drawn up and payroll, subcontracts, raw materials and additional expenses are recorded against that project. The data can be exported to PDF and to a spreadsheet.

The client ended up with a base shared across screens, instead of one implementation per screen. Each entity uses the same validation schema, the same paginated table and the same detail form.

## What I learned

A form's validation belongs in the schema, not in each field. While each screen resolved its own rules, two forms asked for the same value with different messages, and fixing it meant touching both.

In a team of five, that duplicated work set the pace. Declaring the rule once and having the form apply it stopped the same work being repeated across five people.
