---
slug: infraestructura-hotelera
title: Infraestructura de TI segura para cadena hotelera
tagline: Diseño documentado de una red unificada para cuatro sedes, con segmentación, enlaces cifrados y nube híbrida.
areas: [infra, seguridad]
kind: academico
org: Universidad Técnica Nacional
role: Telecomunicaciones y diseño lógico de red
period:
  start: '2025'
  end: '2025'
tier: ficha
home: true
visibility: publico
repo: null
demo: null
stack:
  - VLAN
  - Firewall
  - VPN
  - WPA3
  - RADIUS
  - Azure
  - Cisco Packet Tracer
cover: null
order: 2
---

## Contexto

Proyecto Integrador II. Diseño y documentación, en equipo, de la infraestructura tecnológica de una cadena hotelera con cuatro sedes. Mi aporte fue telecomunicaciones, diseño lógico de la red y cumplimiento normativo.

## Problema

Cuatro edificios que operan como si fueran empresas distintas: cada sede con su propia red plana, sin separación entre el tráfico de huéspedes y el administrativo, y sin forma de vigilar nada de manera centralizada.

## Decisiones técnicas

Segmentación por VLAN para separar huéspedes, administración, CCTV y voz. Enlaces inalámbricos punto a punto cifrados entre edificios en lugar de tendido nuevo. WiFi por habitación con WPA3 y autenticación contra RADIUS. CCTV centralizado. Arquitectura híbrida: lo que debe seguir funcionando sin internet queda local, lo demás va a Azure.

## Resultado

Documentación completa de la red: direccionamiento, ACLs, política de firewall, esquema de alta disponibilidad y análisis de riesgos, con la topología montada y probada en Cisco Packet Tracer.

## Lo que aprendí

Que la segmentación es una decisión de negocio antes que técnica: cuesta poco dibujar VLANs y cuesta mucho acordar quién debe poder hablar con quién.
