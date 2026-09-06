---
slug: infraestructura-hotelera
title: Hotel chain network
tagline: Four sites under one design, with VLAN segmentation, encrypted links and hybrid cloud.
areas: [infra, seguridad]
kind: academico
org: Universidad Técnica Nacional
role: Telecommunications and logical network design
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
  - VPN
  - WPA3
  - RADIUS
  - Azure
  - Cisco Packet Tracer
cover: null
order: null
---

## Context

Integrative Project II. Team design and documentation of the IT infrastructure for a hotel chain with four sites. My contribution was telecommunications, logical network design and regulatory compliance.

## Problem

Four buildings operating as if they were separate companies. Each site had its own flat network, with no separation between guest and administrative traffic, and no centralised point of observation.

## Technical decisions

VLAN segmentation to separate guests, administration, CCTV and voice.

Encrypted point-to-point wireless links between buildings instead of new cabling. Per-room WiFi with WPA3 and authentication against RADIUS. Centralised CCTV.

A hybrid architecture: whatever must keep working with the link down stays local, the rest goes to the cloud.

## Architecture

Each site repeats the same internal structure: its four segments and its edge firewall. The encrypted point-to-point links join the four buildings and form the backbone.

Guest authentication does not live in each access point but in a central service. The access point asks; it does not decide.

CCTV travels over its own segment to the recorder and shares no path with administrative traffic.

The line between local and cloud was drawn with one question: what has to keep working with the link down. Locks, cameras and reception stay on site; reports and backups go up.

## Result

Full network documentation: addressing, access control lists, firewall policy, a high-availability scheme and a risk analysis. The topology was built and tested in Cisco Packet Tracer.

## What I learned

Drawing the VLANs took little time. Defining the access control lists between them took considerably longer, because every rule forces a decision about which area may reach which system.
