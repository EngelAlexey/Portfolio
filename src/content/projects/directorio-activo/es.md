---
slug: directorio-activo
title: Dominio Windows Server | Directorio activo y políticas
tagline: "Una red empresarial de laboratorio con un servidor al centro: dominio, usuarios por departamento, permisos de carpeta y políticas de grupo que gobiernan las estaciones."
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

Curso de Plataformas Tecnológicas II. En equipo de cuatro, montamos y documentamos una red empresarial simulada sobre Windows Server: un servidor como controlador de dominio, sus servicios de red y varias estaciones unidas al dominio.

Me tocó el directorio activo: promover el servidor a controlador de dominio, la estructura de departamentos, los usuarios y los permisos de carpeta. Mis compañeros llevaron DNS, FTP sobre IIS y DHCP.

## Problema

El ejercicio parte de la administración descentralizada: cada equipo con sus propias cuentas, sus propios permisos y sus propias configuraciones, sin un lugar desde el cual definir quién es quién ni qué puede tocar cada quien.

Eso obliga a resolver antes de configurar nada una sola pregunta: cómo se corresponde la estructura de la empresa —sus departamentos y sus personas— con la estructura del dominio, porque de esa correspondencia dependen después los permisos, las políticas y las carpetas.

## Decisiones técnicas

El dominio se organiza en unidades organizativas, una por departamento, y no como una lista plana de usuarios. Esa es la decisión que sostiene el resto: las políticas y los permisos se aplican sobre la unidad, así que agregar a alguien a un departamento le hereda todo lo suyo sin configurar nada caso por caso.

Los permisos de carpeta se definen por grupo de departamento, no por usuario, y se desactiva la herencia donde haría falta para que una unidad no alcance las carpetas de otra. Un usuario de un departamento llega a lo suyo y a nada más, y eso se comprueba iniciando sesión con su cuenta desde una estación, no leyendo la configuración del servidor.

Las políticas de grupo bajan a las estaciones lo que no debería quedar a criterio del usuario: las unidades de red mapeadas, el fondo corporativo sin permiso de cambiarlo y el bloqueo de instalación de software. Todo eso vive en la política de la unidad, de modo que la estación hereda su configuración por el solo hecho de pertenecer al departamento.

## Arquitectura

Un servidor concentra los cuatro roles. Es controlador de dominio con el directorio activo, y servidor DNS para resolver los nombres de la red y los externos. Es también servidor FTP sobre IIS, con acceso por grupos del dominio. Y es servidor DHCP para las estaciones, con un ámbito acotado: un rango con sus exclusiones y su plazo de concesión.

Las estaciones se unen al dominio y reciben su dirección del DHCP, sus permisos del directorio y su configuración de las políticas de grupo. Ninguna guarda cuentas ni reglas propias: todo se resuelve contra el servidor.

## Resultado

La red quedó montada y probada: usuarios que entran con su cuenta de dominio desde cualquier estación, carpetas que cada departamento alcanza y otros no, estaciones que reciben su dirección y sus políticas al unirse, y resolución de nombres interna y externa.

La entrega documenta cada rol paso a paso, con el plan de trabajo y el cronograma del equipo, de modo que la configuración se puede reproducir y no solo describir.

## Lo que aprendí

La parte larga no fue instalar los roles sino decidir la estructura de unidades organizativas antes de tocarlos. Una vez puesta, los permisos y las políticas caen solos sobre ella; mal puesta, cada permiso se vuelve un caso aparte.

Administrar por grupo y no por usuario es lo que hace sostenible una red así. Un permiso escrito sobre el departamento sirve para quien esté hoy y para quien entre mañana; escrito sobre la persona, hay que rehacerlo cada vez que alguien se mueve.
