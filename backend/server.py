from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import httpx
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