"""Iteration 2 backend tests: notification-settings, test-connection, POP edit (live config),
map route edit, plus regressions (topology sim fault + malformed Bearer -> 401)."""
import os
import pytest
import requests

BASE_URL = (os.environ.get("REACT_APP_BACKEND_URL") or "https://fiber-ops-5.preview.emergentagent.com").rstrip("/")
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


# ---------------- Notification settings ----------------
class TestNotificationSettings:
    def test_viewer_can_read(self, view_s):
        r = view_s.get(f"{API}/notification-settings", timeout=10)
        assert r.status_code == 200
        d = r.json()
        for k in ("enabled", "chat_id", "has_token", "trigger"):
            assert k in d
        # No raw token leak
        assert "token" not in d
        assert "token_enc" not in d

    def test_viewer_cannot_write(self, view_s):
        r = view_s.put(f"{API}/notification-settings", json={"enabled": True}, timeout=10)
        assert r.status_code == 403

    def test_operator_cannot_write(self, op_s):
        r = op_s.put(f"{API}/notification-settings", json={"enabled": True}, timeout=10)
        assert r.status_code == 403

    def test_admin_put_sets_has_token_and_hides_token(self, admin_s):
        r = admin_s.put(
            f"{API}/notification-settings",
            json={"enabled": True, "chat_id": "-1001234567890", "token": "TEST_FAKE_TOKEN:abc"},
            timeout=10,
        )
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["has_token"] is True
        assert d["chat_id"] == "-1001234567890"
        assert d["enabled"] is True
        assert "token" not in d
        assert "token_enc" not in d

    def test_test_endpoint_graceful(self, admin_s):
        # Token is fake -> should NOT 500. Must return JSON {ok:false, message}
        r = admin_s.post(f"{API}/notification-settings/test", timeout=20)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d.get("ok") is False
        assert "message" in d

    def test_operator_cannot_test(self, op_s):
        r = op_s.post(f"{API}/notification-settings/test", timeout=10)
        assert r.status_code == 403

    def test_cleanup_disable(self, admin_s):
        # Disable to avoid interfering with simulate-fault runs later.
        r = admin_s.put(f"{API}/notification-settings", json={"enabled": False}, timeout=10)
        assert r.status_code == 200
        assert r.json()["enabled"] is False


# ---------------- Test connection ----------------
class TestTestConnection:
    def test_viewer_forbidden(self, view_s):
        r = view_s.post(f"{API}/pops/pop-a/test-connection", timeout=20)
        assert r.status_code == 403

    def test_operator_can_call_and_graceful(self, op_s):
        r = op_s.post(f"{API}/pops/pop-a/test-connection", timeout=25)
        assert r.status_code == 200, r.text
        d = r.json()
        assert "reachable" in d
        assert "ok" in d
        assert "method" in d
        # Demo IPs private -> ok should be false, no 500
        assert d["ok"] is False

    def test_admin_unknown_pop_404(self, admin_s):
        r = admin_s.post(f"{API}/pops/does-not-exist/test-connection", timeout=10)
        assert r.status_code == 404


# ---------------- POP edit (live config) ----------------
class TestPopEdit:
    def test_update_pop_and_no_leak(self, admin_s):
        body = {
            "access_method": "rest",
            "api_port": 443,
            "username": "x",
            "password": "y",
            "simulation_enabled": False,
            "interfaces": ["ether1", "ether2"],
        }
        r = admin_s.put(f"{API}/pops/pop-a", json=body, timeout=15)
        assert r.status_code == 200, r.text
        d = r.json()
        assert "password" not in d
        assert "password_enc" not in d
        assert "snmp_community" not in d
        assert "snmp_community_enc" not in d
        assert d.get("has_credentials") is True
        assert d["access_method"] == "rest"
        assert d["username"] == "x"

    def test_pops_list_reflects_simulation_disabled(self, admin_s):
        r = admin_s.get(f"{API}/pops", timeout=10)
        assert r.status_code == 200
        pop_a = next(p for p in r.json() if p["id"] == "pop-a")
        assert pop_a.get("simulation", {}).get("enabled") is False

    def test_restore_simulation(self, admin_s):
        r = admin_s.put(
            f"{API}/pops/pop-a",
            json={"simulation_enabled": True, "interfaces": ["ether1", "ether2", "ether3"]},
            timeout=15,
        )
        assert r.status_code == 200
        g = admin_s.get(f"{API}/pops", timeout=10).json()
        pop_a = next(p for p in g if p["id"] == "pop-a")
        assert pop_a.get("simulation", {}).get("enabled") is True
        assert len(pop_a.get("interfaces", [])) >= 3

    def test_operator_cannot_delete_pop(self, op_s):
        r = op_s.delete(f"{API}/pops/pop-e", timeout=10)
        assert r.status_code == 403


# ---------------- Link route edit ----------------
class TestLinkRouteEdit:
    def test_update_route_and_distance(self, admin_s):
        route = [[-6.20, 106.81], [-6.19, 106.82], [-6.175, 106.827]]
        r = admin_s.put(f"{API}/links/link-ab", json={"route": route}, timeout=10)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["route"] == route
        assert d["distance_km"] > 0

    def test_get_links_reflects_route(self, admin_s):
        r = admin_s.get(f"{API}/links", timeout=10)
        assert r.status_code == 200
        link = next(l for l in r.json() if l["id"] == "link-ab")
        assert len(link["route"]) == 3
        assert link["distance_km"] > 0


# ---------------- Regressions ----------------
class TestRegressions:
    def test_simulate_fault_link_down_alt_path(self, admin_s):
        r = admin_s.post(
            f"{API}/monitoring/simulate-fault",
            json={"pop_id": "pop-a", "interfaces_down": ["ether2"]},
            timeout=30,
        )
        assert r.status_code == 200
        topo = admin_s.get(f"{API}/topology", timeout=10).json()
        pops = {p["id"]: p for p in topo["pops"]}
        links = {l["id"]: l for l in topo["links"]}
        for p in pops.values():
            assert p["status"] == "UP", f"{p['code']} became {p['status']}"
        assert links["link-ab"]["status"] == "DOWN"
        assert links["link-ab"]["status_reason"] == "INTERFACE_DOWN"
        # Restore
        admin_s.post(
            f"{API}/monitoring/simulate-fault",
            json={"pop_id": "pop-a", "interfaces_down": []},
            timeout=30,
        )

    def test_malformed_bearer_returns_401(self):
        # Garbage Bearer must return 401, NOT 500
        r = requests.get(
            f"{API}/auth/me",
            headers={"Authorization": "Bearer not-a-real-token"},
            timeout=10,
        )
        assert r.status_code == 401, f"expected 401, got {r.status_code}: {r.text[:200]}"

    def test_admin_login_still_works(self):
        s = requests.Session()
        r = s.post(f"{API}/auth/login", json=ADMIN, timeout=10)
        assert r.status_code == 200
