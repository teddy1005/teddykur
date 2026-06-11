"""Backend tests for Micro Multimedia Grup CCTV API.
Covers: /api/status (existing), /api/leads (POST multipart + file upload, GET list),
/api/uploads static serving.
"""
import io
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://keamanan-pro.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    return s


# --- Existing /api/status -----------------------------------------------------
class TestStatus:
    def test_status_post(self, session):
        r = session.post(f"{API}/status", json={"client_name": "TEST_client"})
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["client_name"] == "TEST_client"
        assert "id" in data and isinstance(data["id"], str)

    def test_status_get(self, session):
        r = session.get(f"{API}/status")
        assert r.status_code == 200
        assert isinstance(r.json(), list)


# --- /api/leads --------------------------------------------------------------
class TestLeads:
    def test_create_lead_basic_no_files(self, session):
        data = {
            "name": "TEST_Budi",
            "location": "Bandung - Cidadap",
            "camera_count": "8",
            "building_type": "rumah_2_lantai",
            "ceiling_condition": "gypsum",
            "service_type": "paket_lengkap",
            "phone": "08123456789",
            "notes": "TEST notes",
        }
        r = session.post(f"{API}/leads", data=data)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["success"] is True
        assert isinstance(body["id"], str) and len(body["id"]) > 0
        assert body["file_paths"] == []

    def test_create_lead_invalid_camera_count(self, session):
        data = {
            "name": "TEST_Bad",
            "location": "X",
            "camera_count": "0",
            "building_type": "ruko",
            "ceiling_condition": "gypsum",
        }
        r = session.post(f"{API}/leads", data=data)
        assert r.status_code == 400, r.text
        assert "kamera" in r.json().get("detail", "").lower()

    def test_create_lead_missing_required(self, session):
        # missing 'location'
        data = {
            "name": "TEST_Missing",
            "camera_count": "4",
            "building_type": "ruko",
            "ceiling_condition": "gypsum",
        }
        r = session.post(f"{API}/leads", data=data)
        assert r.status_code == 422, r.text

    def test_create_lead_with_file_and_static_serve(self, session):
        # 1x1 PNG bytes
        png_bytes = (
            b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
            b"\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\rIDATx\x9cc\xf8"
            b"\xcf\xc0\x00\x00\x00\x03\x00\x01\x5b\xcd\xb6\x96\x00\x00\x00\x00IEND\xaeB`\x82"
        )
        data = {
            "name": "TEST_FileUser",
            "location": "Jakarta",
            "camera_count": "4",
            "building_type": "ruko",
            "ceiling_condition": "dak_beton",
            "service_type": "jasa_pasang",
        }
        files = [("files", ("sample.png", io.BytesIO(png_bytes), "image/png"))]
        r = session.post(f"{API}/leads", data=data, files=files)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["success"] is True
        assert len(body["file_paths"]) == 1
        path = body["file_paths"][0]
        assert path.startswith("/api/uploads/")
        assert path.endswith("sample.png")
        assert body["id"] in path

        # Verify file is served via /api/uploads
        url = f"{BASE_URL}{path}"
        r2 = session.get(url)
        assert r2.status_code == 200, f"Static serve failed: {r2.status_code} {url}"
        assert r2.content[:8] == b"\x89PNG\r\n\x1a\n"

    def test_list_leads_sorted_desc(self, session):
        r = session.get(f"{API}/leads")
        assert r.status_code == 200
        leads = r.json()
        assert isinstance(leads, list)
        assert len(leads) >= 1
        # Confirm sorted desc by created_at
        timestamps = [l.get("created_at") for l in leads if l.get("created_at")]
        assert timestamps == sorted(timestamps, reverse=True)
        # Verify previously created TEST lead exists
        names = [l["name"] for l in leads]
        assert any(n.startswith("TEST_") for n in names)
