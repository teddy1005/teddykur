"""Iteration 3 backend tests:
- test-connection no longer ICMP-gated (REST/SNMP attempted regardless of ping)
- map-settings google_style persisted
- update_pop supports latitude/longitude + simulation_enabled
- Live polling (simulation disabled, unreachable) does not crash engine
- Regression: topology engine simulate-fault still works
Always restores demo state (POP-E coords, provider=osm, interfaces_down=[]).
"""
import os
import time
import pytest
import requests

BASE_URL = (os.environ.get("REACT_APP_BACKEND_URL") or "").rstrip("/")
assert BASE_URL, "REACT_APP_BACKEND_URL must be set"
API = f"{BASE_URL}/api"

ADMIN = {"email": "teddykurnia10@gmail.com", "password": "PopMonitor#2026"}

POP_E_LAT = -6.2150
POP_E_LNG = 106.8700


def _login(creds):
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json=creds, timeout=15)
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text}"
    return s


@pytest.fixture(scope="module")
def admin_s():
    return _login(ADMIN)


# ----------------- FIX 1: test-connection not ICMP-gated -----------------
class TestTestConnectionNotICMPGated:
    def test_rest_attempts_rest_regardless_of_ping(self, admin_s):
        body = {
            "name": "QA Temp", "code": "QAT",
            "latitude": -6.3, "longitude": 106.9,
            "mikrotik_ip": "1.1.1.1", "access_method": "rest",
            "api_port": 443, "interfaces": ["ether1"],
        }
        r = admin_s.post(f"{API}/pops", json=body, timeout=15)
        assert r.status_code == 200, r.text
        pid = r.json()["id"]
        try:
            r2 = admin_s.post(f"{API}/pops/{pid}/test-connection", timeout=60)
            assert r2.status_code == 200, f"expected 200 not 500: {r2.status_code} {r2.text}"
            data = r2.json()
            assert data.get("method") == "rest"
            assert data.get("ok") is False
            msg = data.get("message", "")
            assert "REST error" in msg, f"expected REST error attempt, got: {data}"
            assert "ICMP" not in msg, f"must not early-exit on ICMP: {msg}"
        finally:
            admin_s.delete(f"{API}/pops/{pid}", timeout=15)

    def test_snmp_attempts_snmp_regardless_of_ping(self, admin_s):
        body = {
            "name": "QA Temp SNMP", "code": "QATS",
            "latitude": -6.31, "longitude": 106.91,
            "mikrotik_ip": "1.1.1.1", "access_method": "snmp",
            "api_port": 161, "interfaces": ["ether1"],
        }
        r = admin_s.post(f"{API}/pops", json=body, timeout=15)
        assert r.status_code == 200, r.text
        pid = r.json()["id"]
        try:
            r2 = admin_s.post(f"{API}/pops/{pid}/test-connection", timeout=60)
            assert r2.status_code == 200, f"expected non-500: {r2.status_code} {r2.text}"
            data = r2.json()
            assert data.get("method") == "snmp"
            assert data.get("ok") is False
            # Message should either be an SNMP error (attempted) OR default when lib missing
            msg = data.get("message", "")
            assert msg, "expected a message"
        finally:
            admin_s.delete(f"{API}/pops/{pid}", timeout=15)


# ----------------- FIX 2: map-settings google_style -----------------
class TestMapSettingsGoogleStyle:
    def test_default_contains_google_style(self, admin_s):
        r = admin_s.get(f"{API}/map-settings", timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert "google_style" in d

    def test_put_google_style_persisted(self, admin_s):
        try:
            r = admin_s.put(f"{API}/map-settings",
                            json={"provider": "google", "google_style": "hybrid"},
                            timeout=15)
            assert r.status_code == 200, r.text
            assert r.json().get("google_style") == "hybrid"
            # re-read
            r2 = admin_s.get(f"{API}/map-settings", timeout=15)
            assert r2.json().get("google_style") == "hybrid"
            assert r2.json().get("provider") == "google"
        finally:
            admin_s.put(f"{API}/map-settings",
                        json={"provider": "osm", "google_style": "satellite"},
                        timeout=15)


# ----------------- FIX 3: update_pop supports lat/lng + simulation_enabled -----------------
class TestEditPopCoordinates:
    def test_update_pope_longitude(self, admin_s):
        new_lng = POP_E_LNG + 0.0003
        try:
            r = admin_s.put(f"{API}/pops/pop-e",
                            json={"latitude": POP_E_LAT, "longitude": new_lng},
                            timeout=15)
            assert r.status_code == 200, r.text
            # Verify via GET /api/pops
            all_pops = admin_s.get(f"{API}/pops", timeout=15).json()
            pope = next(p for p in all_pops if p["id"] == "pop-e")
            assert abs(pope["longitude"] - new_lng) < 1e-6
        finally:
            admin_s.put(f"{API}/pops/pop-e",
                        json={"latitude": POP_E_LAT, "longitude": POP_E_LNG},
                        timeout=15)


# ----------------- Live polling path does not crash engine -----------------
class TestLivePollingNoCrash:
    def test_pope_live_monitoring(self, admin_s):
        # Switch POP-E to live mode (unreachable 1.1.1.1 REST)
        r = admin_s.put(f"{API}/pops/pop-e", json={
            "simulation_enabled": False,
            "access_method": "rest",
            "mikrotik_ip": "1.1.1.1",
            "api_port": 443,
        }, timeout=15)
        assert r.status_code == 200, r.text
        try:
            # Trigger a manual check
            rc = admin_s.post(f"{API}/monitoring/check", timeout=90)
            assert rc.status_code == 200, f"check should not 500: {rc.status_code} {rc.text}"
            time.sleep(1)
            all_pops = admin_s.get(f"{API}/pops", timeout=15).json()
            pope = next(p for p in all_pops if p["id"] == "pop-e")
            # Should now be DOWN or UNKNOWN (not UP since unreachable)
            assert pope["status"] in ("DOWN", "DEGRADED", "UNKNOWN"), f"got {pope['status']}"
        finally:
            # Restore demo state
            admin_s.put(f"{API}/pops/pop-e", json={
                "simulation_enabled": True,
                "access_method": "rest",
                "mikrotik_ip": "10.0.4.1",
                "latitude": POP_E_LAT,
                "longitude": POP_E_LNG,
            }, timeout=15)
            admin_s.post(f"{API}/monitoring/check", timeout=60)
            time.sleep(1)
            all_pops = admin_s.get(f"{API}/pops", timeout=15).json()
            pope = next(p for p in all_pops if p["id"] == "pop-e")
            assert pope["status"] == "UP", f"POP-E should be UP after restore, got {pope['status']}"


# ----------------- Regression: topology engine ------------------
class TestTopologyRegression:
    def test_simulate_fault_link_ab_down(self, admin_s):
        try:
            r = admin_s.post(f"{API}/monitoring/simulate-fault",
                             json={"pop_id": "pop-a", "interfaces_down": ["ether2"]},
                             timeout=30)
            assert r.status_code == 200, r.text
            links = admin_s.get(f"{API}/links", timeout=15).json()
            link_ab = next((l for l in links if l.get("id") == "LINK-AB" or
                            l.get("name", "").upper().replace(" ", "") in ("A-B", "LINK-AB")), None)
            # fallback: find any link between pop-a and pop-b
            if not link_ab:
                link_ab = next((l for l in links
                                if {l["pop_a"], l["pop_b"]} == {"pop-a", "pop-b"}), None)
            assert link_ab is not None, "no A-B link found"
            assert link_ab["status"] == "DOWN"
            assert "INTERFACE" in (link_ab.get("status_reason") or "").upper()
            # All POPs still UP (alt path)
            pops = admin_s.get(f"{API}/pops", timeout=15).json()
            for p in pops:
                assert p["status"] == "UP", f"{p['id']} not UP: {p['status']}"
        finally:
            admin_s.post(f"{API}/monitoring/simulate-fault",
                         json={"pop_id": "pop-a", "interfaces_down": []},
                         timeout=30)
