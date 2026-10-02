"""Iteration 4 backend tests:
- SNMP test-connection no longer errors with pysnmp import issue (pysnmp 7 async v3arch)
- New RouterOS binary API method via librouteros (plain port 8728, v6/v7)
- REST method still works (regression)
- Live polling with 'api' method does not crash engine
- Topology engine regression (simulate-fault)
Restores demo state after each test.
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


# ----------------- FIX A: SNMP no import error -----------------
class TestSnmpNoImportError:
    def test_snmp_test_connection_returns_snmp_error_not_import(self, admin_s):
        body = {
            "name": "QA SNMP", "code": "QAS",
            "latitude": -6.3, "longitude": 106.9,
            "mikrotik_ip": "1.1.1.1", "access_method": "snmp",
            "api_port": 161, "snmp_community": "public",
            "interfaces": ["ether1"],
        }
        r = admin_s.post(f"{API}/pops", json=body, timeout=15)
        assert r.status_code == 200, r.text
        pid = r.json()["id"]
        try:
            r2 = admin_s.post(f"{API}/pops/{pid}/test-connection", timeout=90)
            assert r2.status_code == 200, f"must not 500: {r2.status_code} {r2.text}"
            data = r2.json()
            assert data.get("method") == "snmp"
            assert data.get("ok") is False
            msg = data.get("message", "")
            assert "SNMP error" in msg, f"expected 'SNMP error' got: {msg}"
            assert "cannot import name" not in msg.lower(), f"import error leaked: {msg}"
        finally:
            admin_s.delete(f"{API}/pops/{pid}", timeout=15)


# ----------------- FIX B: New librouteros binary API method -----------------
class TestBinaryApiMethod:
    def test_api_method_test_connection(self, admin_s):
        body = {
            "name": "QA API", "code": "QAA",
            "latitude": -6.32, "longitude": 106.92,
            "mikrotik_ip": "1.1.1.1", "access_method": "api",
            "api_port": 8728, "username": "admin", "password": "x",
            "interfaces": ["ether1"],
        }
        r = admin_s.post(f"{API}/pops", json=body, timeout=15)
        assert r.status_code == 200, r.text
        pid = r.json()["id"]
        try:
            r2 = admin_s.post(f"{API}/pops/{pid}/test-connection", timeout=90)
            assert r2.status_code == 200, f"must not 500: {r2.status_code} {r2.text}"
            data = r2.json()
            assert data.get("method") == "api"
            assert data.get("ok") is False
            msg = data.get("message", "")
            assert "API error" in msg, f"expected 'API error' got: {msg}"
            assert "cannot import" not in msg.lower(), f"import error leaked: {msg}"
        finally:
            admin_s.delete(f"{API}/pops/{pid}", timeout=15)


# ----------------- REST regression -----------------
class TestRestRegression:
    def test_rest_still_errors_cleanly(self, admin_s):
        body = {
            "name": "QA REST", "code": "QAR",
            "latitude": -6.33, "longitude": 106.93,
            "mikrotik_ip": "1.1.1.1", "access_method": "rest",
            "api_port": 443, "username": "admin", "password": "x",
            "interfaces": ["ether1"],
        }
        r = admin_s.post(f"{API}/pops", json=body, timeout=15)
        assert r.status_code == 200, r.text
        pid = r.json()["id"]
        try:
            r2 = admin_s.post(f"{API}/pops/{pid}/test-connection", timeout=90)
            assert r2.status_code == 200, f"must not 500: {r2.status_code} {r2.text}"
            data = r2.json()
            assert data.get("method") == "rest"
            assert data.get("ok") is False
            assert "REST error" in data.get("message", "")
        finally:
            admin_s.delete(f"{API}/pops/{pid}", timeout=15)


# ----------------- Live polling with api method does not crash -----------------
class TestLivePollingApiMethod:
    def test_pope_live_api_mode(self, admin_s):
        r = admin_s.put(f"{API}/pops/pop-e", json={
            "simulation_enabled": False,
            "access_method": "api",
            "mikrotik_ip": "1.1.1.1",
            "api_port": 8728,
            "username": "admin",
            "password": "x",
        }, timeout=15)
        assert r.status_code == 200, r.text
        try:
            rc = admin_s.post(f"{API}/monitoring/check", timeout=120)
            assert rc.status_code == 200, f"check should not 500: {rc.status_code} {rc.text}"
            time.sleep(1)
            all_pops = admin_s.get(f"{API}/pops", timeout=15).json()
            pope = next(p for p in all_pops if p["id"] == "pop-e")
            assert pope["status"] in ("DOWN", "DEGRADED", "UNKNOWN"), f"got {pope['status']}"
        finally:
            admin_s.put(f"{API}/pops/pop-e", json={
                "simulation_enabled": True,
                "access_method": "rest",
                "mikrotik_ip": "10.0.4.1",
                "api_port": 443,
                "latitude": POP_E_LAT,
                "longitude": POP_E_LNG,
            }, timeout=15)
            admin_s.post(f"{API}/monitoring/check", timeout=60)
            time.sleep(1)
            all_pops = admin_s.get(f"{API}/pops", timeout=15).json()
            pope = next(p for p in all_pops if p["id"] == "pop-e")
            assert pope["status"] == "UP", f"POP-E should be UP after restore, got {pope['status']}"


# ----------------- Regression: topology engine -----------------
class TestTopologyRegression:
    def test_simulate_fault_link_ab_down(self, admin_s):
        try:
            r = admin_s.post(f"{API}/monitoring/simulate-fault",
                             json={"pop_id": "pop-a", "interfaces_down": ["ether2"]},
                             timeout=30)
            assert r.status_code == 200, r.text
            links = admin_s.get(f"{API}/links", timeout=15).json()
            link_ab = next((l for l in links
                            if {l["pop_a"], l["pop_b"]} == {"pop-a", "pop-b"}), None)
            assert link_ab is not None, "no A-B link found"
            assert link_ab["status"] == "DOWN"
            assert "INTERFACE" in (link_ab.get("status_reason") or "").upper()
            pops = admin_s.get(f"{API}/pops", timeout=15).json()
            for p in pops:
                assert p["status"] == "UP", f"{p['id']} not UP: {p['status']}"
        finally:
            admin_s.post(f"{API}/monitoring/simulate-fault",
                         json={"pop_id": "pop-a", "interfaces_down": []},
                         timeout=30)
