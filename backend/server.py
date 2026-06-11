from fastapi import FastAPI, APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import shutil
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="Micro Multimedia Grup API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class StatusCheckCreate(BaseModel):
    client_name: str


class SurveyLead(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    phone: Optional[str] = None
    location: str
    camera_count: int
    building_type: str
    ceiling_condition: str
    service_type: Optional[str] = "paket_lengkap"  # paket_lengkap | jasa_pasang
    notes: Optional[str] = None
    file_paths: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# Routes
@api_router.get("/")
async def root():
    return {"message": "Micro Multimedia Grup API"}


@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_obj = StatusCheck(**input.model_dump())
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    await db.status_checks.insert_one(doc)
    return status_obj


@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    return status_checks


@api_router.post("/leads")
async def create_lead(
    name: str = Form(...),
    location: str = Form(...),
    camera_count: int = Form(...),
    building_type: str = Form(...),
    ceiling_condition: str = Form(...),
    phone: Optional[str] = Form(None),
    service_type: Optional[str] = Form("paket_lengkap"),
    notes: Optional[str] = Form(None),
    files: Optional[List[UploadFile]] = File(None),
):
    if camera_count < 1:
        raise HTTPException(status_code=400, detail="Jumlah kamera minimal 1.")

    lead_id = str(uuid.uuid4())
    saved_paths: List[str] = []

    if files:
        lead_dir = UPLOAD_DIR / lead_id
        lead_dir.mkdir(parents=True, exist_ok=True)
        for f in files:
            if not f or not f.filename:
                continue
            safe_name = f.filename.replace("/", "_").replace("\\", "_")
            dest = lead_dir / safe_name
            with dest.open("wb") as buffer:
                shutil.copyfileobj(f.file, buffer)
            saved_paths.append(f"/api/uploads/{lead_id}/{safe_name}")

    lead = SurveyLead(
        id=lead_id,
        name=name,
        phone=phone,
        location=location,
        camera_count=camera_count,
        building_type=building_type,
        ceiling_condition=ceiling_condition,
        service_type=service_type or "paket_lengkap",
        notes=notes,
        file_paths=saved_paths,
    )

    doc = lead.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.survey_leads.insert_one(doc)

    return JSONResponse(
        {
            "success": True,
            "id": lead.id,
            "message": "Lead survey berhasil disimpan.",
            "file_paths": saved_paths,
        }
    )


@api_router.get("/leads")
async def list_leads(limit: int = 100):
    leads = await db.survey_leads.find({}, {"_id": 0}).sort("created_at", -1).to_list(limit)
    return leads


# Mount uploads directory under /api so it goes through ingress
app.mount("/api/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

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
