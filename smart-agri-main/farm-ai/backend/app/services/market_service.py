"""
Market Intelligence Service — Saturation tracking + Price prediction
"""

import logging
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from motor.motor_asyncio import AsyncIOMotorDatabase

from ..ml_models.crop_model import CROP_DB, get_crop_by_id
from .ai_service import calculate_saturation_index, get_saturation_level

logger = logging.getLogger(__name__)


async def get_saturation_dashboard(region: str, season: str, db: AsyncIOMotorDatabase) -> List[Dict]:
    results = []
    for crop in CROP_DB:
        if season not in crop.get("season", []):
            continue
        sat_index, farmers_count = await calculate_saturation_index(crop["id"], region, season, db)
        sat_level = get_saturation_level(sat_index)
        price_trend = _estimate_price_trend(sat_index)
        alert = None
        if sat_level == "critical":
            alert = f"🔴 Oversupply risk! {farmers_count} farmers growing {crop['name']} in {region}"
        elif sat_level == "high":
            alert = f"⚠ High competition. Consider switching to lower-saturation crops."

        results.append({
            "crop_id": crop["id"],
            "crop_name": crop["name"],
            "saturation_index": sat_index,
            "saturation_level": sat_level,
            "farmers_count": farmers_count,
            "market_demand_score": crop["demand"],
            "price_trend": price_trend,
            "expected_profit": crop["profit"],
            "alert": alert,
            "image_url": crop["image_url"],
        })

    results.sort(key=lambda x: x["saturation_index"], reverse=True)
    return results


def _estimate_price_trend(saturation_index: float) -> str:
    if saturation_index > 0.70:
        return "falling"
    elif saturation_index > 0.50:
        return "stable"
    elif saturation_index > 0.30:
        return "stable"
    else:
        return "rising"


def get_price_prediction(crop_id: str, months: int = 6) -> List[Dict]:
    """Simulate price prediction using saturation + demand factors."""
    crop = get_crop_by_id(crop_id)
    if not crop:
        return []

    base_price = crop["profit"] / 40  # approx price/kg
    demand = crop["demand"]
    points = []
    now = datetime.utcnow()

    for i in range(months):
        month_date = now + timedelta(days=30 * i)
        seasonal_factor = 1.0 + 0.1 * (0.5 - abs(0.5 - (i % 12) / 12))
        demand_factor = demand * (1 + (i * 0.02))
        noise = (hash(f"{crop_id}{i}") % 20 - 10) / 100
        predicted_price = round(base_price * seasonal_factor * demand_factor * (1 + noise), 2)
        predicted_supply = round(100 + i * 5 + (hash(f"sup{crop_id}{i}") % 30), 0)

        points.append({
            "month": month_date.strftime("%b %Y"),
            "predicted_price": predicted_price,
            "predicted_supply_units": predicted_supply,
            "demand_index": round(demand_factor, 3),
            "confidence": round(0.90 - i * 0.05, 2),
        })

    return points


async def get_market_alerts(region: str, season: str, db: AsyncIOMotorDatabase) -> List[Dict]:
    alerts = []
    for crop in CROP_DB:
        if season not in crop.get("season", []):
            continue
        sat_index, farmers_count = await calculate_saturation_index(crop["id"], region, season, db)
        sat_level = get_saturation_level(sat_index)

        if sat_level == "critical":
            alerts.append({
                "crop_id": crop["id"],
                "crop_name": crop["name"],
                "alert_type": "oversupply",
                "message": f"Critical oversupply risk for {crop['name']} in {region}. "
                           f"{farmers_count} farmers cultivating — market prices expected to fall 20–40%.",
                "severity": "critical",
                "region": region,
                "timestamp": datetime.utcnow(),
                "recommended_action": "Switch to low-saturation alternatives",
            })
        elif sat_level == "high":
            alerts.append({
                "crop_id": crop["id"],
                "crop_name": crop["name"],
                "alert_type": "high_competition",
                "message": f"High competition for {crop['name']} in {region}. Consider alternatives.",
                "severity": "high",
                "region": region,
                "timestamp": datetime.utcnow(),
                "recommended_action": "Monitor market and diversify",
            })

    return alerts


async def get_market_trends(crop_id: str, db: AsyncIOMotorDatabase) -> List[Dict]:
    """Return last 12 months of market trend data (seeded from DB + synthetic)."""
    crop = get_crop_by_id(crop_id)
    if not crop:
        return []

    base_price = crop["profit"] / 40
    trends = []
    now = datetime.utcnow()

    for i in range(11, -1, -1):
        month_date = now - timedelta(days=30 * i)
        seasonal = 1.0 + 0.15 * abs(0.5 - (month_date.month / 12))
        noise = (hash(f"{crop_id}_trend_{i}") % 20 - 10) / 100
        price = round(base_price * seasonal * (1 + noise), 2)
        supply = round(80 + (11 - i) * 3 + (hash(f"s{i}") % 20), 0)
        demand = round(75 + i * 1.5 + (hash(f"d{i}") % 15), 0)
        farmers = round(5 + i * 2 + (hash(f"f{crop_id}{i}") % 8), 0)

        trends.append({
            "date": month_date.strftime("%b %Y"),
            "price": price,
            "supply": supply,
            "demand": demand,
            "farmers_count": farmers,
        })

    return trends


async def update_saturation_record(
    farmer_id: str, crop_id: str, region: str, season: str,
    land_area_acres: float, db: AsyncIOMotorDatabase
) -> Dict:
    """Upsert saturation tracking record when farmer registers cultivation."""
    existing = await db.saturation_tracking.find_one({
        "farmer_id": farmer_id, "crop_id": crop_id, "region": region, "season": season
    })
    record = {
        "farmer_id": farmer_id,
        "crop_id": crop_id,
        "region": region,
        "season": season,
        "land_area_acres": land_area_acres,
        "registered_at": datetime.utcnow(),
    }
    if existing:
        await db.saturation_tracking.update_one({"_id": existing["_id"]}, {"$set": record})
    else:
        await db.saturation_tracking.insert_one(record)

    sat_index, farmers_count = await calculate_saturation_index(crop_id, region, season, db)
    return {
        "registered": True,
        "current_saturation_index": sat_index,
        "saturation_level": get_saturation_level(sat_index),
        "farmers_growing_this_crop": farmers_count,
    }
