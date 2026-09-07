---
slug: infraestructura-hotelera
title: Red para cadena hotelera | Diseño y cumplimiento
tagline: Cuatro hoteles sin red común pasan a un solo diseño, y el cumplimiento decide qué dato del huésped puede salir a la nube y cuál no.
areas: [infra, seguridad]
kind: academico
org: Universidad Técnica Nacional
role: Diseño de red
period:
  start: '2025-09'
  end: '2025-12'
tier: ficha
home: false
visibility: publico
repo: null
site: null
stack:
  - VLAN
  - Firewall
  - WPA3
  - 802.1X
  - RADIUS
  - IPsec
  - Azure
  - Cisco Packet Tracer
cover: null
shots:
  - src: /img/shots/ih-planta.jpg
    alt: "Planta del primer piso del edificio principal, con la ubicación de cámaras, puntos de acceso, switches, UPS y cuarto de servidores"
    caption: "Topología física. La planta del edificio principal, con el conteo y la ubicación de cada equipo."
  - src: /img/shots/ih-logica.jpg
    alt: "Topología lógica completa en Cisco Packet Tracer, con los cinco pisos del edificio principal y los otros tres edificios como extremos"
    caption: "Topología lógica. Los cinco pisos del edificio principal; los otros tres edificios y el proveedor quedan como extremos."
  - src: /img/shots/ih-pisos.jpg
    alt: "Detalle de dos pisos de la topología lógica, con el router de piso, el switch troncal, el de respaldo y los servidores de base de datos"
    caption: "Detalle de piso. Router, switch troncal, switch de respaldo y, en el primero, los servidores de base de datos."
  - src: /img/shots/ih-troncal.jpg
    alt: "Router principal con el enlace hacia el proveedor de Internet y los enlaces hacia los otros tres edificios"
    caption: "La troncal. El router principal concentra el enlace del proveedor y los tres enlaces punto a punto entre edificios."
order: null
---

## Contexto

Proyecto Integrador II. Diseño y documentación, en equipo de cuatro, de la infraestructura tecnológica de una cadena hotelera: cuatro hoteles de cinco pisos y veinte habitaciones por piso, separados unos tres kilómetros entre sí, con un tope de veinte mil dólares de inversión y una estimación del costo operativo anual.

Mi aporte fue telecomunicaciones, diseño lógico de la red y cumplimiento normativo.

## Problema

Cada hotel resuelve por su cuenta el WiFi, la televisión y las cámaras, sin administración común, y varios de los edificios no tienen red ni WiFi del todo. No hay una configuración que se pueda estandarizar, ni un punto desde el cual mirar los cuatro.

Eso tiene consecuencias directas. Los servicios que el huésped da por supuestos no existen o funcionan a medias. Dar de baja una credencial obliga a tocar cada sede. Y no hay forma de responder qué pasó en la red, porque nadie la está mirando.

Sumar un quinto hotel, con ese punto de partida, significa volver a empezar.

## Decisiones técnicas

Segmentación por VLAN: administración, huéspedes, televisión sobre IP y CCTV, con política de denegar por defecto entre dominios y listas de control de acceso en los switches y en el borde. Es lo que corta el camino entre el dispositivo del huésped y los sistemas de la operación, y lo que limita el movimiento lateral si algo entra.

Dos mecanismos de autenticación distintos, porque son dos poblaciones distintas. El personal entra por un SSID corporativo con WPA3-Enterprise y tramas de gestión protegidas, autenticado por 802.1X con EAP-TLS contra un servidor RADIUS que además asigna la VLAN según el perfil. El huésped entra por un portal cautivo con credenciales temporales, aislamiento entre clientes en el punto de acceso, límite de ancho de banda y una lista de control que solo le permite salir a Internet. Con la autenticación centralizada, dar de baja una credencial surte efecto en las cuatro sedes a la vez.

Enlaces inalámbricos punto a punto entre edificios en lugar de tendido nuevo a lo largo de tres kilómetros: banda de 24 GHz por delante de 60 GHz, que se degrada menos con lluvia, en estrella con el hotel principal como concentrador. El medio de radio se trata como no confiable, así que el tráfico va cifrado extremo a extremo con IPsec por encima del cifrado del propio salto.

Arquitectura híbrida. El corte se trazó con una sola pregunta: qué tiene que seguir funcionando con el enlace caído.

El cumplimiento entró como entrada del diseño y no como revisión posterior. El portal cautivo no está para cobrar, está porque la normativa de telecomunicaciones exige identificar al usuario de una red pública; la retención de las grabaciones y la señalización de las cámaras salen de la ley de protección de datos; y las bandas y potencias de los enlaces están acotadas por la misma normativa. La entrega recoge además los estándares de cableado, PoE y WiFi que fijan las distancias y el equipo, y los principios de ISO 27001 que ordenan la segmentación, el respaldo y la gestión de incidentes.

## Arquitectura

Cada edificio repite la misma estructura: por piso, un router y sus switches de acceso, troncal y respaldo; en el primero, los servidores de base de datos. El router principal del hotel concentra los cinco pisos, los dos proveedores de Internet y los tres enlaces punto a punto hacia los demás edificios.

El CCTV viaja por su propio segmento hasta el grabador de la sede y no comparte camino con el tráfico administrativo.

Se queda en la sede lo que no puede depender del enlace: las cámaras y su grabador, los puntos de acceso y switches, la televisión de las habitaciones y los enlaces entre edificios. Suben a la nube los respaldos de la base de datos, únicamente los eventos críticos de CCTV, el controlador que administra los puntos de acceso y el archivo de largo plazo.

## Resultado

La topología lógica quedó montada en Cisco Packet Tracer. Se modeló el edificio principal piso por piso, con el proveedor y los otros tres edificios como extremos, porque los cuatro hoteles son idénticos por diseño. El plano físico ubica cada equipo sobre la planta y cuantifica lo que hay que comprar.

La entrega documenta la segmentación, las listas de control de acceso, la política de cortafuegos, el esquema de alta disponibilidad y el análisis de riesgos, y reparte la compra en tres fases para caber en el presupuesto: primero lo que hace falta para que el sistema exista, después lo demás.

El apartado de cumplimiento fija dónde puede residir el dato del huésped y cuánto tiempo se conservan las grabaciones. Ese apartado es el que decide qué se sube a la nube y qué no.

## Lo que aprendí

Dibujar las VLAN tomó poco tiempo. Definir las listas de control de acceso entre ellas tomó bastante más, porque cada regla obliga a decidir qué área de la empresa puede alcanzar qué sistema.

Esa parte no es de red sino de negocio. Ninguna de esas reglas se puede escribir sin alguien que conozca la operación del hotel, así que el diseño avanzó al ritmo de esas respuestas y no al del diagrama.
