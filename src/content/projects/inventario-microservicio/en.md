---
slug: inventario-microservicio
title: Inventory microservice | Invoices and catalogue
tagline: Reads PDF invoices and resolves products from their barcode for a no-code inventory app.
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

A client company runs its inventory on an application built on a no-code platform. The platform provides the forms, the permissions and the database, and that covers the daily operation.

The platform does not cover the work that does not fit in a form. That work is reading a PDF invoice, resolving a product from its barcode and maintaining the inventory valuation. This service does that part and writes the result into the same database the application uses.

## Problem

An invoice arrived as a PDF and someone typed every line into the application: supplier, product, quantity and price. That transcription took time and introduced errors.

Creating a product was the same manual work. The category, unit, dimension and photo were copied by hand from the supplier's page, field by field.

On top of that, the supplier's page cannot always be read automatically. A good share of the shops load their catalogue with JavaScript, so requesting the HTML returns the page structure without any product data.

## Technical decisions

The first version resolved each shop separately, and what worked for one did not work for the next. Supplier resolution was therefore reorganised as a three-step cascade:

1. A dedicated resolver for the domain that has a better source than its HTML.
2. A platform resolver: a single implementation covers many shops that expose their catalogue the same way.
3. The generic path: it renders the page, uses the structured product data if there is any and, if not, extracts the data from the HTML with the model.

With the cascade, a new supplier became an entry rather than a new module.

The image was taken from the preview the page itself declares, and on several shops that preview is the shop's logo. The catalogue accumulated logos where the products should be. It is now chosen by deterministic rules per domain.

The catalogue is written through the platform's API, not straight to the database. That way the item is created inside the application with its references resolved. Every other write goes direct, because it does not depend on that.

Processing an inventory movement is idempotent. It locks the row, skips whatever is already posted and runs synchronously on purpose. The application therefore waits for it to finish instead of assuming the outcome.

The valuation copies the platform's existing logic on purpose, without improving it. Two systems write to the same inventory, and having their valuations disagree is worse than either criterion.

Barcode resolution runs in the background. With the model's search it takes around a hundred seconds, and the platform cancels a synchronous wait that long.

## Architecture

The service separates external work from business logic. The API routes take the call and hand everything that blocks to a thread pool: the download, the rendering, the model and the duplicate check. The remaining requests are therefore not held up.

Behind that sits a single module with the business logic and the writes. Inside it, one function processes every stock movement. The net per site, the valuation tiers and the global quantity are updated together or not at all.

The data models follow the schema, not the other way round. The platform owns the tables, so the service neither alters nor migrates them.

## Result

An invoice goes in as a PDF and comes out as lines in the application. The supplier and the products are resolved against the catalogue by cascading matches, and anything doubtful is marked as doubtful instead of guessed.

A scanned barcode returns an item with its hierarchy, its unit, its category and the real product image.

A single implementation covers the suppliers that share a platform, and shops that load their catalogue with JavaScript no longer return an empty page.

## What I learned

Writing through a platform's API does not guarantee that the change reaches the device. The item is created correctly, but the platform does not send changes to the devices. The client only refreshes its data when it syncs, and resolution takes so long that the result arrives after that sync. The options the platform itself offers were tested, and none gives real time.

The decision was to accept the limitation and document the reason, together with the alternative and what would have to be measured before trying it. Documenting it took an afternoon, whereas chasing a real time the platform does not offer would have taken the rest of the project.
