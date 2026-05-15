from fastapi import APIRouter, Depends, Query
from datetime import datetime

from ...core.database import get_database
from ..dependencies import get_admin_user
from ...services.market_service import get_saturation_dashboard, get_market_alerts
from ...ml_models.crop_model import CROP_DB

router = APIRouter(prefix="/admin", tags=["Admin Panel"])


@router.get("/dashboard")
async def admin_dashboard(
    db=Depends(get_database),
    _=Depends(get_admin_user),
):
    total_farmers = await db.users.count_documents({"role": "farmer"})
    total_buyers = await db.users.count_documents({"role": "buyer"})
    total_recs = await db.recommendations.count_documents({})
    total_disease = await db.disease_reports.count_documents({})
    active_listings = await db.listings.count_documents({"status": "active"})
    completed_orders = await db.orders.count_documents({"status": "completed"})

    # Top growing crop
    pipeline = [
        {"$group": {"_id": "$crop_id", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 1},
    ]
    top_crop_doc = await db.saturation_tracking.aggregate(pipeline).to_list(1)
    top_crop = top_crop_doc[0]["_id"] if top_crop_doc else "N/A"

    # Highest saturation (based on count)
    pipeline2 = [
        {"$group": {"_id": "$crop_id", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 1},
    ]
    sat_doc = await db.saturation_tracking.aggregate(pipeline2).to_list(1)
    highest_sat = sat_doc[0]["_id"] if sat_doc else "N/A"

    platform_health = min(
        100,
        max(0, 80 - (total_recs * 0 + total_disease * 0) + (active_listings * 0.1))
    )

    return {
        "total_farmers": total_farmers,
        "total_buyers": total_buyers,
        "total_recommendations": total_recs,
        "total_disease_reports": total_disease,
        "active_listings": active_listings,
        "completed_orders": completed_orders,
        "top_growing_crop": top_crop,
        "highest_saturation_crop": highest_sat,
        "platform_health_score": round(platform_health, 1),
        "generated_at": datetime.utcnow().isoformat(),
    }


@router.get("/saturation-overview")
async def saturation_overview(
    season: str = Query("kharif"),
    db=Depends(get_database),
    _=Depends(get_admin_user),
):
    regions = [
        "Karnataka", "Maharashtra", "Andhra Pradesh", "Telangana",
        "Tamil Nadu", "Gujarat", "Punjab", "Haryana"
    ]
    overview = {}
    for region in regions:
        dashboard = await get_saturation_dashboard(region, season, db)
        critical = [d for d in dashboard if d["saturation_level"] == "critical"]
        overview[region] = {
            "total_crops": len(dashboard),
            "critical_crops": len(critical),
            "critical_crop_names": [c["crop_name"] for c in critical],
            "market_health": "critical" if len(critical) > 3 else "warning" if len(critical) > 1 else "healthy",
        }
    return {"season": season, "regions": overview}


@router.get("/users")
async def list_users(
    role: str = None,
    skip: int = 0,
    limit: int = 50,
    db=Depends(get_database),
    _=Depends(get_admin_user),
):
    query = {}
    if role:
        query["role"] = role
    cursor = db.users.find(query, {"password_hash": 0}).sort("created_at", -1).skip(skip).limit(limit)
    users = []
    async for doc in cursor:
        doc["id"] = str(doc.pop("_id"))
        if "created_at" in doc:
            doc["created_at"] = doc["created_at"].isoformat()
        users.append(doc)
    total = await db.users.count_documents(query)
    return {"users": users, "total": total}


@router.get("/recommendations-log")
async def recommendations_log(
    skip: int = 0,
    limit: int = 50,
    db=Depends(get_database),
    _=Depends(get_admin_user),
):
    cursor = db.recommendations.find({}).sort("created_at", -1).skip(skip).limit(limit)
    logs = []
    async for doc in cursor:
        doc["id"] = str(doc.pop("_id"))
        if "created_at" in doc:
            doc["created_at"] = doc["created_at"].isoformat()
        logs.append(doc)
    total = await db.recommendations.count_documents({})
    return {"logs": logs, "total": total}


@router.get("/disease-reports")
async def disease_reports(
    skip: int = 0,
    limit: int = 50,
    db=Depends(get_database),
    _=Depends(get_admin_user),
):
    cursor = db.disease_reports.find({}).sort("timestamp", -1).skip(skip).limit(limit)
    reports = []
    async for doc in cursor:
        doc["id"] = str(doc.pop("_id"))
        if "timestamp" in doc:
            doc["timestamp"] = doc["timestamp"].isoformat()
        reports.append(doc)
    total = await db.disease_reports.count_documents({})
    return {"reports": reports, "total": total}
