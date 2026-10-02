import os
from pathlib import Path
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv(Path(__file__).parent / ".env")

client = AsyncIOMotorClient(os.environ["MONGO_URL"])
db = client[os.environ["DB_NAME"]]

DEFAULT_SETTINGS = {
    "_id": "global",
    "polling_interval": 10,
    "timeout": 2,
    "retry": 2,
    "latency_normal_max": 20,
    "latency_warning_max": 50,
    "packet_loss_warning": 2,
    "packet_loss_critical": 10,
    "cpu_high": 80,
    "ram_high": 80,
}

DEFAULT_MAP_SETTINGS = {
    "_id": "global",
    "provider": "osm",
    "osm_tile": "cartodb_dark",
    "center_lat": -6.2088,
    "center_lng": 106.8456,
    "zoom": 12,
    "google_api_key_set": False,
}


async def get_settings():
    doc = await db.monitoring_settings.find_one({"_id": "global"})
    if not doc:
        await db.monitoring_settings.insert_one(dict(DEFAULT_SETTINGS))
        doc = dict(DEFAULT_SETTINGS)
    return doc


async def get_map_settings():
    doc = await db.map_settings.find_one({"_id": "global"})
    if not doc:
        await db.map_settings.insert_one(dict(DEFAULT_MAP_SETTINGS))
        doc = dict(DEFAULT_MAP_SETTINGS)
    doc.pop("google_api_key", None)
    return doc
