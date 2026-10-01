---
slug: infraestructura-hotelera
title: Red para cadena hotelera | Diseño y cumplimiento
tagline: Red única para cuatro hoteles en la que la normativa decide qué datos del huésped pueden salir a la nube.
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

Es el Proyecto Integrador II, hecho en un equipo de cuatro. El equipo diseñó y documentó la infraestructura tecnológica de una cadena hotelera, con un tope de veinte mil dólares de inversión. La entrega incluye también una estimación del costo operativo anual.

La cadena tiene cuatro hoteles de cinco pisos, con veinte habitaciones por piso, a unos tres kilómetros entre sí.

Mi aporte fue la parte de telecomunicaciones, el diseño lógico de la red y el cumplimiento normativo.

## Problema

Cada hotel resuelve por su cuenta el WiFi, la televisión y las cámaras, sin administración común. Varios edificios no tienen red ni WiFi. No hay una configuración que se pueda estandarizar ni un punto desde el cual supervisar los cuatro hoteles.

Eso tiene consecuencias directas. Los servicios que el huésped da por supuestos no existen o funcionan a medias. Dar de baja una credencial obliga a cambiarla en cada sede. Tampoco se puede saber qué pasó en la red, porque nadie la supervisa.

Con ese punto de partida, sumar un quinto hotel significa volver a empezar.

## Decisiones técnicas

La red se segmenta por VLAN: administración, huéspedes, televisión sobre IP y CCTV. Entre esos dominios rige una política de denegar por defecto, con listas de control de acceso en los switches y en el borde. Así, el dispositivo de un huésped no alcanza los sistemas de la operación, y el movimiento lateral queda limitado si un atacante entra.

Hay dos mecanismos de autenticación distintos, porque hay dos poblaciones distintas. El personal entra por un SSID corporativo con WPA3-Enterprise y tramas de gestión protegidas. Se autentica por 802.1X con EAP-TLS contra un servidor RADIUS, que además asigna la VLAN según el perfil.

El huésped entra por un portal cautivo con credenciales temporales. Tiene aislamiento entre clientes en el punto de acceso, un límite de ancho de banda y una lista de control que solo le permite salir a internet. Con la autenticación centralizada, dar de baja una credencial tiene efecto en las cuatro sedes a la vez.

Entre edificios hay enlaces inalámbricos punto a punto, en lugar de cable nuevo a lo largo de tres kilómetros. Usan la banda de 24 GHz en lugar de la de 60 GHz, porque se degrada menos con la lluvia. Forman una estrella con el hotel principal como concentrador. El medio de radio se trata como no confiable, así que el tráfico va cifrado de extremo a extremo con IPsec, además del cifrado del propio enlace.

La arquitectura es híbrida. La división entre la sede y la nube se decidió con una sola pregunta: qué tiene que seguir funcionando si el enlace cae.

El cumplimiento normativo entró en el diseño desde el principio. El portal cautivo no sirve para cobrar. Existe porque la normativa de telecomunicaciones exige identificar al usuario de una red pública. La ley de protección de datos fija la retención de las grabaciones y la señalización de las cámaras. La misma normativa de telecomunicaciones acota las bandas y las potencias de los enlaces.

La entrega recoge además los estándares de cableado, PoE y WiFi que fijan las distancias y el equipo. También recoge los principios de ISO 27001 que ordenan la segmentación, el respaldo y la gestión de incidentes.

## Arquitectura

Cada edificio repite la misma estructura. En cada piso hay un router y sus switches de acceso, troncal y respaldo, y en el primero están los servidores de base de datos. El router principal del hotel concentra los cinco pisos, los dos proveedores de internet y los tres enlaces punto a punto hacia los demás edificios.

El tráfico del CCTV usa su propio segmento hasta el grabador de la sede y no comparte ruta con el tráfico administrativo.

En la sede se queda lo que no puede depender del enlace:

- las cámaras y su grabador;
- los puntos de acceso y los switches;
- la televisión de las habitaciones;
- los enlaces entre edificios.

A la nube van los respaldos de la base de datos, solo los eventos críticos del CCTV, el controlador que administra los puntos de acceso y el archivo de largo plazo.

## Resultado

La topología lógica quedó montada en Cisco Packet Tracer. El modelo recorre el edificio principal piso por piso, con el proveedor y los otros tres edificios como extremos, porque los cuatro hoteles son idénticos por diseño. El plano físico ubica cada equipo sobre la planta y cuantifica lo que hay que comprar.

La entrega documenta la segmentación, las listas de control de acceso, la política de cortafuegos, el esquema de alta disponibilidad y el análisis de riesgos. Además reparte la compra en tres fases para ajustarse al presupuesto: la primera cubre lo que el sistema necesita para funcionar, y las siguientes, el resto.

El apartado de cumplimiento fija dónde se puede guardar el dato del huésped y cuánto tiempo se conservan las grabaciones. Ese apartado decide también qué se sube a la nube.

## Lo que aprendí

Dibujar las VLAN llevó poco tiempo. Definir las listas de control de acceso entre ellas llevó bastante más, porque cada regla obliga a decidir qué área de la empresa puede alcanzar qué sistema.

Esas decisiones dependen de cómo opera el hotel, así que ninguna regla se pudo escribir sin alguien que conociera esa operación. Por eso el avance del diseño dependió de esas respuestas.
