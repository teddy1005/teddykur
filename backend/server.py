import os
import logging
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")

from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

from db import db
from api import router as api_router
from seed import seed_admin, seed_demo
from monitor import start_engine, stop_engine, run_cycle

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

app = FastAPI(title="POP Network Monitoring & Topology")

app.include_router(api_router)

frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.pops.create_index("id", unique=True)
    await db.links.create_index("id", unique=True)
    await db.alerts.create_index("created_at")
    await db.login_attempts.create_index("identifier")
    try:
        await db.monitoring_checks.create_index("created_at", expireAfterSeconds=86400)
        await db.latency_history.create_index("created_at", expireAfterSeconds=86400)
    except Exception as e:
        logger.warning("TTL index: %s", e)
    await seed_admin()
    await seed_demo()
    await run_cycle()
    start_engine()
    logger.info("Monitoring engine started.")


@app.on_event("shutdown")
async def shutdown():
    stop_engine()
    db.client if False else None
