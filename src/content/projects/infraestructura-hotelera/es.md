---
slug: infraestructura-hotelera
title: Red para cadena hotelera | Diseño y cumplimiento
tagline: Cuatro sedes que operaban como empresas distintas pasan a un solo diseño, y el cumplimiento decide qué dato del huésped puede salir a la nube y cuál no.
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
  - RADIUS
  - Azure
  - Cisco Packet Tracer
cover: null
order: null
---

## Contexto

Proyecto Integrador II. Diseño y documentación, en equipo, de la infraestructura tecnológica de una cadena hotelera con cuatro sedes. Mi aporte fue telecomunicaciones, diseño lógico de la red y cumplimiento normativo.

El caso plantea una cadena que creció sede a sede, cada una resolviendo su red por su cuenta, y que ahora necesita operar como una sola empresa.

## Problema

Cuatro edificios operaban como si fueran empresas distintas. Cada sede tenía su red plana, sin separación entre el tráfico de huéspedes y el administrativo, y sin ningún punto de observación centralizado.

Eso tiene consecuencias directas para el negocio. El dispositivo de un huésped comparte camino con el sistema de recepción y con las cámaras. Dar de baja una credencial obliga a tocar cuatro sedes. Y no hay forma de responder qué pasó en la red, porque nadie la está mirando.

## Decisiones técnicas

Segmentación por VLAN para separar huéspedes, administración, CCTV y voz, que es lo que corta el camino entre el dispositivo del huésped y los sistemas de la operación.

Enlaces inalámbricos punto a punto cifrados entre edificios, en lugar de tendido nuevo entre las cuatro sedes.

WiFi por habitación con WPA3 y autenticación central contra RADIUS, para que dar de baja una credencial surta efecto en las cuatro sedes a la vez.

Arquitectura híbrida sobre Azure. El corte se trazó con una sola pregunta: qué tiene que seguir funcionando con el enlace caído.

## Arquitectura

Cada sede repite la misma estructura interna: sus cuatro segmentos y su cortafuegos de borde. Los enlaces punto a punto cifrados unen los cuatro edificios y forman la troncal.

El CCTV viaja por su propio segmento hasta el grabador y no comparte camino con el tráfico administrativo.

Cerraduras, cámaras y recepción quedan en la sede, porque un hotel sin enlace tiene que poder seguir recibiendo huéspedes. Informes y respaldos suben a la nube.

## Resultado

La topología quedó montada y probada en Cisco Packet Tracer: cuatro sedes, sus segmentos y la troncal cifrada entre ellas.

La entrega documenta direccionamiento, listas de control de acceso, política de cortafuegos, esquema de alta disponibilidad y análisis de riesgos.

El apartado de cumplimiento fija dónde puede residir el dato del huésped y cuánto tiempo se conservan las grabaciones de CCTV. Ese apartado es el que decide qué se sube a la nube y qué no, así que la normativa quedó como una entrada del diseño y no como una revisión posterior.

## Lo que aprendí

Dibujar las VLAN tomó poco tiempo. Definir las listas de control de acceso entre ellas tomó bastante más, porque cada regla obliga a decidir qué área de la empresa puede alcanzar qué sistema.

Esa parte no es de red sino de negocio. Ninguna de esas reglas se puede escribir sin alguien que conozca la operación del hotel, así que el diseño avanzó al ritmo de esas respuestas y no al del diagrama.
