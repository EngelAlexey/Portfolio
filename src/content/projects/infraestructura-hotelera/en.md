---
slug: infraestructura-hotelera
title: Hotel chain network | Design and compliance
tagline: A single network for four hotels, where regulation decides which guest data may leave for the cloud.
areas: [infra, seguridad]
kind: academico
org: Universidad Técnica Nacional
role: Network design
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
    alt: "Floor plan of the main building's first floor, with cameras, access points, switches, UPS and server room placed on it"
    caption: "Physical topology. The main building's floor plan, with every device counted and placed."
  - src: /img/shots/ih-logica.jpg
    alt: "The complete logical topology in Cisco Packet Tracer, with the main building's five floors and the other three buildings as endpoints"
    caption: "Logical topology. The main building's five floors; the other three buildings and the ISP sit as endpoints."
  - src: /img/shots/ih-pisos.jpg
    alt: "Detail of two floors of the logical topology, with the floor router, the backbone switch, the standby switch and the database servers"
    caption: "One floor in detail. Router, backbone switch, standby switch and, on the first, the database servers."
  - src: /img/shots/ih-troncal.jpg
    alt: "The main router with its link to the internet provider and its links to the other three buildings"
    caption: "The backbone. The main router concentrates the provider link and the three point-to-point links between buildings."
order: null
---

## Context

Integrative Project II, done in a team of four. The team designed and documented the technology infrastructure of a hotel chain, with a cap of twenty thousand dollars of investment. The delivery also includes an estimate of the annual running cost.

The chain has four hotels of five floors, with twenty rooms per floor, about three kilometres apart.

My contribution was the telecommunications work, the logical network design and regulatory compliance.

## Problem

Each hotel handles its own WiFi, television and cameras, with no common administration. Several buildings have no network or WiFi. There is no configuration that can be standardised and no single point from which to monitor the four hotels.

That has direct consequences. The services a guest takes for granted are missing or half working. Revoking a credential means changing it at each site. Nor is there any way to know what happened on the network, because nobody monitors it.

From that starting point, adding a fifth hotel means starting over.

## Technical decisions

The network is segmented by VLAN: administration, guests, television over IP and CCTV. A deny-by-default policy applies between those domains, with access control lists on the switches and at the border. A guest's device therefore cannot reach the systems the business runs on, and lateral movement is limited if an attacker gets in.

There are two different authentication mechanisms, because there are two different populations. Staff connect through a corporate SSID with WPA3-Enterprise and protected management frames. They authenticate over 802.1X with EAP-TLS against a RADIUS server, which also assigns the VLAN by profile.

Guests connect through a captive portal with temporary credentials. They get client isolation at the access point, a bandwidth cap and an access list that only lets them reach the internet. With authentication centralised, revoking a credential takes effect at all four sites at once.

Point-to-point wireless links connect the buildings, instead of new cable across three kilometres. They use the 24 GHz band rather than 60 GHz, because it degrades less in rain. They form a star with the main hotel as the hub. The radio medium is treated as untrusted, so traffic is encrypted end to end with IPsec, on top of the link's own encryption.

The architecture is hybrid. The split between the site and the cloud was decided with a single question: what has to keep working if the link goes down.

Regulatory compliance was part of the design from the start. The captive portal is not there to charge guests. It exists because telecommunications regulation requires identifying the user of a public network. The data protection act sets the retention of recordings and the camera signage. The same telecommunications regulation bounds the bands and transmit powers of the links.

The delivery also collects the cabling, PoE and WiFi standards that set distances and equipment. It also collects the ISO 27001 principles that organise segmentation, backup and incident handling.

## Architecture

Every building repeats the same structure. Each floor has a router and its access, backbone and standby switches, and the first floor holds the database servers. The hotel's main router concentrates the five floors, the two internet providers and the three point-to-point links to the other buildings.

CCTV traffic uses its own segment to the site's recorder and does not share a route with administrative traffic.

Whatever cannot depend on the link stays on site:

- the cameras and their recorder;
- the access points and switches;
- the television in the rooms;
- the links between buildings.

The cloud receives the database backups, only the critical CCTV events, the controller that manages the access points and the long-term archive.

## Result

The logical topology was built in Cisco Packet Tracer. The model covers the main building floor by floor, with the provider and the other three buildings as endpoints, because the four hotels are identical by design. The physical plan places every device on the floor plan and quantifies what has to be bought.

The delivery documents the segmentation, the access control lists, the firewall policy, the high-availability scheme and the risk analysis. It also splits the purchase into three phases to fit the budget: the first covers what the system needs in order to work, and the others the rest.

The compliance section sets where guest data may be stored and how long recordings are kept. That section also decides what goes to the cloud.

## What I learned

Drawing the VLANs took little time. Defining the access control lists between them took considerably longer, because every rule forces a decision about which area of the business may reach which system.

Those decisions depend on how the hotel operates, so no rule could be written without someone who knew that operation. The progress of the design therefore depended on those answers.
