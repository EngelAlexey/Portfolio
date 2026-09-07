---
slug: infraestructura-hotelera
title: Hotel chain network | Design and compliance
tagline: Four sites that ran as separate companies come under one design, and compliance decides which guest data may leave for the cloud and which may not.
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
  - RADIUS
  - Azure
  - Cisco Packet Tracer
cover: null
order: null
---

## Context

Integrative Project II. Team design and documentation of the technology infrastructure for a hotel chain with four sites. My contribution was telecommunications, logical network design and regulatory compliance.

The case describes a chain that grew site by site, each solving its own network, and that now needs to operate as one company.

## Problem

Four buildings operated as if they were separate companies. Each site had its own flat network, with no separation between guest and administrative traffic, and no central point of observation.

That has direct consequences for the business. A guest's device shares a path with the front-desk system and with the cameras. Revoking a credential means touching four sites. And there is no way to answer what happened on the network, because nobody is watching it.

## Technical decisions

VLAN segmentation to separate guests, administration, CCTV and voice, which is what cuts the path between a guest device and the operation's systems.

Encrypted point-to-point wireless links between buildings, rather than new cabling across the four sites.

Per-room WiFi with WPA3 and central authentication against RADIUS, so that revoking a credential takes effect across all four sites at once.

A hybrid architecture on Azure. The line was drawn with a single question: what has to keep working with the link down.

## Architecture

Every site repeats the same internal structure: its four segments and its edge firewall. The encrypted point-to-point links join the four buildings and form the backbone.

CCTV travels over its own segment to the recorder and does not share a path with administrative traffic.

Door locks, cameras and the front desk stay at the site, because a hotel with no link still has to be able to receive guests. Reports and backups go to the cloud.

## Result

The topology was built and tested in Cisco Packet Tracer: four sites, their segments and the encrypted backbone between them.

The deliverable documents addressing, access control lists, firewall policy, the high-availability scheme and a risk analysis.

The compliance section fixes where guest data may reside and how long CCTV recordings are kept. That section is what decides what goes to the cloud and what does not, so regulation ended up as an input to the design rather than a later review.

## What I learned

Drawing the VLANs took little time. Defining the access control lists between them took considerably longer, because every rule forces a decision about which part of the business may reach which system.

That part is not networking but business. None of those rules can be written without someone who knows how the hotel operates, so the design advanced at the pace of those answers rather than at the pace of the diagram.
