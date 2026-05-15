"""
Razorpay Payment Service — Create orders, verify payment signatures
"""

import hmac
import hashlib
import logging
from datetime import datetime
from typing import Dict, Optional
from ..core.config import settings

logger = logging.getLogger(__name__)


def _get_razorpay_client():
    try:
        import razorpay
        return razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
    except ImportError:
        logger.error("razorpay package not installed. Run: pip install razorpay")
        return None
    except Exception as e:
        logger.error(f"Razorpay client init failed: {e}")
        return None


def create_razorpay_order(amount_inr: float, order_id: str, crop_name: str) -> Dict:
    """
    Create a Razorpay order.
    amount_inr: total price in INR (₹)
    Returns: Razorpay order object with id, amount, currency
    """
    client = _get_razorpay_client()
    if not client:
        raise RuntimeError("Razorpay not configured")

    amount_paise = int(amount_inr * 100)  # Razorpay uses smallest currency unit
    order_data = {
        "amount": amount_paise,
        "currency": "INR",
        "receipt": f"farmAI_{order_id}",
        "notes": {
            "crop_name": crop_name,
            "platform": "Farm AI",
        },
    }
    rz_order = client.order.create(data=order_data)
    logger.info(f"Razorpay order created: {rz_order['id']} for ₹{amount_inr}")
    return rz_order


def verify_payment_signature(
    razorpay_order_id: str,
    razorpay_payment_id: str,
    razorpay_signature: str,
) -> bool:
    """
    Verify Razorpay payment signature using HMAC SHA256.
    Must be called after successful payment to confirm it's authentic.
    """
    if not settings.RAZORPAY_KEY_SECRET:
        logger.warning("RAZORPAY_KEY_SECRET not set — skipping verification (test mode)")
        return True

    message = f"{razorpay_order_id}|{razorpay_payment_id}"
    expected = hmac.new(
        settings.RAZORPAY_KEY_SECRET.encode("utf-8"),
        message.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    is_valid = hmac.compare_digest(expected, razorpay_signature)
    if not is_valid:
        logger.warning(f"Payment signature verification FAILED for payment {razorpay_payment_id}")
    return is_valid


def get_payment_details(payment_id: str) -> Optional[Dict]:
    """Fetch payment details from Razorpay API."""
    client = _get_razorpay_client()
    if not client:
        return None
    try:
        return client.payment.fetch(payment_id)
    except Exception as e:
        logger.error(f"Failed to fetch payment {payment_id}: {e}")
        return None
