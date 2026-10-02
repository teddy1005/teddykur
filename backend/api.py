import uuid
import asyncio
from datetime import datetime, timezone, timedelta
from math import radians, sin, cos, asin, sqrt

from fastapi import APIRouter, Depends, HTTPException, Request, Response, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional

from db import db, get_settings, get_map_settings, get_notification_settings, DEFAULT_SETTINGS, DEFAULT_MAP_SETTINGS
from security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    get_current_user,
    require_role,
    encrypt_secret,
)
from ws import manager
from monitor import run_cycle, _collect_rest, _real_ping, _snmp_sysdescr, parse_uptime
import notifications

router = APIRouter(prefix="/api")

SENSITIVE = ("password_enc", "snmp_community_enc", "_id")


def now_iso():
    return datetime.now(timezone.utc).isoformat()


def clean_pop(doc: dict) -> dict:
    d = {k: v for k, v in doc.items() if k not in SENSITIVE}
    d["has_credentials"] = bool(doc.get("password_enc") or doc.get("snmp_community_enc"))
    return d


def clean(doc: dict) -> dict:
    return {k: v for k, v in doc.items() if k != "_id"}


def haversine(route) -> float:
    total = 0.0
    for i in range(len(route) - 1):
        lat1, lon1 = route[i]
        lat2, lon2 = route[i + 1]
        dlat = radians(lat2 - lat1)
        dlon = radians(lon2 - lon1)
        aa = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
        total += 6371 * 2 * asin(sqrt(aa))
    return round(total, 2)


# ----------------------------- Auth -----------------------------
class RegisterBody(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str = "User"
    role: str = "viewer"


class LoginBody(BaseModel):
    email: EmailStr
    password: str


def set_auth_cookies(response: Response, access: str, refresh: str):
    response.set_cookie("access_token", access, httponly=True, secure=True, samesite="none", max_age=3600, path="/")
    response.set_cookie("refresh_token", refresh, httponly=True, secure=True, samesite="none", max_age=604800, path="/")


@router.post("/auth/register")
async def register(body: RegisterBody, response: Response, admin=Depends(require_role("admin"))):
    email = body.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    role = body.role if body.role in ("admin", "operator", "viewer") else "viewer"
    doc = {
        "email": email,
        "password_hash": hash_password(body.password),
        "name": body.name,
        "role": role,
        "created_at": now_iso(),
    }
    res = await db.users.insert_one(doc)
    return {"id": str(res.inserted_id), "email": email, "name": body.name, "role": role}


@router.post("/auth/login")
async def login(body: LoginBody, request: Request, response: Response):
    email = body.email.lower()
    ident = f"{request.client.host if request.client else 'x'}:{email}"
    now = datetime.now(timezone.utc)
    attempt = await db.login_attempts.find_one({"identifier": ident})
    if attempt and attempt.get("count", 0) >= 5:
        locked = attempt.get("locked_until")
        if locked and now < datetime.fromisoformat(locked):
            raise HTTPException(status_code=429, detail="Too many attempts. Try again later.")
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(body.password, user["password_hash"]):
        new_count = (attempt.get("count", 0) if attempt else 0) + 1
        await db.login_attempts.update_one(
            {"identifier": ident},
            {"$set": {"count": new_count,
                      "locked_until": (now + timedelta(minutes=15)).isoformat() if new_count >= 5 else None}},
            upsert=True,
        )
        raise HTTPException(status_code=401, detail="Invalid email or password")
    await db.login_attempts.delete_one({"identifier": ident})
    uid = str(user["_id"])
    set_auth_cookies(response, create_access_token(uid, email), create_refresh_token(uid))
    return {"id": uid, "email": email, "name": user.get("name"), "role": user.get("role")}


@router.post("/auth/logout")
async def logout(response: Response, user=Depends(get_current_user)):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"ok": True}


@router.get("/auth/me")
async def me(user=Depends(get_current_user)):
    return user


@router.get("/auth/users")
async def list_users(user=Depends(require_role("admin"))):
    users = await db.users.find().to_list(500)
    return [{"id": str(u["_id"]), "email": u["email"], "name": u.get("name"), "role": u.get("role")} for u in users]


# ----------------------------- POPs -----------------------------
class PopBody(BaseModel):
    name: str
    code: str
    address: str = ""
    latitude: float
    longitude: float
    mikrotik_ip: str = ""
    gateway_ip: str = ""
    access_method: str = "rest"
    api_port: int = 443
    username: str = ""
    password: str = ""
    snmp_community: str = ""
    description: str = ""
    is_core: bool = False
    interfaces: List[str] = []
    simulation_enabled: bool = True


@router.get("/pops")
async def list_pops(user=Depends(get_current_user)):
    pops = await db.pops.find().to_list(1000)
    return [clean_pop(p) for p in pops]


@router.get("/pops/{pop_id}")
async def get_pop(pop_id: str, user=Depends(get_current_user)):
    p = await db.pops.find_one({"id": pop_id})
    if not p:
        raise HTTPException(status_code=404, detail="POP not found")
    return clean_pop(p)


@router.post("/pops")
async def create_pop(body: PopBody, user=Depends(require_role("admin", "operator"))):
    ifaces = body.interfaces or ["ether1", "ether2"]
    doc = {
        "id": str(uuid.uuid4()),
        "name": body.name,
        "code": body.code,
        "address": body.address,
        "latitude": body.latitude,
        "longitude": body.longitude,
        "mikrotik_ip": body.mikrotik_ip,
        "gateway_ip": body.gateway_ip,
        "access_method": body.access_method,
        "api_port": body.api_port,
        "username": body.username,
        "password_enc": encrypt_secret(body.password),
        "snmp_community_enc": encrypt_secret(body.snmp_community),
        "description": body.description,
        "is_core": body.is_core,
        "router_name": body.name.replace(" ", "-"),
        "router_identity": body.code,
        "routeros_version": "",
        "model": "",
        "serial": "",
        "interfaces": [
            {"name": n, "status": "up", "rx_bytes": 0, "tx_bytes": 0, "rx_packets": 0,
             "tx_packets": 0, "rx_errors": 0, "tx_errors": 0, "rx_drops": 0, "tx_drops": 0,
             "speed": "1Gbps"} for n in ifaces
        ],
        "simulation": {
            "enabled": body.simulation_enabled,
            "latency_base": 10, "loss_base": 0, "cpu_base": 30, "ram_base": 45,
            "ram_total": 1024, "fault": {"router_down": False, "interfaces_down": []},
        },
        "status": "UNKNOWN", "status_reason": "UNKNOWN",
        "cpu": 0, "ram_pct": 0, "latency": None, "packet_loss": 0,
        "uptime_seconds": 0, "rx_total": 0, "tx_total": 0, "link_count": 0,
        "last_check": None, "created_at": now_iso(), "updated_at": now_iso(),
    }
    await db.pops.insert_one(doc)
    return clean_pop(doc)


@router.put("/pops/{pop_id}")
async def update_pop(pop_id: str, body: dict, user=Depends(require_role("admin", "operator"))):
    p = await db.pops.find_one({"id": pop_id})
    if not p:
        raise HTTPException(status_code=404, detail="POP not found")
    allowed = {"name", "code", "address", "latitude", "longitude", "mikrotik_ip", "gateway_ip",
               "access_method", "api_port", "username", "description", "is_core"}
    update = {k: v for k, v in body.items() if k in allowed}
    if body.get("password"):
        update["password_enc"] = encrypt_secret(body["password"])
    if body.get("snmp_community"):
        update["snmp_community_enc"] = encrypt_secret(body["snmp_community"])
    if "simulation_enabled" in body:
        update["simulation.enabled"] = bool(body["simulation_enabled"])
    if "interfaces" in body and isinstance(body["interfaces"], list):
        existing = {i["name"]: i for i in p.get("interfaces", [])}
        update["interfaces"] = [
            existing.get(n, {"name": n, "status": "up", "rx_bytes": 0, "tx_bytes": 0,
                             "rx_packets": 0, "tx_packets": 0, "rx_errors": 0, "tx_errors": 0,
                             "rx_drops": 0, "tx_drops": 0, "speed": "1Gbps"})
            for n in body["interfaces"]
        ]
    update["updated_at"] = now_iso()
    await db.pops.update_one({"id": pop_id}, {"$set": update})
    return clean_pop(await db.pops.find_one({"id": pop_id}))


@router.delete("/pops/{pop_id}")
async def delete_pop(pop_id: str, user=Depends(require_role("admin"))):
    await db.pops.delete_one({"id": pop_id})
    await db.links.delete_many({"$or": [{"pop_a": pop_id}, {"pop_b": pop_id}]})
    return {"ok": True}


@router.get("/pops/{pop_id}/interfaces")
async def pop_interfaces(pop_id: str, user=Depends(get_current_user)):
    p = await db.pops.find_one({"id": pop_id})
    if not p:
        raise HTTPException(status_code=404, detail="POP not found")
    return p.get("interfaces", [])


@router.get("/pops/{pop_id}/metrics")
async def pop_metrics(pop_id: str, limit: int = 60, user=Depends(get_current_user)):
    rows = await db.monitoring_checks.find({"pop_id": pop_id}).sort("created_at", -1).to_list(limit)
    rows = list(reversed(rows))
    return [
        {
            "cpu": r["cpu"], "ram_pct": r["ram_pct"], "latency": r["latency"],
            "packet_loss": r["packet_loss"], "rx_total": r["rx_total"], "tx_total": r["tx_total"],
            "created_at": r["created_at"].isoformat() if hasattr(r["created_at"], "isoformat") else r["created_at"],
        }
        for r in rows
    ]


@router.get("/pops/{pop_id}/latency")
async def pop_latency(pop_id: str, limit: int = 60, user=Depends(get_current_user)):
    rows = await db.latency_history.find({"pop_id": pop_id}).sort("created_at", -1).to_list(limit)
    rows = list(reversed(rows))
    return [
        {"min": r["min"], "avg": r["avg"], "max": r["max"], "loss": r["loss"], "status": r["status"],
         "created_at": r["created_at"].isoformat() if hasattr(r["created_at"], "isoformat") else r["created_at"]}
        for r in rows
    ]


# ----------------------------- Links -----------------------------
class LinkBody(BaseModel):
    name: str = ""
    pop_a: str
    pop_b: str
    iface_a: str
    iface_b: str
    cable_type: str = "Fiber Optic"
    route: List[List[float]] = []
    capacity: str = "10Gbps"
    description: str = ""


@router.get("/links")
async def list_links(user=Depends(get_current_user)):
    links = await db.links.find().to_list(2000)
    return [clean(l) for l in links]


@router.post("/links")
async def create_link(body: LinkBody, user=Depends(require_role("admin", "operator"))):
    a = await db.pops.find_one({"id": body.pop_a})
    b = await db.pops.find_one({"id": body.pop_b})
    if not a or not b:
        raise HTTPException(status_code=400, detail="Both POPs must exist")
    route = body.route or [[a["latitude"], a["longitude"]], [b["latitude"], b["longitude"]]]
    doc = {
        "id": str(uuid.uuid4()),
        "name": body.name or f"{a['code']}-{b['code']}",
        "pop_a": body.pop_a, "iface_a": body.iface_a,
        "pop_b": body.pop_b, "iface_b": body.iface_b,
        "cable_type": body.cable_type,
        "route": route,
        "distance_km": haversine(route),
        "capacity": body.capacity,
        "status": "UNKNOWN", "status_reason": "UNKNOWN",
        "description": body.description,
        "last_check": None, "created_at": now_iso(), "updated_at": now_iso(),
    }
    await db.links.insert_one(doc)
    return clean(doc)


@router.put("/links/{link_id}")
async def update_link(link_id: str, body: dict, user=Depends(require_role("admin", "operator"))):
    l = await db.links.find_one({"id": link_id})
    if not l:
        raise HTTPException(status_code=404, detail="Link not found")
    allowed = {"name", "iface_a", "iface_b", "cable_type", "capacity", "description", "route"}
    update = {k: v for k, v in body.items() if k in allowed}
    if "route" in update and update["route"]:
        update["distance_km"] = haversine(update["route"])
    update["updated_at"] = now_iso()
    await db.links.update_one({"id": link_id}, {"$set": update})
    return clean(await db.links.find_one({"id": link_id}))


@router.delete("/links/{link_id}")
async def delete_link(link_id: str, user=Depends(require_role("admin"))):
    await db.links.delete_one({"id": link_id})
    return {"ok": True}


# ----------------------------- Topology / Dashboard -----------------------------
@router.get("/topology")
async def topology(user=Depends(get_current_user)):
    pops = [clean_pop(p) for p in await db.pops.find().to_list(1000)]
    links = [clean(l) for l in await db.links.find().to_list(2000)]
    return {"pops": pops, "links": links}


@router.get("/dashboard")
async def dashboard(user=Depends(get_current_user)):
    pops = await db.pops.find().to_list(1000)
    links = await db.links.find().to_list(2000)
    settings = await get_settings()

    def count(items, key, val):
        return sum(1 for i in items if i.get(key) == val)

    lats = [p["latency"] for p in pops if p.get("latency") is not None]
    avg_lat = round(sum(lats) / len(lats), 1) if lats else 0
    highest = sorted(
        [p for p in pops if p.get("latency") is not None], key=lambda p: p["latency"], reverse=True
    )[:3]
    high_cpu = sorted(pops, key=lambda p: p.get("cpu", 0), reverse=True)[:3]
    high_ram = sorted(pops, key=lambda p: p.get("ram_pct", 0), reverse=True)[:3]
    loss_pops = [p for p in pops if (p.get("packet_loss") or 0) > settings["packet_loss_warning"]]

    def mini(p):
        return {"id": p["id"], "name": p["name"], "code": p["code"], "status": p.get("status"),
                "latency": p.get("latency"), "packet_loss": p.get("packet_loss"),
                "cpu": p.get("cpu"), "ram_pct": p.get("ram_pct")}

    return {
        "summary": {
            "total_pop": len(pops),
            "pop_up": count(pops, "status", "UP"),
            "pop_down": count(pops, "status", "DOWN"),
            "pop_degraded": count(pops, "status", "DEGRADED"),
            "pop_unknown": count(pops, "status", "UNKNOWN"),
            "total_link": len(links),
            "link_up": count(links, "status", "UP"),
            "link_down": count(links, "status", "DOWN"),
            "link_degraded": count(links, "status", "DEGRADED"),
            "link_unknown": count(links, "status", "UNKNOWN"),
            "avg_latency": avg_lat,
            "cpu_high_threshold": settings["cpu_high"],
            "ram_high_threshold": settings["ram_high"],
        },
        "highest_latency": [mini(p) for p in highest],
        "high_cpu": [mini(p) for p in high_cpu],
        "high_ram": [mini(p) for p in high_ram],
        "packet_loss_pops": [mini(p) for p in loss_pops],
        "pops": [clean_pop(p) for p in pops],
    }


# ----------------------------- Alerts -----------------------------
@router.get("/alerts")
async def list_alerts(limit: int = 100, unresolved: bool = False, user=Depends(get_current_user)):
    q = {"resolved_at": None} if unresolved else {}
    rows = await db.alerts.find(q).sort("created_at", -1).to_list(limit)
    return [clean(a) for a in rows]


@router.post("/alerts/{alert_id}/resolve")
async def resolve_alert(alert_id: str, user=Depends(require_role("admin", "operator"))):
    await db.alerts.update_one({"id": alert_id}, {"$set": {"resolved_at": now_iso()}})
    return {"ok": True}


# ----------------------------- Settings -----------------------------
@router.get("/settings")
async def read_settings(user=Depends(get_current_user)):
    s = await get_settings()
    return clean(s)


@router.put("/settings")
async def write_settings(body: dict, user=Depends(require_role("admin"))):
    allowed = set(DEFAULT_SETTINGS.keys()) - {"_id"}
    update = {k: v for k, v in body.items() if k in allowed}
    await db.monitoring_settings.update_one({"_id": "global"}, {"$set": update}, upsert=True)
    return clean(await get_settings())


@router.get("/map-settings")
async def read_map_settings(user=Depends(get_current_user)):
    return clean(await get_map_settings())


@router.put("/map-settings")
async def write_map_settings(body: dict, user=Depends(require_role("admin"))):
    allowed = {"provider", "osm_tile", "center_lat", "center_lng", "zoom"}
    update = {k: v for k, v in body.items() if k in allowed}
    if body.get("google_api_key"):
        update["google_api_key"] = body["google_api_key"]
        update["google_api_key_set"] = True
    await db.map_settings.update_one({"_id": "global"}, {"$set": update}, upsert=True)
    return clean(await get_map_settings())


# ----------------------------- Monitoring control -----------------------------
@router.post("/monitoring/check")
async def manual_check(user=Depends(require_role("admin", "operator"))):
    await run_cycle()
    return {"ok": True, "ts": now_iso()}


class FaultBody(BaseModel):
    pop_id: str
    router_down: Optional[bool] = None
    interfaces_down: Optional[List[str]] = None


@router.post("/monitoring/simulate-fault")
async def simulate_fault(body: FaultBody, user=Depends(require_role("admin", "operator"))):
    """Demo tool: inject a simulated fault. The engine then DERIVES link/POP
    status from evidence (it is never set manually)."""
    p = await db.pops.find_one({"id": body.pop_id})
    if not p:
        raise HTTPException(status_code=404, detail="POP not found")
    fault = p.get("simulation", {}).get("fault", {})
    if body.router_down is not None:
        fault["router_down"] = body.router_down
    if body.interfaces_down is not None:
        fault["interfaces_down"] = body.interfaces_down
    await db.pops.update_one({"id": body.pop_id}, {"$set": {"simulation.fault": fault}})
    await run_cycle()
    return {"ok": True, "fault": fault}


# ----------------------------- Notifications -----------------------------
@router.get("/notification-settings")
async def read_notification_settings(user=Depends(get_current_user)):
    ns = await get_notification_settings()
    return {"enabled": ns.get("enabled", False), "chat_id": ns.get("chat_id", ""),
            "has_token": bool(ns.get("token_enc")), "trigger": ns.get("trigger", "down")}


@router.put("/notification-settings")
async def write_notification_settings(body: dict, user=Depends(require_role("admin"))):
    update = {}
    if "enabled" in body:
        update["enabled"] = bool(body["enabled"])
    if "chat_id" in body:
        update["chat_id"] = str(body["chat_id"]).strip()
    if "trigger" in body:
        update["trigger"] = body["trigger"]
    if body.get("token"):
        update["token_enc"] = encrypt_secret(body["token"])
    await db.notification_settings.update_one({"_id": "global"}, {"$set": update}, upsert=True)
    return await read_notification_settings(user)


@router.post("/notification-settings/test")
async def test_notification(user=Depends(require_role("admin"))):
    return await notifications.send_test()


# ----------------------------- MikroTik connection test -----------------------------
@router.post("/pops/{pop_id}/test-connection")
async def test_connection(pop_id: str, user=Depends(require_role("admin", "operator"))):
    p = await db.pops.find_one({"id": pop_id})
    if not p:
        raise HTTPException(status_code=404, detail="POP not found")
    settings = await get_settings()
    method = p.get("access_method", "rest")
    target = p.get("gateway_ip") or p.get("mikrotik_ip")
    if not target:
        return {"ok": False, "reachable": False, "method": method, "message": "No IP configured"}
    ping = await _real_ping(target, settings["timeout"], settings["retry"])
    res = {"reachable": ping["reachable"], "latency": ping.get("latency"), "method": method, "ok": False}
    if not ping["reachable"]:
        res["message"] = "Host not reachable (ICMP). Ensure the device is public-facing and reachable."
        return res
    if method == "rest":
        try:
            data = await asyncio.to_thread(_collect_rest, p, settings["timeout"])
            r = data["resource"]
            res.update({"ok": True, "identity": (data.get("identity") or {}).get("name"),
                        "version": r.get("version"), "board": r.get("board-name"),
                        "cpu": r.get("cpu-load"), "uptime": parse_uptime(r.get("uptime"))})
        except Exception as e:
            res["message"] = f"REST error: {e}"
    elif method == "snmp":
        try:
            desc = await asyncio.to_thread(_snmp_sysdescr, p, settings["timeout"])
            res.update({"ok": True, "identity": desc[:120]})
        except Exception as e:
            res["message"] = f"SNMP error: {e}"
    return res


# ----------------------------- WebSocket -----------------------------
@router.websocket("/ws")
async def ws_endpoint(ws: WebSocket):
    await manager.connect(ws)
    try:
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        await manager.disconnect(ws)
    except Exception:
        await manager.disconnect(ws)
