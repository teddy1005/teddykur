"""Monitoring engine.

Runs as an async background worker (NOT from HTTP requests). Each cycle it
collects metrics for every POP (real RouterOS REST / SNMP / ICMP when a device
is reachable, otherwise a realistic simulation profile), stores time-series
history, runs the topology engine to derive POP/link status, records status
transitions as alerts, and pushes an update over WebSocket.
"""
import asyncio
import logging
import random
import uuid
from datetime import datetime, timezone

from db import db, get_settings
from topology import compute_topology
from ws import manager
from security import decrypt_secret
from notifications import notify_down

logger = logging.getLogger(__name__)

try:
    from icmplib import async_ping  # type: ignore

    HAS_ICMP = True
except Exception:  # pragma: no cover
    HAS_ICMP = False

_engine_task = None


def now_iso():
    return datetime.now(timezone.utc).isoformat()


# ---------------------------------------------------------------------------
# Real device collectors (best-effort; cloud usually cannot reach private IPs)
# ---------------------------------------------------------------------------
async def _real_ping(ip, timeout, retry):
    if not HAS_ICMP or not ip:
        return {"reachable": False, "latency": None, "loss": 100}
    try:
        host = await async_ping(ip, count=max(2, retry), timeout=timeout, privileged=False)
        return {
            "reachable": host.is_alive,
            "latency": round(host.avg_rtt, 2) if host.is_alive else None,
            "min": round(host.min_rtt, 2) if host.is_alive else None,
            "max": round(host.max_rtt, 2) if host.is_alive else None,
            "loss": round(host.packet_loss * 100, 1),
        }
    except Exception as e:
        logger.warning("ping failed %s: %s", ip, e)
        return {"reachable": False, "latency": None, "loss": 100}


import re


def parse_uptime(s):
    if not s:
        return 0
    units = {"w": 604800, "d": 86400, "h": 3600, "m": 60, "s": 1}
    total = 0
    for num, u in re.findall(r"(\d+)([wdhms])", str(s)):
        total += int(num) * units[u]
    return total


def _rest_session(pop, timeout):
    import requests
    from requests.auth import HTTPBasicAuth

    ip = pop.get("mikrotik_ip")
    port = pop.get("api_port") or 443
    user = pop.get("username") or ""
    pwd = decrypt_secret(pop.get("password_enc", ""))
    scheme = "http" if str(port) == "80" else "https"
    base = f"{scheme}://{ip}:{port}/rest"
    auth = HTTPBasicAuth(user, pwd)
    return base, auth, requests, timeout


def _collect_rest(pop, timeout):
    """RouterOS v7 REST collector (threadpool). Returns resource+identity+interfaces."""
    base, auth, requests, t = _rest_session(pop, timeout)

    def g(path):
        return requests.get(f"{base}{path}", auth=auth, timeout=t, verify=False)

    out = {}
    r = g("/system/resource")
    r.raise_for_status()
    out["resource"] = r.json()
    for key, path in (("identity", "/system/identity"), ("routerboard", "/system/routerboard"), ("interfaces", "/interface")):
        try:
            resp = g(path)
            out[key] = resp.json() if resp.status_code == 200 else {}
        except Exception:
            out[key] = [] if key == "interfaces" else {}
    return out


def _snmp_sysdescr(pop, timeout):
    """Best-effort SNMP sysDescr GET. Raises on failure / missing lib."""
    from pysnmp.hlapi import (
        SnmpEngine, CommunityData, UdpTransportTarget, ContextData, ObjectType, ObjectIdentity, getCmd,
    )

    community = decrypt_secret(pop.get("snmp_community_enc", "")) or "public"
    ip = pop.get("mikrotik_ip")
    port = pop.get("api_port") or 161
    it = getCmd(
        SnmpEngine(), CommunityData(community, mpModel=1),
        UdpTransportTarget((ip, int(port)), timeout=timeout, retries=1),
        ContextData(), ObjectType(ObjectIdentity("1.3.6.1.2.1.1.1.0")),
    )
    errInd, errStat, errIdx, varBinds = next(it)
    if errInd or errStat:
        raise RuntimeError(str(errInd or errStat))
    return str(varBinds[0][1])


# ---------------------------------------------------------------------------
# Simulation
# ---------------------------------------------------------------------------
def _simulate(pop, interval):
    sim = pop.get("simulation", {}) or {}
    fault = sim.get("fault", {}) or {}
    router_down = bool(fault.get("router_down"))
    ifaces_down = set(fault.get("interfaces_down", []))

    ram_total = sim.get("ram_total", 1024)
    interfaces = []
    rx_total = pop.get("rx_total", 0)
    tx_total = pop.get("tx_total", 0)

    if router_down:
        for i in pop.get("interfaces", []):
            interfaces.append({**i, "status": "unknown"})
        return {
            "router_up": False,
            "reachable": False,
            "latency": None,
            "latency_min": None,
            "latency_max": None,
            "packet_loss": 100.0,
            "cpu": 0,
            "ram_total": ram_total,
            "ram_used": 0,
            "ram_free": ram_total,
            "ram_pct": 0,
            "uptime_seconds": 0,
            "interfaces": interfaces,
            "rx_total": rx_total,
            "tx_total": tx_total,
        }

    base_lat = sim.get("latency_base", 10)
    base_loss = sim.get("loss_base", 0)
    base_cpu = sim.get("cpu_base", 30)
    base_ram = sim.get("ram_base", 45)

    lat = max(1.0, round(base_lat + random.uniform(-2, 4), 1))
    lmin = max(0.5, round(lat - random.uniform(0.5, 2), 1))
    lmax = round(lat + random.uniform(1, 5), 1)
    loss = round(max(0, base_loss + random.uniform(-0.5, 1.0)), 1)
    cpu = int(min(99, max(1, base_cpu + random.randint(-8, 12))))
    ram_pct = int(min(99, max(5, base_ram + random.randint(-5, 8))))
    ram_used = int(ram_total * ram_pct / 100)

    for i in pop.get("interfaces", []):
        up = i["name"] not in ifaces_down
        add_rx = random.randint(500_000, 60_000_000) if up else 0
        add_tx = random.randint(500_000, 45_000_000) if up else 0
        iface = {
            **i,
            "status": "up" if up else "down",
            "rx_bytes": i.get("rx_bytes", 0) + add_rx,
            "tx_bytes": i.get("tx_bytes", 0) + add_tx,
            "rx_packets": i.get("rx_packets", 0) + (add_rx // 800 if up else 0),
            "tx_packets": i.get("tx_packets", 0) + (add_tx // 800 if up else 0),
            "rx_errors": i.get("rx_errors", 0) + (random.randint(0, 2) if up and loss > 5 else 0),
            "tx_errors": i.get("tx_errors", 0),
            "rx_drops": i.get("rx_drops", 0),
            "tx_drops": i.get("tx_drops", 0),
            "speed": i.get("speed", "1Gbps"),
        }
        rx_total += add_rx
        tx_total += add_tx
        interfaces.append(iface)

    return {
        "router_up": True,
        "reachable": True,
        "latency": lat,
        "latency_min": lmin,
        "latency_max": lmax,
        "packet_loss": loss,
        "cpu": cpu,
        "ram_total": ram_total,
        "ram_used": ram_used,
        "ram_free": ram_total - ram_used,
        "ram_pct": ram_pct,
        "uptime_seconds": pop.get("uptime_seconds", 0) + interval,
        "interfaces": interfaces,
        "rx_total": rx_total,
        "tx_total": tx_total,
    }


async def _collect(pop, settings):
    """Collect metrics for a POP. Falls back to simulation."""
    sim = pop.get("simulation", {}) or {}
    if sim.get("enabled", True) or not pop.get("mikrotik_ip"):
        return _simulate(pop, settings["polling_interval"])

    # Real path (best-effort). On any failure -> monitoring error / unreachable.
    target = pop.get("gateway_ip") or pop.get("mikrotik_ip")
    to = max(settings.get("timeout", 2), 5)
    ping = await _real_ping(target, to, settings["retry"])
    result = {
        "router_up": ping["reachable"],
        "reachable": ping["reachable"],
        "latency": ping.get("latency"),
        "latency_min": ping.get("min"),
        "latency_max": ping.get("max"),
        "packet_loss": ping.get("loss", 100),
        "cpu": 0,
        "ram_total": 0,
        "ram_used": 0,
        "ram_free": 0,
        "ram_pct": 0,
        "uptime_seconds": pop.get("uptime_seconds", 0),
        "interfaces": [{**i, "status": "unknown"} for i in pop.get("interfaces", [])],
        "rx_total": pop.get("rx_total", 0),
        "tx_total": pop.get("tx_total", 0),
        "monitoring_error": not ping["reachable"],
    }
    if pop.get("access_method") == "rest":
        try:
            data = await asyncio.to_thread(_collect_rest, pop, to)
            res = data["resource"]
            result["cpu"] = int(float(res.get("cpu-load", 0)))
            total = int(res.get("total-memory", 0)) // (1024 * 1024)
            free = int(res.get("free-memory", 0)) // (1024 * 1024)
            result["ram_total"] = total
            result["ram_free"] = free
            result["ram_used"] = total - free
            result["ram_pct"] = int((total - free) / total * 100) if total else 0
            result["uptime_seconds"] = parse_uptime(res.get("uptime"))
            result["routeros_version"] = res.get("version", "")
            result["model"] = res.get("board-name", "")
            ident = data.get("identity") or {}
            if ident.get("name"):
                result["router_identity"] = ident["name"]
            rb = data.get("routerboard") or {}
            if rb.get("serial-number"):
                result["serial"] = rb["serial-number"]
            ifaces, rx_t, tx_t = [], 0, 0
            for it in data.get("interfaces", []) or []:
                rx = int(it.get("rx-byte", 0) or 0)
                tx = int(it.get("tx-byte", 0) or 0)
                rx_t += rx
                tx_t += tx
                running = str(it.get("running")).lower() == "true"
                disabled = str(it.get("disabled")).lower() == "true"
                ifaces.append({
                    "name": it.get("name"),
                    "status": "down" if (disabled or not running) else "up",
                    "rx_bytes": rx, "tx_bytes": tx,
                    "rx_packets": int(it.get("rx-packet", 0) or 0),
                    "tx_packets": int(it.get("tx-packet", 0) or 0),
                    "rx_errors": int(it.get("rx-error", 0) or 0),
                    "tx_errors": int(it.get("tx-error", 0) or 0),
                    "rx_drops": int(it.get("rx-drop", 0) or 0),
                    "tx_drops": int(it.get("tx-drop", 0) or 0),
                    "speed": it.get("speed") or "",
                })
            if ifaces:
                result["interfaces"] = ifaces
                result["rx_total"] = rx_t
                result["tx_total"] = tx_t
            result["router_up"] = True
            result["reachable"] = True
            if not ping["reachable"]:
                result["packet_loss"] = 0
            result["monitoring_error"] = False
        except Exception as e:
            logger.warning("REST collect failed for %s: %s", pop.get("name"), e)
            result["monitoring_error"] = True
    elif pop.get("access_method") == "snmp":
        try:
            await asyncio.to_thread(_snmp_sysdescr, pop, to)
            result["router_up"] = True
            result["reachable"] = True
            if not ping["reachable"]:
                result["packet_loss"] = 0
            result["monitoring_error"] = False
        except Exception as e:
            logger.warning("SNMP collect failed for %s: %s", pop.get("name"), e)
            result["monitoring_error"] = True
    return result


async def _make_alert(etype, severity, obj_type, obj_id, obj_name, message, reason):
    await db.alerts.insert_one(
        {
            "id": str(uuid.uuid4()),
            "type": etype,
            "severity": severity,
            "object_type": obj_type,
            "object_id": obj_id,
            "object_name": obj_name,
            "message": message,
            "reason": reason,
            "created_at": now_iso(),
            "resolved_at": None,
        }
    )


async def run_cycle():
    settings = await get_settings()
    interval = settings["polling_interval"]
    pops = await db.pops.find().to_list(1000)
    links = await db.links.find().to_list(2000)
    if not pops:
        return

    metrics_by_pop = {}
    for pop in pops:
        m = await _collect(pop, settings)
        metrics_by_pop[pop["id"]] = m

    # Build graph inputs.
    topo_pops = []
    for pop in pops:
        m = metrics_by_pop[pop["id"]]
        iface_map = {}
        for i in m["interfaces"]:
            s = i["status"]
            iface_map[i["name"]] = None if s == "unknown" else (s == "up")
        topo_pops.append(
            {
                "id": pop["id"],
                "name": pop["name"],
                "router_up": m["router_up"],
                "is_core": pop.get("is_core", False),
                "interfaces": iface_map,
                "latency": m["latency"],
                "packet_loss": m["packet_loss"],
            }
        )

    topo_links = []
    for l in links:
        a = metrics_by_pop.get(l["pop_a"])
        b = metrics_by_pop.get(l["pop_b"])
        lat = None
        loss = 0
        if a and b:
            vals = [x for x in (a["latency"], b["latency"]) if x is not None]
            lat = max(vals) if vals else None
            loss = max(a["packet_loss"], b["packet_loss"])
        topo_links.append(
            {
                "id": l["id"],
                "pop_a": l["pop_a"],
                "pop_b": l["pop_b"],
                "iface_a": l.get("iface_a"),
                "iface_b": l.get("iface_b"),
                "latency": lat,
                "loss": loss,
            }
        )

    thresholds = {
        "latency_warning_max": settings["latency_warning_max"],
        "packet_loss_critical": settings["packet_loss_critical"],
    }
    result = compute_topology(topo_pops, topo_links, thresholds)

    ts = now_iso()
    # Persist POP state + history, detect transitions.
    for pop in pops:
        m = metrics_by_pop[pop["id"]]
        st = result["pop_status"][pop["id"]]
        prev = pop.get("status")
        link_count = sum(1 for l in links if pop["id"] in (l["pop_a"], l["pop_b"]))
        update = {
            **m,
            "status": st["status"],
            "status_reason": st["reason"],
            "link_count": link_count,
            "last_check": ts,
        }
        if m["reachable"]:
            update["last_success"] = ts
        else:
            update["last_failed"] = ts
        await db.pops.update_one({"id": pop["id"]}, {"$set": update})

        await db.monitoring_checks.insert_one(
            {
                "pop_id": pop["id"],
                "cpu": m["cpu"],
                "ram_pct": m["ram_pct"],
                "ram_used": m["ram_used"],
                "ram_total": m["ram_total"],
                "latency": m["latency"],
                "packet_loss": m["packet_loss"],
                "reachable": m["reachable"],
                "rx_total": m["rx_total"],
                "tx_total": m["tx_total"],
                "created_at": datetime.now(timezone.utc),
            }
        )
        await db.latency_history.insert_one(
            {
                "pop_id": pop["id"],
                "min": m["latency_min"],
                "avg": m["latency"],
                "max": m["latency_max"],
                "loss": m["packet_loss"],
                "status": st["status"],
                "created_at": datetime.now(timezone.utc),
            }
        )

        if prev and prev != st["status"]:
            sev = {"DOWN": "critical", "DEGRADED": "warning", "UP": "info", "UNKNOWN": "warning"}[st["status"]]
            await _make_alert(
                "POP_STATUS", sev, "pop", pop["id"], pop["name"],
                f"POP {pop['name']} {prev} -> {st['status']} ({st['reason']})",
                st["reason"],
            )
            if st["status"] == "DOWN":
                await notify_down("POP", pop["name"], st["reason"])

    # Persist link state + transitions.
    name_by_id = {p["id"]: p["name"] for p in pops}
    for l in links:
        ls = result["link_status"][l["id"]]
        prev = l.get("status")
        await db.links.update_one(
            {"id": l["id"]},
            {"$set": {"status": ls["status"], "status_reason": ls["reason"], "last_check": ts, "updated_at": ts}},
        )
        if prev and prev != ls["status"]:
            sev = {"DOWN": "critical", "DEGRADED": "warning", "UP": "info", "UNKNOWN": "warning"}[ls["status"]]
            await _make_alert(
                "LINK_STATUS", sev, "link", l["id"], l.get("name", l["id"]),
                f"LINK {name_by_id.get(l['pop_a'],'?')} <-> {name_by_id.get(l['pop_b'],'?')} "
                f"{prev} -> {ls['status']} ({ls['reason']})",
                ls["reason"],
            )
            if ls["status"] == "DOWN":
                await notify_down("LINK", l.get("name", l["id"]), ls["reason"])

    # Alternative path informational events (deduped per link while active).
    for alt in result["alt_paths"]:
        existing = await db.alerts.find_one(
            {"type": "ALT_PATH", "object_id": alt["link_id"], "resolved_at": None}
        )
        if not existing:
            await _make_alert(
                "ALT_PATH", "info", "pop", alt["pop_id"], alt["pop_name"],
                f"{alt['pop_name']} tetap reachable melalui jalur alternatif.",
                "ALTERNATIVE_PATH",
            )

    await manager.broadcast({"type": "update", "ts": ts})


async def _loop():
    while True:
        try:
            await run_cycle()
        except Exception as e:
            logger.exception("monitoring cycle error: %s", e)
        settings = await get_settings()
        await asyncio.sleep(settings.get("polling_interval", 10))


def start_engine():
    global _engine_task
    if _engine_task is None or _engine_task.done():
        _engine_task = asyncio.create_task(_loop())


def stop_engine():
    global _engine_task
    if _engine_task:
        _engine_task.cancel()
        _engine_task = None
