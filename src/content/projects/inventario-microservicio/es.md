---
slug: inventario-microservicio
title: Microservicio de inventario | Facturas y catálogo
tagline: Complemento de una app de inventario sin código. Digitaliza la factura, resuelve el producto desde su código de barras y mueve el stock por un solo camino.
areas: [ia, datos]
kind: profesional
org: Kaizen Apps CR
role: Desarrollo
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

## Contexto

Una empresa cliente lleva su inventario en una aplicación construida sobre una plataforma sin código. Esa plataforma le da los formularios, los permisos y la base de datos, y eso cubre la operación diaria.

Lo que no cubre es el trabajo que no cabe en un formulario: leer una factura en PDF, resolver un producto a partir de su código de barras o sostener la valuación del inventario. Este servicio es el complemento que hace esa parte y escribe el resultado en la misma base de datos que usa la aplicación.

## Problema

Una factura llegaba como PDF y alguien tecleaba cada línea en la aplicación: proveedor, producto, cantidad y precio. Ahí es donde se iba el tiempo y donde entraban los errores.

Dar de alta un producto era el mismo trabajo manual. Categoría, unidad, dimensión y foto se copiaban a mano desde la página del proveedor, campo por campo.

Y la página del proveedor no siempre se deja leer. Buena parte de las tiendas carga su catálogo por JavaScript, así que pedir el HTML devuelve el cascarón de la página y ninguno de los datos del producto.

## Decisiones técnicas

La primera versión resolvía cada tienda por separado, y lo que servía para una no servía para la siguiente. La resolución de proveedores se reordenó como una cascada de tres pasos. Primero un resolutor propio para el dominio que tiene una fuente mejor que su HTML. Después un resolutor por plataforma, donde una sola implementación cubre muchas tiendas, porque comparten el mismo modo de exponer su catálogo. Y por último el camino genérico: renderizado de la página, datos estructurados de producto si los trae, y extracción con modelo sobre el HTML cuando no los trae. Un proveedor nuevo pasó a ser una entrada, no un módulo.

La imagen tomaba la portada que la página anuncia de sí misma, y en varias tiendas esa portada es el logo de la tienda: el catálogo acumuló logos donde debía haber producto. Se pasó a elegirla con reglas deterministas por dominio.

El catálogo se escribe a través del API de la plataforma y no directo a la base, para que el artículo nazca dentro de la aplicación con sus referencias resueltas. El resto de las escrituras sí van directas, porque no dependen de eso.

El procesamiento de un movimiento de inventario es idempotente. Bloquea la fila, omite lo que ya está contabilizado y corre de forma síncrona a propósito, para que la aplicación espere a que termine en lugar de dar por hecho el resultado.

La valuación replica deliberadamente la lógica que ya tenía la plataforma en vez de mejorarla. Con dos sistemas escribiendo sobre el mismo inventario, la paridad vale más que la corrección: que no coincidan es peor que cualquiera de los dos criterios.

El camino del código de barras corre en segundo plano. La resolución con búsqueda en el modelo tarda alrededor de cien segundos, y la plataforma corta una espera síncrona de ese tamaño.

## Arquitectura

El servicio separa el trabajo externo de la lógica de negocio. Los endpoints reciben la llamada y delegan a un grupo de hilos todo lo que bloquea —descarga, renderizado, modelo, comprobación de duplicados— para no detener el resto de las peticiones.

Detrás hay un solo módulo con la lógica de negocio y las escrituras, y dentro de él una única función por la que pasa todo movimiento de stock: el neto por recinto, los tramos de valuación y la cantidad global se actualizan juntos o no se actualizan.

Los modelos de datos siguen al esquema y no al revés. La plataforma es dueña de las tablas, así que el servicio no las altera ni las migra.

## Resultado

Una factura entra como PDF y sale como líneas en la aplicación, con el proveedor y los productos resueltos contra el catálogo por coincidencia en cascada, y lo dudoso marcado como dudoso en lugar de adivinado.

Un código de barras escaneado devuelve un artículo con su jerarquía, su unidad, su categoría y su imagen real del producto.

Los proveedores que comparten plataforma quedaron cubiertos por una sola implementación, y las tiendas cuyo catálogo se carga por JavaScript dejaron de devolver una página vacía.

## Lo que aprendí

Escribir por el API de una plataforma no es lo mismo que hacer que el cambio llegue al dispositivo. El artículo se crea correctamente, pero la plataforma no empuja los cambios: el cliente solo refresca cuando sincroniza, y la resolución tarda lo suficiente como para aterrizar fuera de esa ventana. Se probaron las opciones que la propia plataforma ofrece y ninguna da tiempo real.

La decisión fue aceptarlo y dejar escrito por qué, junto con la alternativa y lo que habría que medir antes de intentarla. Documentar una limitación con su motivo cuesta una tarde; perseguir una inmediatez que la plataforma no ofrece cuesta el proyecto entero.
