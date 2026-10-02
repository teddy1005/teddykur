"""Topology / graph engine.

Derives POP and link status from measured evidence using an undirected graph
and BFS reachability from core (monitoring-connected) POPs. A link is only
traversable when both endpoints' routers are reachable AND both endpoint
interfaces are up. Reachability over the remaining operational links decides
whether a POP is still reachable via an alternative path.
"""
from collections import defaultdict


def compute_topology(pops, links, thresholds):
    """
    pops: list of dicts -> id, name, router_up(bool), is_core(bool),
          interfaces({name: up_bool_or_None}), latency, packet_loss
    links: list of dicts -> id, pop_a, pop_b, iface_a, iface_b, latency, loss
    Returns dict with pop_status, link_status, reachable set, alt_paths.
    """
    lat_warn = thresholds.get("latency_warning_max", 50)
    loss_crit = thresholds.get("packet_loss_critical", 10)

    pop_by_id = {p["id"]: p for p in pops}
    link_status = {}
    operational = []

    for l in links:
        a = pop_by_id.get(l["pop_a"])
        b = pop_by_id.get(l["pop_b"])
        if not a or not b:
            link_status[l["id"]] = {"status": "UNKNOWN", "reason": "UNKNOWN"}
            continue

        ia = a["interfaces"].get(l.get("iface_a"))
        ib = b["interfaces"].get(l.get("iface_b"))

        # If a router is down we cannot read its interface -> cannot conclude cut.
        if not a["router_up"] and not b["router_up"]:
            link_status[l["id"]] = {"status": "UNKNOWN", "reason": "ROUTER_DOWN"}
            continue
        if not a["router_up"] or not b["router_up"]:
            link_status[l["id"]] = {"status": "UNKNOWN", "reason": "ROUTER_DOWN"}
            continue

        if ia is False or ib is False:
            link_status[l["id"]] = {"status": "DOWN", "reason": "INTERFACE_DOWN"}
            continue
        if ia is None or ib is None:
            link_status[l["id"]] = {"status": "UNKNOWN", "reason": "UNKNOWN"}
            continue

        loss = l.get("loss") or 0
        lat = l.get("latency") or 0
        if loss >= loss_crit:
            link_status[l["id"]] = {"status": "DEGRADED", "reason": "PACKET_LOSS"}
            operational.append(l)
            continue
        if lat > lat_warn:
            link_status[l["id"]] = {"status": "DEGRADED", "reason": "HIGH_LATENCY"}
            operational.append(l)
            continue
        link_status[l["id"]] = {"status": "UP", "reason": "OK"}
        operational.append(l)

    # BFS reachability from core POPs over operational links.
    adj = defaultdict(list)
    for l in operational:
        adj[l["pop_a"]].append(l["pop_b"])
        adj[l["pop_b"]].append(l["pop_a"])

    cores = [p["id"] for p in pops if p.get("is_core") and p["router_up"]]
    reachable = set(cores)
    queue = list(cores)
    while queue:
        n = queue.pop()
        for m in adj[n]:
            if m not in reachable and pop_by_id[m]["router_up"]:
                reachable.add(m)
                queue.append(m)

    pop_status = {}
    for p in pops:
        pid = p["id"]
        if not p["router_up"]:
            pop_status[pid] = {"status": "DOWN", "reason": "ROUTER_DOWN"}
        elif pid in reachable:
            loss = p.get("packet_loss") or 0
            lat = p.get("latency") or 0
            if loss >= loss_crit:
                pop_status[pid] = {"status": "DEGRADED", "reason": "PACKET_LOSS"}
            elif lat > lat_warn:
                pop_status[pid] = {"status": "DEGRADED", "reason": "HIGH_LATENCY"}
            else:
                pop_status[pid] = {"status": "UP", "reason": "OK"}
        else:
            # Router alive but no backbone path to core = isolated.
            pop_status[pid] = {"status": "DOWN", "reason": "LINK_UNREACHABLE"}

    # Alternative path detection: a down/unknown link whose far POP is still
    # reachable means traffic survived via another route.
    alt_paths = []
    for l in links:
        st = link_status[l["id"]]["status"]
        if st in ("DOWN", "UNKNOWN"):
            for near, far in ((l["pop_a"], l["pop_b"]), (l["pop_b"], l["pop_a"])):
                if far in reachable and pop_by_id.get(far):
                    alt_paths.append(
                        {
                            "link_id": l["id"],
                            "pop_id": far,
                            "pop_name": pop_by_id[far]["name"],
                        }
                    )

    return {
        "pop_status": pop_status,
        "link_status": link_status,
        "reachable": reachable,
        "alt_paths": alt_paths,
    }
