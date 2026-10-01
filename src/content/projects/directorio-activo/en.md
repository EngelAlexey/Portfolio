---
slug: directorio-activo
title: Windows Server domain | Active Directory and policy
tagline: A lab enterprise network where each department gets its permissions and configuration from a single server.
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

A project for the Technology Platforms II course, in a team of four. The team built and documented a simulated enterprise network on Windows Server. One server acts as domain controller and provides the network services to several workstations joined to the domain.

My part was Active Directory: promoting the server to domain controller and creating the department structure, the users and the folder permissions. My teammates handled DNS, FTP over IIS and DHCP.

## Problem

The exercise starts from decentralised administration. Each computer has its own accounts, permissions and settings. There is no single place to define who is who or what each person may touch.

Before configuring anything, the team has to decide how the company's structure, with its departments and its people, maps onto the domain's structure. The permissions, the policies and the folders all depend on that mapping.

## Technical decisions

The domain is organised into organisational units, one per department, instead of a flat list of users. Policies and permissions apply to the unit. Whoever joins a department receives all of its configuration, with no case-by-case adjustments.

Folder permissions are assigned per department group, not per user. Where needed, inheritance is disabled so that one unit cannot reach another's folders.

Group policies set on the workstations whatever should not be left to the user. They map the network drives, apply the corporate wallpaper with no permission to change it and block software installation. All of that sits in the unit's policy, so a workstation receives its configuration by belonging to the department.

## Architecture

One server holds the four roles. It is the domain controller with Active Directory and the DNS server that resolves the network's names and external ones. It is also the FTP server over IIS, with access by domain groups, and the DHCP server for the workstations. The DHCP scope is bounded: a range with its exclusions and its lease term.

The workstations join the domain and receive their address from DHCP, their permissions from the directory and their configuration from the group policies. None of them holds accounts or rules of its own, because everything resolves against the server.

## Result

The network was built and tested:

- users sign in with their domain account from any workstation;
- each department reaches its own folders and not the others';
- workstations receive their address and policies when they join the domain;
- the network resolves internal and external names.

The folder separation was verified by signing in with each account from a workstation, not by reading the server's configuration. The delivery documents each role step by step, with the team's work plan and schedule, so the configuration can be reproduced.

## What I learned

The longest part was deciding the organisational-unit structure, before installing any role. With a sound structure, permissions and policies apply to it with no extra work. With a poor one, every permission becomes a separate case.

That is why the permissions were written against the department. A permission written against the department serves whoever is there today and whoever joins tomorrow. Written against a person, it has to be redone every time someone changes role.
