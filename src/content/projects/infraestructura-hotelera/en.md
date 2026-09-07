---
slug: infraestructura-hotelera
title: Hotel chain network | Design and compliance
tagline: Four hotels with no shared network move to a single design, and compliance decides which guest data may leave for the cloud and which may not.
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

Integrative Project II. Team design and documentation, four of us, of the technology infrastructure of a hotel chain: four hotels of five floors and twenty rooms per floor, some three kilometres apart, capped at twenty thousand dollars of investment plus an estimate of the annual running cost.

My contribution was telecommunications, logical network design and regulatory compliance.

## Problem

Each hotel handles its own WiFi, television and cameras, with no common administration, and several of the buildings have no network or WiFi at all. There is no configuration that can be standardised, and no single point from which to watch the four.

That has direct consequences. The services a guest takes for granted are either missing or half working. Revoking a credential means touching each site. And there is no way to answer what happened on the network, because nobody is watching it.

Adding a fifth hotel, from that starting point, means starting over.

## Technical decisions

VLAN segmentation: administration, guests, television over IP and CCTV, with a deny-by-default policy between domains and access control lists on the switches and at the border. That is what cuts the path between a guest's device and the systems the business runs on, and what limits lateral movement if something does get in.

Two different authentication mechanisms, because there are two different populations. Staff come in on a corporate SSID with WPA3-Enterprise and protected management frames, authenticated over 802.1X with EAP-TLS against a RADIUS server that also assigns the VLAN by profile. Guests come in through a captive portal with temporary credentials, client isolation at the access point, a bandwidth cap and an access list that lets them reach the internet and nothing else. With authentication centralised, revoking a credential takes effect across all four sites at once.

Point-to-point wireless links between buildings instead of new cable across three kilometres: the 24 GHz band ahead of 60 GHz, which degrades less in rain, in a star with the main hotel as the hub. The radio medium is treated as untrusted, so traffic is encrypted end to end with IPsec on top of the hop's own encryption.

A hybrid architecture. The line was drawn with a single question: what has to keep working with the link down.

Compliance came in as an input to the design rather than as a later review. The captive portal is not there to charge for anything; it is there because telecommunications regulation requires identifying the user of a public network. Recording retention and camera signage come out of the data protection act, and the bands and transmit powers of the links are bounded by the same regulation. The delivery also collects the cabling, PoE and WiFi standards that fix distances and equipment, and the ISO 27001 principles that order segmentation, backup and incident handling.

## Architecture

Every building repeats the same structure: per floor, a router and its access, backbone and standby switches; on the first, the database servers. The hotel's main router concentrates the five floors, the two internet providers and the three point-to-point links to the other buildings.

CCTV travels on its own segment to the site's recorder and does not share a path with administrative traffic.

What cannot depend on the link stays on site: the cameras and their recorder, the access points and switches, the room television and the links between buildings. What goes to the cloud is the database backups, only the critical CCTV events, the controller that administers the access points, and the long-term archive.

## Result

The logical topology was built in Cisco Packet Tracer. The main building was modelled floor by floor, with the provider and the other three buildings as endpoints, because the four hotels are identical by design. The physical plan places every device on the floor plan and quantifies what has to be bought.

The delivery documents the segmentation, the access control lists, the firewall policy, the high-availability scheme and a risk analysis, and splits the purchase into three phases to fit the budget: first what the system needs in order to exist at all, then the rest.

The compliance section fixes where guest data may live and how long recordings are kept. That section is what decides what goes to the cloud and what does not.

## What I learned

Drawing the VLANs took little time. Defining the access control lists between them took considerably longer, because every rule forces a decision about which area of the business may reach which system.

That part is not networking but business. None of those rules can be written without someone who knows how the hotel operates, so the design advanced at the pace of those answers and not at the pace of the diagram.
