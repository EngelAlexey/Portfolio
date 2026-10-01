---
slug: directorio-activo
title: Dominio Windows Server | Directorio activo y políticas
tagline: Red empresarial de laboratorio donde cada departamento recibe sus permisos y su configuración desde un solo servidor.
areas: [infra]
kind: academico
org: Universidad Técnica Nacional
role: Directorio activo y permisos
period:
  start: '2024-09'
  end: '2024-12'
tier: ficha
home: false
visibility: publico
repo: null
site: null
stack:
  - Windows Server
  - Active Directory
  - DNS
  - DHCP
  - IIS
  - FTP
  - GPO
cover: null
order: null
---

## Contexto

Es un proyecto en equipo de cuatro del curso Plataformas Tecnológicas II. El equipo montó y documentó una red empresarial simulada sobre Windows Server. Un servidor hace de controlador de dominio y da los servicios de red a varias estaciones unidas al dominio.

Mi parte fue el directorio activo: promover el servidor a controlador de dominio y crear la estructura de departamentos, los usuarios y los permisos de carpeta. Mis compañeros se encargaron de DNS, FTP sobre IIS y DHCP.

## Problema

El ejercicio parte de una administración descentralizada. Cada computadora tiene sus propias cuentas, permisos y configuraciones. No hay un lugar desde el cual definir quién es quién ni qué puede tocar cada persona.

Antes de configurar nada hay que decidir cómo se corresponde la estructura de la empresa, con sus departamentos y sus personas, con la estructura del dominio. De esa correspondencia dependen después los permisos, las políticas y las carpetas.

## Decisiones técnicas

El dominio se organiza en unidades organizativas, una por departamento, en lugar de una lista plana de usuarios. Las políticas y los permisos se aplican sobre la unidad. Quien entra en un departamento recibe toda su configuración, sin ajustes caso por caso.

Los permisos de carpeta se asignan por grupo de departamento, no por usuario. Donde hace falta, la herencia está desactivada para que una unidad no alcance las carpetas de otra.

Las políticas de grupo fijan en las estaciones lo que no debe quedar a criterio del usuario. Mapean las unidades de red, ponen el fondo corporativo sin permiso para cambiarlo y bloquean la instalación de software. Todo eso está en la política de la unidad, así que una estación recibe su configuración por pertenecer al departamento.

## Arquitectura

Un servidor concentra los cuatro roles. Es controlador de dominio con el directorio activo y servidor DNS para resolver los nombres de la red y los externos. También es servidor FTP sobre IIS, con acceso por grupos del dominio, y servidor DHCP para las estaciones. El ámbito del DHCP está acotado: un rango con sus exclusiones y su plazo de concesión.

Las estaciones se unen al dominio y reciben su dirección del DHCP, sus permisos del directorio y su configuración de las políticas de grupo. Ninguna guarda cuentas ni reglas propias, porque todo se resuelve contra el servidor.

## Resultado

La red quedó montada y probada:

- los usuarios inician sesión con su cuenta de dominio desde cualquier estación;
- cada departamento llega a sus carpetas y no a las de los demás;
- las estaciones reciben su dirección y sus políticas al unirse al dominio;
- la red resuelve nombres internos y externos.

La separación de carpetas se comprobó iniciando sesión con cada cuenta desde una estación, no leyendo la configuración del servidor. La entrega documenta cada rol paso a paso, con el plan de trabajo y el cronograma del equipo, así que la configuración se puede reproducir.

## Lo que aprendí

La parte más larga fue decidir la estructura de unidades organizativas, antes de instalar ningún rol. Con una buena estructura, los permisos y las políticas se aplican sobre ella sin trabajo adicional. Con una mala, cada permiso se convierte en un caso aparte.

Por eso los permisos se escribieron sobre el departamento. Un permiso escrito sobre el departamento sirve para quien está hoy y para quien entre mañana. Escrito sobre una persona, hay que rehacerlo cada vez que alguien cambia de puesto.
