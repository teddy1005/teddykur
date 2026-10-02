"""Outbound Telegram notifications (no long-polling)."""
import asyncio
import logging
from datetime import datetime, timezone

from db import get_notification_settings
from security import decrypt_secret

logger = logging.getLogger(__name__)


def _send_sync(token, chat_id, text):
    import requests

    r = requests.post(
        f"https://api.telegram.org/bot{token}/sendMessage",
        json={"chat_id": chat_id, "text": text, "parse_mode": "HTML", "disable_web_page_preview": True},
        timeout=8,
    )
    return r.status_code, r.text


async def _deliver(ns, text):
    token = decrypt_secret(ns.get("token_enc", ""))
    chat_id = ns.get("chat_id")
    if not token or not chat_id:
        return {"ok": False, "message": "Bot token / chat_id not configured"}
    try:
        code, body = await asyncio.to_thread(_send_sync, token, chat_id, text)
        if code == 200:
            return {"ok": True}
        return {"ok": False, "message": f"Telegram HTTP {code}: {body[:200]}"}
    except Exception as e:
        logger.warning("telegram send failed: %s", e)
        return {"ok": False, "message": str(e)}


async def send_message(text):
    ns = await get_notification_settings()
    if not ns.get("enabled"):
        return {"ok": False, "message": "Notifications disabled"}
    return await _deliver(ns, text)


async def notify_down(kind, name, reason):
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    text = (
        f"🔴 <b>{kind} DOWN</b>\n"
        f"<b>{name}</b>\n"
        f"Reason: <code>{reason}</code>\n"
        f"<i>{ts}</i>"
    )
    return await send_message(text)


async def send_test():
    ns = await get_notification_settings()
    ts = datetime.now(timezone.utc).strftime("%H:%M:%S UTC")
    return await _deliver(ns, f"✅ <b>POP Monitor</b> test notification\nTelegram alerts are working. <i>{ts}</i>")
