from fastapi import FastAPI, APIRouter, HTTPException, Request, Response
from fastapi.responses import StreamingResponse, PlainTextResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import httpx
import secrets
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Any
import uuid
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")  # Ignore MongoDB's _id field
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    # Convert to dict and serialize datetime to ISO string for MongoDB
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    # Exclude MongoDB's _id field from the query results
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    
    # Convert ISO string timestamps back to datetime objects
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return status_checks


# ---------------- Cek Tagihan Proxy ----------------
class CekTagihanRequest(BaseModel):
    no_services: str
    month: str
    year: str


class CekTagihanResponse(BaseModel):
    status: str
    message: Optional[str] = None
    data: Optional[Any] = None


MICRONET_API_BASE = os.environ.get('MICRONET_API_BASE', 'https://micronet.web.id')


@api_router.post("/cek-tagihan", response_model=CekTagihanResponse)
async def cek_tagihan(payload: CekTagihanRequest):
    """Proxy to Micro NET upstream API: /index.php/api/cek_tagihan.

    Avoids browser CORS issues and keeps the upstream URL configurable.
    """
    if not payload.no_services or not payload.month or not payload.year:
        raise HTTPException(
            status_code=400,
            detail="Parameter no_services, month, dan year wajib diisi!",
        )

    url = f"{MICRONET_API_BASE}/front/cek_tagihan"
    form = {
        "no_services": payload.no_services,
        "month": payload.month,
        "year": payload.year,
    }

    try:
        async with httpx.AsyncClient(timeout=20.0, follow_redirects=True) as http_client:
            resp = await http_client.post(
                url,
                data=form,
                headers={
                    "User-Agent": "Mozilla/5.0 (compatible; MicroNetClient/1.0)",
                    "Accept": "application/json",
                    "X-Requested-With": "XMLHttpRequest",
                },
            )
    except httpx.RequestError as exc:
        logger.exception("Upstream request error: %s", exc)
        raise HTTPException(status_code=502, detail="Tidak dapat menghubungi server tagihan. Coba lagi nanti.")

    # Try to parse upstream JSON. Upstream may return HTML on some errors (e.g. 404).
    try:
        body = resp.json()
    except Exception:
        logger.warning(
            "Upstream non-JSON response (status=%s) for no_services=%s",
            resp.status_code,
            payload.no_services,
        )
        # Map common non-JSON responses to structured errors the frontend understands.
        if resp.status_code == 404:
            return {
                "status": "error",
                "message": "No Layanan tidak terdaftar, pastikan no layanan anda benar!",
            }
        raise HTTPException(status_code=502, detail="Respons server tagihan tidak valid.")

    # Forward upstream non-2xx as proper status codes with payload preserved
    if resp.status_code >= 400:
        raise HTTPException(status_code=resp.status_code, detail=body)

    return body


# Include the router in the main app


# ---------------- LibreSpeed endpoints ----------------
# These mirror the official LibreSpeed PHP backend so the standard
# speedtest_worker.js can run unmodified. NO /api prefix is required by
# LibreSpeed, but Kubernetes ingress routes /api/* to backend, so we keep them
# under /api/speedtest/*.

_SPEEDTEST_CHUNK = secrets.token_bytes(1024 * 1024)  # 1 MiB of random data, reused


@api_router.get("/speedtest/garbage")
async def speedtest_garbage(ckSize: int = 100):
    """Returns ckSize MiB of pseudo-random data for the download test."""
    ck = max(1, min(int(ckSize), 1024))  # clamp to [1, 1024] MiB

    def gen():
        for _ in range(ck):
            yield _SPEEDTEST_CHUNK

    headers = {
        "Content-Description": "File Transfer",
        "Content-Type": "application/octet-stream",
        "Content-Disposition": "attachment; filename=random.dat",
        "Content-Transfer-Encoding": "binary",
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        "Pragma": "no-cache",
    }
    return StreamingResponse(gen(), headers=headers, media_type="application/octet-stream")


@api_router.get("/speedtest/empty")
async def speedtest_empty_get():
    return Response(
        content=b"",
        media_type="text/plain",
        headers={
            "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
            "Pragma": "no-cache",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST",
            "Access-Control-Allow-Headers": "Content-Encoding, Content-Type",
        },
    )


@api_router.post("/speedtest/empty")
async def speedtest_empty_post(request: Request):
    # Consume and discard the body for upload test
    async for _chunk in request.stream():
        pass
    return Response(
        content=b"",
        media_type="text/plain",
        headers={
            "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
            "Pragma": "no-cache",
            "Access-Control-Allow-Origin": "*",
        },
    )


@api_router.get("/speedtest/getIP")
async def speedtest_get_ip(request: Request, isp: Optional[str] = None):
    """Returns client IP and optional ISP information (JSON string)."""
    # Prefer common proxy headers used in cloud/k8s ingresses
    forwarded_for = request.headers.get("x-forwarded-for", "")
    real_ip = request.headers.get("x-real-ip", "")
    ip = (forwarded_for.split(",")[0].strip() if forwarded_for else "") or real_ip or (request.client.host if request.client else "")

    payload_text: str
    if isp:
        # Try to fetch ISP info from ipinfo-style upstream. Keep best-effort.
        ip_info = {"ip": ip, "processedString": ip, "rawIspInfo": ""}
        try:
            async with httpx.AsyncClient(timeout=4.0) as client_http:
                resp = await client_http.get(f"https://ipwho.is/{ip}")
                if resp.status_code == 200:
                    data = resp.json()
                    if data.get("success", True):
                        org = (data.get("connection") or {}).get("isp") or data.get("org") or "Unknown ISP"
                        country = data.get("country", "")
                        ip_info["processedString"] = f"{ip} - {org}, {country}".strip(", ")
                        ip_info["rawIspInfo"] = data
        except Exception as exc:  # noqa: BLE001
            logger.debug("ISP lookup skipped: %s", exc)

        import json as _json
        payload_text = _json.dumps(ip_info)
    else:
        payload_text = ip

    return PlainTextResponse(
        payload_text,
        headers={
            "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
            "Pragma": "no-cache",
            "Access-Control-Allow-Origin": "*",
        },
    )


# Register all routes
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()