"""
Core AI Service — Adaptive Market Balancing + XAI Engine
"""

import httpx
import logging
from datetime import datetime
from typing import List, Dict, Optional, Tuple
from motor.motor_asyncio import AsyncIOMotorDatabase

from ..ml_models.crop_model import get_top_crops, CROP_DB, get_crop_by_id
from ..core.config import settings

logger = logging.getLogger(__name__)

SATURATION_THRESHOLDS = {
    "low":      (0.0,  0.30),
    "medium":   (0.30, 0.50),
    "high":     (0.50, 0.70),
    "critical": (0.70, 1.00),
}

# Market demand absorption capacity multipliers per crop (higher = market absorbs more)
DEMAND_MULTIPLIERS = {crop["id"]: crop["demand"] for crop in CROP_DB}


def get_saturation_level(index: float) -> str:
    for level, (lo, hi) in SATURATION_THRESHOLDS.items():
        if lo <= index <= hi:
            return level
    return "critical"


async def calculate_saturation_index(
    crop_id: str, region: str, season: str, db: AsyncIOMotorDatabase
) -> Tuple[float, int]:
    """
    Returns (saturation_index 0–1, farmers_count).
    saturation_index = (farmers_growing / total_farmers) / demand_multiplier
    """
    farmers_growing = await db.saturation_tracking.count_documents({
        "crop_id": crop_id, "region": region, "season": season
    })
    total_farmers = await db.users.count_documents({"role": "farmer", "state": {"$regex": region, "$options": "i"}})
    total_farmers = max(total_farmers, 10)  # avoid div/0 with floor

    demand_mult = DEMAND_MULTIPLIERS.get(crop_id, 0.75)
    raw_ratio = farmers_growing / total_farmers
    saturation_index = min(raw_ratio / demand_mult, 1.0)

    return round(saturation_index, 4), farmers_growing


def _build_xai_reasons(
    crop: Dict, soil_score: float, saturation_index: float,
    farmers_count: int, saturation_level: str, weather_compat: float
) -> List[str]:
    reasons = []

    if soil_score >= 0.80:
        reasons.append(f"Excellent soil compatibility ({round(soil_score*100)}%) — NPK levels are ideal for {crop['name']}")
    elif soil_score >= 0.60:
        reasons.append(f"Good soil compatibility ({round(soil_score*100)}%) — soil conditions support {crop['name']} growth")
    else:
        reasons.append(f"Moderate soil match ({round(soil_score*100)}%) — minor soil amendments recommended")

    if saturation_level == "low":
        reasons.append(f"Low market competition — only {farmers_count} nearby farmers growing {crop['name']}, high opportunity")
    elif saturation_level == "medium":
        reasons.append(f"Moderate competition — {farmers_count} nearby farmers, but demand still supports more supply")
    elif saturation_level == "high":
        reasons.append(f"⚠ High saturation ({round(saturation_index*100)}%) — {farmers_count} farmers already growing this crop nearby")
    else:
        reasons.append(f"🔴 Critical oversupply risk — {farmers_count} farmers growing this in your region, prices likely to drop")

    if crop["profit"] >= 80000:
        reasons.append(f"High profit potential — estimated ₹{crop['profit']:,}/acre")
    elif crop["profit"] >= 50000:
        reasons.append(f"Good profit potential — estimated ₹{crop['profit']:,}/acre")

    if weather_compat >= 0.80:
        reasons.append(f"Current weather conditions ({round(weather_compat*100)}% match) are highly favorable")

    demand = crop.get("demand", 0.75)
    if demand >= 0.85:
        reasons.append(f"Strong market demand score ({round(demand*100)}%) — consistent buyer interest")
    elif demand >= 0.75:
        reasons.append(f"Stable market demand ({round(demand*100)}%)")

    return reasons[:5]


async def get_adaptive_recommendations(
    N: float, P: float, K: float, pH: float,
    region: str, season: str,
    temperature: float = 25.0,
    rainfall: float = 80.0,
    humidity: float = 65.0,
    db: AsyncIOMotorDatabase = None
) -> Dict:
    """
    Main recommendation pipeline:
    1. Score crops by soil/climate compatibility
    2. Fetch saturation index per crop from DB
    3. Rerank by: score × 0.4 + profit × 0.3 + (1 - saturation) × 0.2 + demand × 0.1
    4. Build XAI explanations
    5. Return ranked recommendations
    """
    top_crops = get_top_crops(N, P, K, pH, temperature, rainfall, humidity, season, top_n=10)

    recommendations = []
    for rank, crop in enumerate(top_crops, 1):
        sat_index, farmers_count = (0.1, 0) if db is None else \
            await calculate_saturation_index(crop["id"], region, season, db)

        sat_level = get_saturation_level(sat_index)
        profit_score = min(crop["profit"] / 120000, 1.0)
        weather_compat = (crop["soil_score"] * 0.6 + crop.get("demand", 0.75) * 0.4)

        # Adaptive scoring: penalize saturated crops
        saturation_penalty = sat_index * 0.3
        final_score = (
            crop["soil_score"] * 0.40 +
            profit_score * 0.30 +
            (1 - sat_index) * 0.20 +
            crop.get("demand", 0.75) * 0.10
        ) * (1 - saturation_penalty * 0.5)

        xai_reasons = _build_xai_reasons(
            crop, crop["soil_score"], sat_index, farmers_count, sat_level, weather_compat
        )

        recommendations.append({
            "crop_id": crop["id"],
            "crop_name": crop["name"],
            "confidence": round(final_score, 3),
            "expected_profit_per_acre": crop["profit"],
            "saturation_level": sat_level,
            "saturation_index": sat_index,
            "farmers_growing_nearby": farmers_count,
            "market_demand_score": crop.get("demand", 0.75),
            "sustainability_score": round((1 - sat_index) * 0.6 + profit_score * 0.4, 3),
            "weather_compatibility": round(weather_compat, 3),
            "xai_explanation": xai_reasons,
            "image_url": crop["image_url"],
            "rank": 0,  # will be set after sort
        })

    # Re-sort by final confidence (adaptive score)
    recommendations.sort(key=lambda x: x["confidence"], reverse=True)
    for i, rec in enumerate(recommendations):
        rec["rank"] = i + 1

    # Build region saturation summary
    warnings = []
    if recommendations and recommendations[0]["saturation_level"] in ("high", "critical"):
        warnings.append(
            f"⚠ All top crops have high saturation in {region}. "
            f"Consider {recommendations[-1]['crop_name']} for lower competition."
        )

    region_summary = {
        "region": region,
        "season": season,
        "total_analyzed_crops": len(recommendations),
        "low_saturation_options": sum(1 for r in recommendations if r["saturation_level"] == "low"),
        "high_risk_crops": [r["crop_name"] for r in recommendations if r["saturation_level"] in ("high", "critical")],
    }

    # Try Gemini XAI for top recommendation
    if recommendations and settings.GEMINI_API_KEY:
        top = recommendations[0]
        try:
            gemini_text = await _call_gemini_xai(top, N, P, K, pH, region)
            recommendations[0]["gemini_explanation"] = gemini_text
        except Exception as e:
            logger.warning(f"Gemini XAI call failed: {e}")

    return {
        "recommendations": recommendations[:5],
        "warning": warnings[0] if warnings else None,
        "region_saturation_summary": region_summary,
        "generated_at": datetime.utcnow(),
    }


async def _call_gemini_xai(
    rec: Dict, N: float, P: float, K: float, pH: float, region: str
) -> str:
    """Call Google Gemini API to generate a farmer-friendly XAI explanation."""
    prompt = (
        f"You are an agricultural AI assistant helping farmers in India. "
        f"Explain in simple language why '{rec['crop_name']}' is recommended for a farmer with "
        f"soil NPK values N={N}, P={P}, K={K}, pH={pH} in the {region} region. "
        f"Market saturation level is {rec['saturation_level']} ({round(rec['saturation_index']*100)}%), "
        f"with {rec['farmers_growing_nearby']} nearby farmers already growing this crop. "
        f"Expected profit is ₹{rec['expected_profit_per_acre']:,}/acre. "
        f"Give exactly 4 short bullet-point reasons. Start each with a relevant emoji."
    )

    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent"
            f"?key={settings.GEMINI_API_KEY}",
            json={"contents": [{"parts": [{"text": prompt}]}]}
        )
        resp.raise_for_status()
        data = resp.json()
        return data["candidates"][0]["content"]["parts"][0]["text"]
