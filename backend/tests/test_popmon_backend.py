"""Backend tests for POP Network Monitoring app."""
import os
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://fiber-ops-5.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN = {"email": "teddykurnia10@gmail.com", "password": "PopMonitor#2026"}
OPERATOR = {"email": "operator@popmon.io", "password": "Popmon#2026"}
VIEWER = {"email": "viewer@popmon.io", "password": "Popmon#2026"}


def _login(creds):
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json=creds, timeout=15)
    assert r.status_code == 200, f"login failed {creds['email']}: {r.status_code} {r.text}"
    return s


@pytest.fixture(scope="module")
def admin_s():
    return _login(ADMIN)


@pytest.fixture(scope="module")
def op_s():
    return _login(OPERATOR)


@pytest.fixture(scope="module")
def view_s():
    return _login(VIEWER)


# --------- Auth ---------
class TestAuth:
    def test_login_invalid(self):
        r = requests.post(f"{API}/auth/login", json={"email": ADMIN["email"], "password": "wrong"}, timeout=10)
        assert r.status_code in (401, 429)

    def test_login_admin_and_me(self, admin_s):
        r = admin_s.get(f"{API}/auth/me", timeout=10)
        assert r.status_code == 200
        d = r.json()
        assert d["email"] == ADMIN["email"]
        assert d["role"] == "admin"

    def test_cookies_httponly(self):
        s = requests.Session()
        r = s.post(f"{API}/auth/login", json=ADMIN, timeout=10)
        assert r.status_code == 200
        set_cookie = r.headers.get("set-cookie", "")
        assert "access_token" in set_cookie.lower()
        assert "httponly" in set_cookie.lower()


# --------- RBAC ---------
class TestRBAC:
    def test_viewer_cannot_create_pop(self, view_s):
        r = view_s.post(f"{API}/pops", json={
            "name": "TEST_x", "code": "TX", "latitude": 0, "longitude": 0
        }, timeout=10)
        assert r.status_code == 403

    def test_viewer_cannot_change_settings(self, view_s):
        r = view_s.put(f"{API}/settings", json={"polling_interval": 15}, timeout=10)
        assert r.status_code == 403

    def test_operator_cannot_delete_pop(self, op_s):
        # try deleting a seeded pop; should 403
        r = op_s.delete(f"{API}/pops/pop-e", timeout=10)
        assert r.status_code == 403

    def test_operator_can_run_check(self, op_s):
        r = op_s.post(f"{API}/monitoring/check", timeout=30)
        assert r.status_code == 200


# --------- Core data ---------
class TestCore:
    def test_dashboard(self, admin_s):
        r = admin_s.get(f"{API}/dashboard", timeout=10)
        assert r.status_code == 200
        d = r.json()
        assert "summary" in d
        assert d["summary"]["total_pop"] >= 5
        assert "avg_latency" in d["summary"]

    def test_topology(self, admin_s):
        r = admin_s.get(f"{API}/topology", timeout=10)
        assert r.status_code == 200
        d = r.json()
        assert len(d["pops"]) >= 5
        assert len(d["links"]) >= 5

    def test_pops_no_credentials_leak(self, admin_s):
        r = admin_s.get(f"{API}/pops", timeout=10)
        assert r.status_code == 200
        for p in r.json():
            assert "password_enc" not in p
            assert "snmp_community_enc" not in p
            assert "_id" not in p
            assert "has_credentials" in p

    def test_map_settings(self, admin_s):
        r = admin_s.get(f"{API}/map-settings", timeout=10)
        assert r.status_code == 200
        assert "provider" in r.json()

    def test_settings(self, admin_s):
        r = admin_s.get(f"{API}/settings", timeout=10)
        assert r.status_code == 200
        d = r.json()
        assert "polling_interval" in d


# --------- CRUD ---------
class TestCRUD:
    created_pop_id = None
    created_link_id = None

    def test_create_pop(self, admin_s):
        r = admin_s.post(f"{API}/pops", json={
            "name": "TEST_POP_Z", "code": "TEST_Z",
            "latitude": -6.3, "longitude": 106.9,
            "interfaces": ["ether1", "ether2"],
            "simulation_enabled": True,
        }, timeout=10)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["code"] == "TEST_Z"
        assert "password_enc" not in d
        TestCRUD.created_pop_id = d["id"]

    def test_update_pop(self, admin_s):
        pid = TestCRUD.created_pop_id
        r = admin_s.put(f"{API}/pops/{pid}", json={"latitude": -6.35, "longitude": 106.95}, timeout=10)
        assert r.status_code == 200
        # verify
        g = admin_s.get(f"{API}/pops/{pid}", timeout=10).json()
        assert g["latitude"] == -6.35

    def test_create_link(self, admin_s):
        pid = TestCRUD.created_pop_id
        r = admin_s.post(f"{API}/links", json={
            "pop_a": "pop-a", "iface_a": "ether1",
            "pop_b": pid, "iface_b": "ether1",
            "name": "TEST_LINK_Z"
        }, timeout=10)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["distance_km"] > 0
        TestCRUD.created_link_id = d["id"]

    def test_delete_link_admin(self, admin_s):
        lid = TestCRUD.created_link_id
        r = admin_s.delete(f"{API}/links/{lid}", timeout=10)
        assert r.status_code == 200

    def test_delete_pop_admin(self, admin_s):
        pid = TestCRUD.created_pop_id
        r = admin_s.delete(f"{API}/pops/{pid}", timeout=10)
        assert r.status_code == 200
        g = admin_s.get(f"{API}/pops/{pid}", timeout=10)
        assert g.status_code == 404


# --------- Topology engine core (most important) ---------
class TestTopologyEngine:
    def _get(self, s):
        topo = s.get(f"{API}/topology", timeout=10).json()
        pops = {p["id"]: p for p in topo["pops"]}
        links = {l["id"]: l for l in topo["links"]}
        return pops, links

    def test_scenario_restore_baseline(self, admin_s):
        # Baseline cleanup first
        for pid in ("pop-a", "pop-b", "pop-c"):
            admin_s.post(f"{API}/monitoring/simulate-fault",
                         json={"pop_id": pid, "interfaces_down": [], "router_down": False}, timeout=30)
        pops, links = self._get(admin_s)
        for p in pops.values():
            assert p["status"] == "UP", f"{p['code']} status {p['status']}"
        for l in links.values():
            assert l["status"] in ("UP", "DEGRADED"), f"{l['name']} {l['status']}"

    def test_scenario_single_link_down_alt_path(self, admin_s):
        # Cut POP-A ether2 -> LINK-AB down, but POP-B reachable via B-C-D-A
        r = admin_s.post(f"{API}/monitoring/simulate-fault",
                         json={"pop_id": "pop-a", "interfaces_down": ["ether2"]}, timeout=30)
        assert r.status_code == 200
        pops, links = self._get(admin_s)
        # All POPs UP
        for p in pops.values():
            assert p["status"] == "UP", f"{p['code']} became {p['status']} (reason {p.get('status_reason')})"
        # LINK-AB DOWN w/ INTERFACE_DOWN
        assert links["link-ab"]["status"] == "DOWN"
        assert links["link-ab"]["status_reason"] == "INTERFACE_DOWN"

    def test_scenario_isolated_pop_b(self, admin_s):
        # Additionally cut POP-C ether1 -> POP-B isolated
        r = admin_s.post(f"{API}/monitoring/simulate-fault",
                         json={"pop_id": "pop-c", "interfaces_down": ["ether1"]}, timeout=30)
        assert r.status_code == 200
        pops, links = self._get(admin_s)
        assert pops["pop-b"]["status"] == "DOWN"
        assert pops["pop-b"]["status_reason"] == "LINK_UNREACHABLE"
        for other in ("pop-a", "pop-c", "pop-d", "pop-e"):
            assert pops[other]["status"] == "UP", f"{other} became {pops[other]['status']}"
        # Restore
        admin_s.post(f"{API}/monitoring/simulate-fault",
                     json={"pop_id": "pop-a", "interfaces_down": []}, timeout=30)
        admin_s.post(f"{API}/monitoring/simulate-fault",
                     json={"pop_id": "pop-c", "interfaces_down": []}, timeout=30)

    def test_scenario_router_down(self, admin_s):
        r = admin_s.post(f"{API}/monitoring/simulate-fault",
                         json={"pop_id": "pop-b", "router_down": True}, timeout=30)
        assert r.status_code == 200
        pops, links = self._get(admin_s)
        assert pops["pop-b"]["status"] == "DOWN"
        assert pops["pop-b"]["status_reason"] == "ROUTER_DOWN"
        # Related links should be UNKNOWN w/ ROUTER_DOWN, NOT DOWN/INTERFACE_DOWN
        for l in links.values():
            if "pop-b" in (l["pop_a"], l["pop_b"]):
                assert l["status"] == "UNKNOWN"
                assert l["status_reason"] == "ROUTER_DOWN"
        # Restore
        admin_s.post(f"{API}/monitoring/simulate-fault",
                     json={"pop_id": "pop-b", "router_down": False}, timeout=30)

    def test_final_restore(self, admin_s):
        for pid in ("pop-a", "pop-b", "pop-c"):
            admin_s.post(f"{API}/monitoring/simulate-fault",
                         json={"pop_id": pid, "interfaces_down": [], "router_down": False}, timeout=30)
        pops, _ = self._get(admin_s)
        for p in pops.values():
            assert p["status"] == "UP"


# --------- Alerts ---------
class TestAlerts:
    def test_list_alerts(self, admin_s):
        r = admin_s.get(f"{API}/alerts?limit=20", timeout=10)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_resolve_alert_operator(self, admin_s, op_s):
        # Trigger an alert transition
        admin_s.post(f"{API}/monitoring/simulate-fault",
                     json={"pop_id": "pop-a", "interfaces_down": ["ether2"]}, timeout=30)
        admin_s.post(f"{API}/monitoring/simulate-fault",
                     json={"pop_id": "pop-a", "interfaces_down": []}, timeout=30)
        time.sleep(1)
        alerts = admin_s.get(f"{API}/alerts?limit=50", timeout=10).json()
        if alerts:
            aid = alerts[0]["id"]
            r = op_s.post(f"{API}/alerts/{aid}/resolve", timeout=10)
            assert r.status_code == 200
