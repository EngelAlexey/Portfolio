---
slug: infraestructura-hotelera
title: Secure IT infrastructure for a hotel chain
tagline: Documented design of a unified network across four sites, with segmentation, encrypted links and hybrid cloud.
areas: [infra, seguridad]
kind: academico
org: Universidad Técnica Nacional
role: Telecommunications and logical network design
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

## Context

Integrative Project II. A team design and documentation exercise for the technology infrastructure of a four-site hotel chain. My contribution was telecommunications, logical network design and regulatory compliance.

## Problem

Four buildings operating as if they were separate companies: each site on its own flat network, no separation between guest and administrative traffic, and no way to monitor any of it centrally.

## Technical decisions

VLAN segmentation separating guests, administration, CCTV and voice. Encrypted point-to-point wireless links between buildings instead of new cabling. Per-room WiFi on WPA3 authenticated against RADIUS. Centralised CCTV. A hybrid architecture: whatever must keep working without internet stays local, the rest goes to Azure.

## Outcome

Full network documentation — addressing, ACLs, firewall policy, high-availability scheme and risk analysis — with the topology built and tested in Cisco Packet Tracer.

## What I learned

That segmentation is a business decision before it is a technical one: drawing VLANs is cheap, agreeing on who should be allowed to talk to whom is not.
