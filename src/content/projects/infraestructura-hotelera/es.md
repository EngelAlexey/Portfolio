---
slug: infraestructura-hotelera
title: Red para cadena hotelera
tagline: Cuatro sedes bajo un mismo diseño, con segmentación por VLAN, enlaces cifrados y nube híbrida.
areas: [infra, seguridad]
kind: academico
org: Universidad Técnica Nacional
role: Telecomunicaciones, diseño lógico y cumplimiento
period:
  start: '2025'
  end: '2025'
tier: ficha
home: false
visibility: publico
repo: null
site: null
stack:
  - VLAN
  - Firewall
  - WPA3
  - RADIUS
  - Azure
  - Cisco Packet Tracer
cover: null
order: null
---

## Contexto

Proyecto Integrador II. Diseño y documentación, en equipo, de la infraestructura tecnológica de una cadena hotelera con cuatro sedes. Mi aporte fue telecomunicaciones, diseño lógico de la red y cumplimiento normativo.

## Problema

Cuatro edificios operando como si fueran empresas distintas. Cada sede tenía su propia red plana, sin separación entre el tráfico de huéspedes y el administrativo, y sin ningún punto de observación centralizado.

## Decisiones técnicas

Segmentación por VLAN para separar huéspedes, administración, CCTV y voz.

Enlaces inalámbricos punto a punto cifrados entre edificios, en lugar de tendido nuevo. WiFi por habitación con WPA3 y autenticación contra RADIUS. CCTV centralizado.

Arquitectura híbrida sobre Azure: lo que debe seguir funcionando sin enlace queda local, el resto va a la nube.

## Arquitectura

Cada sede repite la misma estructura interna: sus cuatro segmentos y su cortafuegos de borde. Los enlaces punto a punto cifrados unen los cuatro edificios y forman la troncal.

La autenticación de los huéspedes no vive en cada punto de acceso sino en un servicio central. El punto de acceso pregunta; no decide.

El CCTV viaja por su propio segmento hasta el grabador y no comparte camino con el tráfico administrativo.

El corte entre lo local y la nube se trazó con una sola pregunta: qué tiene que seguir funcionando con el enlace caído. Cerraduras, cámaras y recepción quedan en la sede; informes y respaldos suben.

## Resultado

Documentación completa de la red: direccionamiento, listas de control de acceso, política de cortafuegos, esquema de alta disponibilidad y análisis de riesgos. La topología quedó montada y probada en Cisco Packet Tracer.

## Lo que aprendí

Dibujar las VLAN tomó poco tiempo. Definir las listas de control de acceso entre ellas tomó bastante más, porque cada regla obliga a decidir qué área puede alcanzar qué sistema.
