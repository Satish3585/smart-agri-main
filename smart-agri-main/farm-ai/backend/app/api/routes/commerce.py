from fastapi import APIRouter, Depends, HTTPException, Query
from datetime import datetime
from bson import ObjectId
from typing import Optional

from ...models.schemas import ListingCreate, OrderCreate
from ...core.database import get_database
from ..dependencies import get_current_user

router = APIRouter(prefix="/commerce", tags=["Marketplace"])


def _serialize(doc: dict) -> dict:
    doc["id"] = str(doc.pop("_id"))
    for field in ("created_at", "updated_at"):
        if field in doc and hasattr(doc[field], "isoformat"):
            doc[field] = doc[field].isoformat()
    return doc


@router.get("/listings")
async def get_listings(
    crop_name: Optional[str] = None,
    organic: Optional[bool] = None,
    state: Optional[str] = None,
    skip: int = 0,
    limit: int = 20,
    db=Depends(get_database),
):
    query: dict = {"status": "active"}
    if crop_name:
        query["crop_name"] = {"$regex": crop_name, "$options": "i"}
    if organic is not None:
        query["organic"] = organic
    if state:
        query["location"] = {"$regex": state, "$options": "i"}

    cursor = db.listings.find(query).sort("created_at", -1).skip(skip).limit(limit)
    listings = []
    async for doc in cursor:
        listings.append(_serialize(doc))
    total = await db.listings.count_documents(query)
    return {"listings": listings, "total": total, "skip": skip, "limit": limit}


@router.post("/listings", status_code=201)
async def create_listing(
    data: ListingCreate,
    current_user=Depends(get_current_user),
    db=Depends(get_database),
):
    if current_user.get("role") not in ("farmer", "admin"):
        raise HTTPException(status_code=403, detail="Only farmers can create listings")

    listing = {
        "seller_id": str(current_user["_id"]),
        "seller_name": current_user["name"],
        "seller_state": current_user.get("state", ""),
        **data.model_dump(),
        "status": "active",
        "created_at": datetime.utcnow(),
        "views": 0,
    }
    result = await db.listings.insert_one(listing)
    listing["_id"] = result.inserted_id
    return _serialize(listing)


@router.put("/listings/{listing_id}")
async def update_listing(
    listing_id: str,
    update_data: dict,
    current_user=Depends(get_current_user),
    db=Depends(get_database),
):
    listing = await db.listings.find_one({"_id": ObjectId(listing_id)})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing["seller_id"] != str(current_user["_id"]) and current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    allowed = {"quantity_kg", "price_per_kg", "description", "status", "images"}
    update = {k: v for k, v in update_data.items() if k in allowed}
    update["updated_at"] = datetime.utcnow()
    await db.listings.update_one({"_id": ObjectId(listing_id)}, {"$set": update})
    updated = await db.listings.find_one({"_id": ObjectId(listing_id)})
    return _serialize(updated)


@router.post("/orders", status_code=201)
async def place_order(
    data: OrderCreate,
    current_user=Depends(get_current_user),
    db=Depends(get_database),
):
    listing = await db.listings.find_one({"_id": ObjectId(data.listing_id), "status": "active"})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found or unavailable")
    if listing["quantity_kg"] < data.quantity_kg:
        raise HTTPException(status_code=400, detail=f"Only {listing['quantity_kg']} kg available")

    order = {
        "listing_id": data.listing_id,
        "crop_name": listing["crop_name"],
        "buyer_id": str(current_user["_id"]),
        "buyer_name": current_user["name"],
        "seller_id": listing["seller_id"],
        "seller_name": listing["seller_name"],
        "quantity_kg": data.quantity_kg,
        "price_per_kg": listing["price_per_kg"],
        "total_price": round(data.quantity_kg * listing["price_per_kg"], 2),
        "delivery_address": data.delivery_address,
        "notes": data.notes,
        "status": "pending",
        "created_at": datetime.utcnow(),
    }
    result = await db.orders.insert_one(order)
    # Reduce listing quantity
    new_qty = listing["quantity_kg"] - data.quantity_kg
    status_update = "active" if new_qty > 0 else "sold"
    await db.listings.update_one(
        {"_id": ObjectId(data.listing_id)},
        {"$set": {"quantity_kg": new_qty, "status": status_update}}
    )
    order["_id"] = result.inserted_id
    return _serialize(order)


@router.get("/orders/my")
async def my_orders(
    current_user=Depends(get_current_user),
    db=Depends(get_database),
):
    user_id = str(current_user["_id"])
    query = {"$or": [{"buyer_id": user_id}, {"seller_id": user_id}]}
    cursor = db.orders.find(query).sort("created_at", -1).limit(50)
    orders = []
    async for doc in cursor:
        orders.append(_serialize(doc))
    return orders


@router.get("/my-listings")
async def my_listings(
    current_user=Depends(get_current_user),
    db=Depends(get_database),
):
    cursor = db.listings.find({"seller_id": str(current_user["_id"])}).sort("created_at", -1)
    listings = []
    async for doc in cursor:
        listings.append(_serialize(doc))
    return listings
