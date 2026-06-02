"""Expo push notifications.

Sends to Expo's public push API. Safe to call even if no tokens exist (no-op).
Used to alert managers about margin risk and new ÄTA from the field.
"""
import logging

from .models import DeviceToken, UserProfile

logger = logging.getLogger(__name__)

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"


def _send(tokens, title, body, data=None):
    tokens = [t for t in tokens if t and t.startswith("ExponentPushToken")]
    if not tokens:
        return
    try:
        import requests

        messages = [
            {"to": t, "sound": "default", "title": title, "body": body, "data": data or {}}
            for t in tokens
        ]
        requests.post(EXPO_PUSH_URL, json=messages, timeout=8)
    except Exception:  # pragma: no cover - never break the request on push failure
        logger.exception("Expo push failed")


def notify_company(company_id, title, body, data=None, roles=None):
    """Push to a company's members, optionally filtered by role."""
    if not company_id:
        return
    profiles = UserProfile.objects.filter(company_id=company_id)
    if roles:
        profiles = profiles.filter(role__in=roles)
    user_ids = list(profiles.values_list("user_id", flat=True))
    if not user_ids:
        return
    tokens = list(
        DeviceToken.objects.filter(user_id__in=user_ids).values_list("token", flat=True)
    )
    _send(tokens, title, body, data)


def notify_managers(company_id, title, body, data=None):
    notify_company(company_id, title, body, data, roles=[UserProfile.Role.MANAGER])
