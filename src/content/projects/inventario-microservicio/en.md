---
slug: inventario-microservicio
title: Inventory microservice | Invoices and catalogue
tagline: The complement to a no-code inventory app. It digitises the invoice, resolves the product from its barcode and moves stock through a single path.
areas: [ia, datos]
kind: profesional
org: Kaizen Apps CR
role: Development
period:
  start: '2026-02'
  end: '2026-06'
tier: ficha
home: false
visibility: privado
repo: null
site: null
stack:
  - Python
  - FastAPI
  - SQLAlchemy
  - MySQL
  - Gemini
  - Cloudflare Browser Rendering
  - Render
cover: null
order: null
---

## Context

A client runs its inventory on an application built over a no-code platform. The platform gives it the forms, the permissions and the database, and that covers the daily operation.

What it does not cover is the work that does not fit in a form: reading a PDF invoice, resolving a product from its barcode, or holding the inventory valuation. This service is the complement that does that part and writes the result into the same database the application uses.

## Problem

An invoice arrived as a PDF and someone typed every line into the application: supplier, product, quantity and price. That is where the time went and where the errors came in.

Creating a product was the same manual work. Category, unit, dimension and photo were copied by hand from the supplier's page, field by field.

And the supplier's page does not always let itself be read. A good share of the shops load their catalogue over JavaScript, so asking for the HTML returns the shell of the page and none of the product data.

## Technical decisions

The first version resolved each shop separately, and what worked for one did not work for the next. Supplier resolution was reordered as a three-step cascade. First a dedicated resolver for the domain that has a better source than its own HTML. Then a platform resolver, where a single implementation covers many shops, because they share the same way of exposing their catalogue. And finally the generic path: render the page, use structured product data if it carries any, and extract with the model over the HTML when it does not. A new supplier became an entry rather than a module.

The image was taken from the preview the page advertises of itself, and on several shops that preview is the shop's own logo: the catalogue accumulated logos where the product should be. It is now chosen by deterministic rules per domain.

The catalogue is written through the platform's API rather than straight to the database, so the item is born inside the application with its references resolved. Every other write goes direct, because it does not depend on that.

Processing an inventory movement is idempotent. It locks the row, skips whatever is already posted, and runs synchronously on purpose, so the application waits for it to finish rather than assuming the outcome.

Valuation deliberately mirrors the logic the platform already had, rather than improving on it. With two systems writing over the same inventory, parity is worth more than correctness: disagreeing is worse than either criterion.

The barcode path runs in the background. Resolution with search grounding in the model takes around a hundred seconds, and the platform cuts off a synchronous wait that long.

## Architecture

The service separates external work from business logic. The endpoints take the call and hand off to a thread pool everything that blocks — download, rendering, model, duplicate checking — so the remaining requests are not held up.

Behind that sits a single module with the business logic and the writes, and inside it one function every stock movement passes through: the net per site, the valuation buckets and the global quantity are updated together or not at all.

The data models follow the schema, not the other way round. The platform owns the tables, so the service neither alters nor migrates them.

## Result

An invoice goes in as a PDF and comes out as lines in the application, with the supplier and the products resolved against the catalogue by a cascade of matches, and anything doubtful marked as doubtful rather than guessed.

A scanned barcode returns an item with its hierarchy, its unit, its category and a real photo of the product.

Suppliers sharing a platform ended up covered by a single implementation, and shops whose catalogue loads over JavaScript stopped returning an empty page.

## What I learned

Writing through a platform's API is not the same as making the change reach the device. The item is created correctly, but the platform does not push changes: the client only refreshes when it syncs, and resolution takes long enough to land outside that window. The options the platform itself offers were tested, and none of them gives real time.

The decision was to accept it and write down why, together with the alternative and what would have to be measured before attempting it. Documenting a limitation with its reason costs an afternoon; chasing an immediacy the platform does not offer costs the whole project.
