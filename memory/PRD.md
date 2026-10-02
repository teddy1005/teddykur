# PRD — POP Network Monitoring & Topology

## Original Problem Statement
Build an ISP/FTTH NOC web app to monitor MikroTik devices per POP (CPU/RAM/uptime/interfaces/traffic/latency/packet loss), determine POP UP/DOWN, model backbone cable links, and AUTOMATICALLY derive each link's status via graph topology (never manual). Must not mark downstream POPs down when an alternative path exists. Provide dashboard graph view, geographic map view (switchable map provider: OSM/Google), POP & link CRUD from the map, alerts/event log, and configurable thresholds. Scalable to hundreds of POPs.

## Architecture
- **Stack**: React 19 + FastAPI + MongoDB (Motor async).
- **3 tiers**: Web UI ↔ REST API (+ JWT auth, RBAC) ↔ async Monitoring Engine (background worker). Shared DB.
- **Monitoring engine** (`monitor.py`): async worker loop started on FastAPI startup. Each cycle collects metrics (real RouterOS REST / SNMP / ICMP best-effort, simulation fallback), stores time-series (TTL 24h), runs topology engine, records status-transition alerts, broadcasts over WebSocket.
- **Topology engine** (`topology.py`): undirected graph; a link is traversable only when both endpoints' routers reachable AND both endpoint interfaces up; BFS reachability from core POPs decides alternative-path survival. Status: UP/DEGRADED/DOWN/UNKNOWN + reason (ROUTER_DOWN/INTERFACE_DOWN/LINK_UNREACHABLE/HIGH_LATENCY/PACKET_LOSS/ALTERNATIVE_PATH/OK). Never claims a cut without evidence (router down → UNKNOWN).
- **Map abstraction**: provider stored in `map_settings`; Leaflet renders OSM (default, keyless), CARTO dark, or Google tiles. POP coords/links/polylines are provider-independent.
- **Real-time**: WebSocket push + React Query polling fallback (chosen for simplicity/stability in NOC).
- **Security**: JWT httpOnly cookies, RBAC (admin/operator/viewer), MikroTik credentials Fernet-encrypted, never returned to frontend (only `has_credentials`), brute-force lockout, input validation.

## Data Model (MongoDB)
users, pops (config + derived current state + interfaces[] + simulation), links (endpoints + route polyline + derived status), monitoring_checks (TTL), latency_history (TTL), alerts, monitoring_settings, map_settings, login_attempts.

## User Personas
- **Admin**: full CRUD, settings, users, map provider.
- **Operator**: CRUD POP/link, run checks, resolve alerts, simulate faults (no delete).
- **Viewer**: read-only NOC monitoring.

## Implemented (2026-06, MVP complete)
- JWT auth + RBAC (admin/operator/viewer); admin seeded as teddykurnia10@gmail.com.
- Monitoring engine (async worker) with simulation of 5 demo POPs (A–E) + 5 links forming a multi-path graph.
- Topology/graph engine with BFS alternative-path reachability (validated: single link cut keeps POPs up; isolation → DOWN/LINK_UNREACHABLE; router down → links UNKNOWN).
- Dashboard (KPIs, POP cards, event feed, top latency/CPU/RAM), Topology (React Flow), Map (Leaflet, add POP, draw link polyline, drag marker, provider switch), Links CRUD, Alerts timeline + resolve, Monitoring settings/thresholds + manual run, Settings (map provider + user management).
- Fault-injection demo tool (`/api/monitoring/simulate-fault`) — status still engine-derived.
- Backend tested 100% (24 pytest cases); frontend 95% (all flows pass).

## Backlog
- **P1**: WebSocket upgrade through preview ingress (currently falls back to polling). Real MikroTik on-prem connectivity (REST/SNMP paths implemented, need live device). Per-interface traffic history charts.
- **P2**: SNMP collector full parsing; Google Maps API key config UI; alert notifications (email/Telegram); CSV/export; map polyline editing of existing links.

## Key Endpoints
Auth: /api/auth/{login,logout,me,register,users}. POP: /api/pops [CRUD], /{id}/{interfaces,metrics,latency}. Links: /api/links [CRUD]. /api/topology, /api/dashboard, /api/alerts (+resolve), /api/settings, /api/map-settings, /api/monitoring/{check,simulate-fault}, WS /api/ws.
