import os
import uuid
from datetime import datetime, timezone

from db import db, get_settings, get_map_settings
from security import hash_password, verify_password


def now_iso():
    return datetime.now(timezone.utc).isoformat()


def _iface(name, speed="1Gbps"):
    return {
        "name": name,
        "status": "up",
        "rx_bytes": 0,
        "tx_bytes": 0,
        "rx_packets": 0,
        "tx_packets": 0,
        "rx_errors": 0,
        "tx_errors": 0,
        "rx_drops": 0,
        "tx_drops": 0,
        "speed": speed,
    }


async def seed_admin():
    email = os.environ.get("ADMIN_EMAIL", "admin@example.com").lower()
    password = os.environ.get("ADMIN_PASSWORD", "admin123")
    existing = await db.users.find_one({"email": email})
    if existing is None:
        await db.users.insert_one(
            {
                "email": email,
                "password_hash": hash_password(password),
                "name": "Administrator",
                "role": "admin",
                "created_at": now_iso(),
            }
        )
    elif not verify_password(password, existing["password_hash"]):
        await db.users.update_one(
            {"email": email}, {"$set": {"password_hash": hash_password(password)}}
        )
    # a demo operator + viewer for RBAC testing
    for em, role in (("operator@popmon.io", "operator"), ("viewer@popmon.io", "viewer")):
        if not await db.users.find_one({"email": em}):
            await db.users.insert_one(
                {
                    "email": em,
                    "password_hash": hash_password("Popmon#2026"),
                    "name": role.capitalize(),
                    "role": role,
                    "created_at": now_iso(),
                }
            )


async def seed_demo():
    if await db.pops.count_documents({}) > 0:
        return

    # id, name, code, lat, lng, core, latency_base, cpu_base, ram_base, ifaces
    defs = [
        ("pop-a", "POP-A Core", "POP-A", -6.2000, 106.8166, True, 3, 35, 50,
         ["ether1", "ether2", "ether3"]),
        ("pop-b", "POP-B Monas", "POP-B", -6.1754, 106.8272, False, 8, 28, 45,
         ["ether1", "ether2"]),
        ("pop-c", "POP-C Kebayoran", "POP-C", -6.2400, 106.8290, False, 15, 42, 55,
         ["ether1", "ether2", "ether3"]),
        ("pop-d", "POP-D Pasar Minggu", "POP-D", -6.2615, 106.8106, False, 12, 30, 40,
         ["ether1", "ether2"]),
        ("pop-e", "POP-E Jatinegara", "POP-E", -6.2150, 106.8700, False, 25, 20, 38,
         ["ether1"]),
    ]
    for (pid, name, code, lat, lng, core, lat_b, cpu_b, ram_b, ifaces) in defs:
        await db.pops.insert_one(
            {
                "id": pid,
                "name": name,
                "code": code,
                "address": f"{name}, Jakarta",
                "latitude": lat,
                "longitude": lng,
                "mikrotik_ip": f"10.0.{defs.index((pid, name, code, lat, lng, core, lat_b, cpu_b, ram_b, ifaces))}.1",
                "gateway_ip": f"10.0.{defs.index((pid, name, code, lat, lng, core, lat_b, cpu_b, ram_b, ifaces))}.254",
                "access_method": "rest",
                "api_port": 443,
                "username": "monitor",
                "password_enc": "",
                "snmp_community_enc": "",
                "description": "Demo POP (simulated).",
                "is_core": core,
                "router_name": name.replace(" ", "-"),
                "router_identity": code,
                "routeros_version": "7.14.3",
                "model": "CCR2004-1G-12S+2XS",
                "serial": f"HF{1000+defs.index((pid, name, code, lat, lng, core, lat_b, cpu_b, ram_b, ifaces))}",
                "interfaces": [_iface(n) for n in ifaces],
                "simulation": {
                    "enabled": True,
                    "latency_base": lat_b,
                    "loss_base": 0,
                    "cpu_base": cpu_b,
                    "ram_base": ram_b,
                    "ram_total": 1024,
                    "fault": {"router_down": False, "interfaces_down": []},
                },
                "status": "UNKNOWN",
                "status_reason": "UNKNOWN",
                "cpu": 0,
                "ram_pct": 0,
                "latency": None,
                "packet_loss": 0,
                "uptime_seconds": 0,
                "rx_total": 0,
                "tx_total": 0,
                "link_count": 0,
                "last_check": None,
                "created_at": now_iso(),
                "updated_at": now_iso(),
            }
        )

    def mklink(lid, name, a, ia, b, ib, route, cap="10Gbps"):
        return {
            "id": lid,
            "name": name,
            "pop_a": a,
            "iface_a": ia,
            "pop_b": b,
            "iface_b": ib,
            "cable_type": "Fiber Optic G.652D",
            "route": route,
            "distance_km": 0,
            "capacity": cap,
            "status": "UNKNOWN",
            "status_reason": "UNKNOWN",
            "description": "",
            "last_check": None,
            "created_at": now_iso(),
            "updated_at": now_iso(),
        }

    pos = {p[0]: (p[3], p[4]) for p in defs}
    links = [
        mklink("link-ab", "LINK-AB", "pop-a", "ether2", "pop-b", "ether1",
               [list(pos["pop-a"]), list(pos["pop-b"])]),
        mklink("link-bc", "LINK-BC", "pop-b", "ether2", "pop-c", "ether1",
               [list(pos["pop-b"]), list(pos["pop-c"])]),
        mklink("link-ad", "LINK-AD", "pop-a", "ether3", "pop-d", "ether1",
               [list(pos["pop-a"]), list(pos["pop-d"])]),
        mklink("link-dc", "LINK-DC", "pop-d", "ether2", "pop-c", "ether2",
               [list(pos["pop-d"]), list(pos["pop-c"])]),
        mklink("link-ce", "LINK-CE", "pop-c", "ether3", "pop-e", "ether1",
               [list(pos["pop-c"]), list(pos["pop-e"])]),
    ]
    # compute distance via haversine
    from math import radians, sin, cos, asin, sqrt

    def dist(route):
        total = 0
        for i in range(len(route) - 1):
            lat1, lon1 = route[i]
            lat2, lon2 = route[i + 1]
            dlat = radians(lat2 - lat1)
            dlon = radians(lon2 - lon1)
            aa = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
            total += 6371 * 2 * asin(sqrt(aa))
        return round(total, 2)

    for l in links:
        l["distance_km"] = dist(l["route"])
        await db.links.insert_one(l)

    await get_settings()
    await get_map_settings()
