---
slug: directorio-activo
title: Windows Server domain | Active Directory and policy
tagline: "A lab enterprise network with one server at its centre: the domain, users by department, folder permissions and group policies that govern the workstations."
areas: [infra]
kind: academico
org: Universidad Técnica Nacional
role: Active Directory and permissions
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

## Context

Technology Platforms II course. In a team of four, we built and documented a simulated enterprise network on Windows Server: a server acting as domain controller, its network services and several workstations joined to the domain.

Mine was the directory: promoting the server to domain controller, the department structure, the users and the folder permissions. My teammates took DNS, FTP over IIS and DHCP.

## Problem

The exercise starts from decentralised administration: every machine with its own accounts, its own permissions and its own settings, with no single place to define who is who or what each person may touch.

That forces one question to be answered before anything is configured: how the company's structure — its departments and its people — maps onto the domain's structure, because the permissions, the policies and the folders all hang off that mapping.

## Technical decisions

The domain is organised into organisational units, one per department, rather than as a flat list of users. That is the decision the rest rests on: policies and permissions apply to the unit, so adding someone to a department inherits everything of theirs without configuring it case by case.

Folder permissions are set per department group, not per user, and inheritance is disabled where needed so one unit cannot reach another's folders. A user in one department reaches their own and nothing else, and that is verified by signing in with their account from a workstation, not by reading the server's configuration.

Group policies push to the workstations what should not be left to the user: the mapped network drives, the corporate wallpaper with no permission to change it, and the block on installing software. All of it lives in the unit's policy, so a workstation inherits its configuration by the mere fact of belonging to the department.

## Architecture

One server concentrates the four roles. It is domain controller with the directory, and DNS server to resolve the network's names and external ones. It is also FTP server over IIS, with access by domain groups. And it is DHCP server for the workstations, with a bounded scope: a range with its exclusions and its lease term.

The workstations join the domain and receive their address from DHCP, their permissions from the directory and their configuration from the group policies. None of them holds accounts or rules of its own: everything resolves against the server.

## Result

The network was built and tested: users signing in with their domain account from any workstation, folders each department reaches and others do not, workstations receiving their address and policies on joining, and name resolution both internal and external.

The delivery documents each role step by step, with the team's work plan and schedule, so the configuration can be reproduced and not merely described.

## What I learned

The long part was not installing the roles but deciding the organisational-unit structure before touching them. Once it is in place, permissions and policies fall onto it on their own; badly placed, every permission becomes a separate case.

Administering by group rather than by user is what makes a network like this sustainable. A permission written against the department serves whoever is there today and whoever joins tomorrow; written against the person, it has to be redone every time someone moves.
