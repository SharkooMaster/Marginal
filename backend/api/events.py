"""Live update events via Pusher.

Each company gets its own private-ish channel ``company-<id>`` that the
frontend subscribes to. If Pusher keys are not configured the triggers become
safe no-ops so the app keeps working with pull-to-refresh.
"""
import logging

from django.conf import settings

logger = logging.getLogger(__name__)

_client = None


def _get_client():
    global _client
    if _client is not None:
        return _client
    if not (settings.PUSHER_APP_ID and settings.PUSHER_KEY and settings.PUSHER_SECRET):
        return None
    try:
        import pusher

        _client = pusher.Pusher(
            app_id=settings.PUSHER_APP_ID,
            key=settings.PUSHER_KEY,
            secret=settings.PUSHER_SECRET,
            cluster=settings.PUSHER_CLUSTER,
            ssl=True,
        )
        return _client
    except Exception:  # pragma: no cover - defensive
        logger.exception("Could not initialise Pusher client")
        return None


def company_channel(company_id):
    return f"company-{company_id}"


def trigger_company_event(company_id, event, data):
    """Send an event to a company's channel. No-op if Pusher isn't configured."""
    if not company_id:
        return
    client = _get_client()
    if client is None:
        return
    try:
        client.trigger(company_channel(company_id), event, data or {})
    except Exception:  # pragma: no cover - never break the request on telemetry
        logger.exception("Pusher trigger failed for %s/%s", company_id, event)
