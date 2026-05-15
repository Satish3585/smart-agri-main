"""
Payment routes — Razorpay integration for Farm AI marketplace orders
"""

from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime
from bson import ObjectId
from pydantic import BaseModel
from typing import Optional

from ...core.database import get_database
from ..dependencies import get_current_user
from ...core.config import settings
from ...services.payment_service import (
    create_razorpay_order, verify_payment_signature, get_payment_details
)

router = APIRouter(prefix="/payment", tags=["Payments"])


class PaymentOrderRequest(BaseModel):
    listing_id: str
    quantity_kg: float
    delivery_address: str
    notes: Optional[str] = None


class PaymentVerifyRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    farm_ai_order_id: str


@router.post("/create-order")
async def create_payment_order(
    data: PaymentOrderRequest,
    current_user=Depends(get_current_user),
    db=Depends(get_database),
):
    """
    Step 1 of payment flow:
    Create a Razorpay order for a marketplace listing.
    Returns the Razorpay order_id, amount and the key_id for frontend checkout.
    """
    listing = await db.listings.find_one({"_id": ObjectId(data.listing_id), "status": "active"})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found or unavailable")
    if listing["quantity_kg"] < data.quantity_kg:
        raise HTTPException(status_code=400, detail=f"Only {listing['quantity_kg']} kg available")

    total_price = round(data.quantity_kg * listing["price_per_kg"], 2)

    # Create pending order in our DB first
    farm_order = {
        "listing_id": data.listing_id,
        "crop_name": listing["crop_name"],
        "buyer_id": str(current_user["_id"]),
        "buyer_name": current_user["name"],
        "seller_id": listing["seller_id"],
        "seller_name": listing["seller_name"],
        "quantity_kg": data.quantity_kg,
        "price_per_kg": listing["price_per_kg"],
        "total_price": total_price,
        "delivery_address": data.delivery_address,
        "notes": data.notes,
        "status": "payment_pending",
        "payment_method": "razorpay",
        "razorpay_order_id": None,
        "razorpay_payment_id": None,
        "created_at": datetime.utcnow(),
    }
    result = await db.orders.insert_one(farm_order)
    farm_order_id = str(result.inserted_id)

    # Create Razorpay order
    try:
        rz_order = create_razorpay_order(
            amount_inr=total_price,
            order_id=farm_order_id,
            crop_name=listing["crop_name"],
        )
        # Store the Razorpay order ID in our DB
        await db.orders.update_one(
            {"_id": result.inserted_id},
            {"$set": {"razorpay_order_id": rz_order["id"]}}
        )
        return {
            "farm_order_id": farm_order_id,
            "razorpay_order_id": rz_order["id"],
            "amount": rz_order["amount"],        # in paise
            "amount_inr": total_price,
            "currency": "INR",
            "key_id": settings.RAZORPAY_KEY_ID,  # sent to frontend for checkout
            "crop_name": listing["crop_name"],
            "seller_name": listing["seller_name"],
            "buyer_name": current_user["name"],
            "buyer_email": current_user["email"],
        }
    except Exception as e:
        # Clean up pending order on failure
        await db.orders.delete_one({"_id": result.inserted_id})
        raise HTTPException(status_code=502, detail=f"Payment gateway error: {str(e)}")


@router.post("/verify")
async def verify_payment(
    data: PaymentVerifyRequest,
    current_user=Depends(get_current_user),
    db=Depends(get_database),
):
    """
    Step 2 of payment flow:
    Verify Razorpay payment signature after frontend checkout success.
    Updates order status to 'paid' and reduces listing quantity.
    """
    # Verify signature
    is_valid = verify_payment_signature(
        data.razorpay_order_id,
        data.razorpay_payment_id,
        data.razorpay_signature,
    )
    if not is_valid:
        raise HTTPException(status_code=400, detail="Payment verification failed — invalid signature")

    # Find our order
    order = await db.orders.find_one({"_id": ObjectId(data.farm_ai_order_id)})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order["buyer_id"] != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="Not authorized")

    # Update order to paid
    await db.orders.update_one(
        {"_id": ObjectId(data.farm_ai_order_id)},
        {"$set": {
            "status": "paid",
            "razorpay_payment_id": data.razorpay_payment_id,
            "razorpay_signature": data.razorpay_signature,
            "paid_at": datetime.utcnow(),
        }}
    )

    # Reduce listing quantity
    listing = await db.listings.find_one({"_id": ObjectId(order["listing_id"])})
    if listing:
        new_qty = max(0, listing["quantity_kg"] - order["quantity_kg"])
        await db.listings.update_one(
            {"_id": ObjectId(order["listing_id"])},
            {"$set": {
                "quantity_kg": new_qty,
                "status": "active" if new_qty > 0 else "sold"
            }}
        )

    return {
        "success": True,
        "order_id": data.farm_ai_order_id,
        "payment_id": data.razorpay_payment_id,
        "status": "paid",
        "message": "Payment verified successfully. Order confirmed!",
    }


@router.get("/status/{order_id}")
async def payment_status(
    order_id: str,
    current_user=Depends(get_current_user),
    db=Depends(get_database),
):
    """Get payment/order status."""
    order = await db.orders.find_one({"_id": ObjectId(order_id)})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order["buyer_id"] != str(current_user["_id"]) and str(current_user.get("role")) != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    return {
        "order_id": order_id,
        "status": order.get("status"),
        "total_price": order.get("total_price"),
        "crop_name": order.get("crop_name"),
        "payment_id": order.get("razorpay_payment_id"),
        "paid_at": order.get("paid_at", "").isoformat() if order.get("paid_at") else None,
    }
