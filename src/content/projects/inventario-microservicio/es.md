---
slug: inventario-microservicio
title: Microservicio de inventario | Facturas y catálogo
tagline: Lee facturas en PDF y resuelve productos por su código de barras para una aplicación de inventario sin código.
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

Una empresa cliente lleva su inventario en una aplicación construida sobre una plataforma sin código. Esa plataforma le da los formularios, los permisos y la base de datos, y con eso cubre la operación diaria.

La plataforma no cubre el trabajo que no cabe en un formulario. Ese trabajo es leer una factura en PDF, resolver un producto a partir de su código de barras y mantener la valuación del inventario. Este servicio hace esa parte y escribe el resultado en la misma base de datos que usa la aplicación.

## Problema

Una factura llegaba en PDF y alguien tecleaba cada línea en la aplicación: proveedor, producto, cantidad y precio. Esa transcripción consumía tiempo y producía errores.

Dar de alta un producto era el mismo trabajo manual. La categoría, la unidad, la dimensión y la foto se copiaban a mano desde la página del proveedor, campo por campo.

Además, la página del proveedor no siempre se puede leer de forma automática. Buena parte de las tiendas carga su catálogo con JavaScript, así que pedir el HTML devuelve la estructura de la página sin ningún dato del producto.

## Decisiones técnicas

La primera versión resolvía cada tienda por separado, y lo que servía para una no servía para la siguiente. Por eso la resolución de proveedores pasó a ser una cascada de tres pasos:

1. Un resolutor propio para el dominio que tiene una fuente mejor que su HTML.
2. Un resolutor por plataforma: una sola implementación cubre muchas tiendas que exponen su catálogo de la misma forma.
3. El camino genérico: renderiza la página, usa los datos estructurados de producto si los trae y, si no, extrae los datos del HTML con el modelo.

Con la cascada, un proveedor nuevo pasó a ser una entrada, no un módulo nuevo.

La imagen se tomaba de la vista previa que declara la propia página, y en varias tiendas esa vista previa es el logotipo de la tienda. El catálogo acumuló logotipos donde debía haber productos. Ahora se elige con reglas deterministas por dominio.

El catálogo se escribe a través de la API de la plataforma, no directamente en la base. Así el artículo se crea dentro de la aplicación con sus referencias resueltas. Las demás escrituras van directas, porque no dependen de eso.

El procesamiento de un movimiento de inventario es idempotente. Bloquea la fila, omite lo que ya está contabilizado y se ejecuta de forma síncrona a propósito. Así la aplicación espera a que termine, en lugar de dar por hecho el resultado.

La valuación copia a propósito la lógica que ya tenía la plataforma, sin mejorarla. Dos sistemas escriben sobre el mismo inventario, y que sus valuaciones no coincidan es peor que cualquiera de los dos criterios.

La resolución por código de barras se ejecuta en segundo plano. Con la búsqueda del modelo tarda alrededor de cien segundos, y la plataforma cancela una espera síncrona tan larga.

## Arquitectura

El servicio separa el trabajo externo de la lógica de negocio. Las rutas de la API reciben la llamada y pasan a un grupo de hilos todo lo que bloquea: la descarga, el renderizado, el modelo y la comprobación de duplicados. Así el resto de las peticiones no se detiene.

Detrás hay un solo módulo con la lógica de negocio y las escrituras. Dentro de él, una única función procesa todo movimiento de stock. El neto por recinto, los tramos de valuación y la cantidad global se actualizan juntos o no se actualizan.

Los modelos de datos siguen el esquema y no al revés. La plataforma es dueña de las tablas, así que el servicio no las altera ni las migra.

## Resultado

Una factura entra en PDF y sale como líneas en la aplicación. El proveedor y los productos se resuelven contra el catálogo por coincidencia en cascada, y lo dudoso queda marcado como dudoso en lugar de adivinado.

Un código de barras escaneado devuelve un artículo con su jerarquía, su unidad, su categoría y la imagen real del producto.

Una sola implementación cubre a los proveedores que comparten plataforma, y las tiendas que cargan su catálogo con JavaScript ya no devuelven una página vacía.

## Lo que aprendí

Escribir a través de la API de una plataforma no garantiza que el cambio llegue al dispositivo. El artículo se crea bien, pero la plataforma no envía los cambios a los dispositivos. El cliente solo actualiza los datos cuando sincroniza, y la resolución tarda tanto que el resultado llega después de esa sincronización. Se probaron las opciones que ofrece la propia plataforma, y ninguna da tiempo real.

La decisión fue aceptar la limitación y documentar el motivo, junto con la alternativa y lo que habría que medir antes de intentarla. Documentarlo llevó una tarde, mientras que buscar un tiempo real que la plataforma no ofrece habría ocupado el resto del proyecto.
