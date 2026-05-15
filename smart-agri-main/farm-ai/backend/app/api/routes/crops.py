from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime
from bson import ObjectId
from typing import Optional

from ...models.schemas import SoilInput, CultivationRegister
from ...core.database import get_database
from ..dependencies import get_current_user
from ...services.ai_service import get_adaptive_recommendations
from ...services.market_service import update_saturation_record, get_saturation_dashboard
from ...ml_models.crop_model import CROP_DB

router = APIRouter(prefix="/crops", tags=["Crop Recommendation"])


@router.post("/recommend")
async def recommend_crops(
    data: SoilInput,
    current_user=Depends(get_current_user),
    db=Depends(get_database),
):
    result = await get_adaptive_recommendations(
        N=data.nitrogen, P=data.phosphorus, K=data.potassium,
        pH=data.ph, region=data.region, season=data.season or "kharif",
        temperature=data.temperature or 25.0,
        rainfall=data.rainfall or 80.0,
        humidity=data.humidity or 65.0,
        db=db,
    )

    # Persist recommendation
    await db.recommendations.insert_one({
        "farmer_id": str(current_user["_id"]),
        "input": data.model_dump(),
        "top_recommendation": result["recommendations"][0]["crop_name"] if result["recommendations"] else None,
        "recommendations_count": len(result["recommendations"]),
        "created_at": datetime.utcnow(),
    })

    return result


@router.get("/catalog")
async def get_crop_catalog():
    return [
        {
            "id": c["id"],
            "name": c["name"],
            "season": c["season"],
            "profit": c["profit"],
            "demand": c["demand"],
            "image_url": c["image_url"],
            "water_intensive": c["water_intensive"],
        }
        for c in CROP_DB
    ]


@router.post("/register-cultivation")
async def register_cultivation(
    data: CultivationRegister,
    current_user=Depends(get_current_user),
    db=Depends(get_database),
):
    if current_user.get("role") not in ("farmer", "admin"):
        raise HTTPException(status_code=403, detail="Only farmers can register cultivation")

    result = await update_saturation_record(
        farmer_id=str(current_user["_id"]),
        crop_id=data.crop_id,
        region=data.region,
        season=data.season,
        land_area_acres=data.land_area_acres,
        db=db,
    )
    return result


@router.get("/saturation/{region}")
async def get_region_saturation(
    region: str,
    season: str = "kharif",
    db=Depends(get_database),
):
    return await get_saturation_dashboard(region, season, db)


@router.get("/history")
async def get_recommendation_history(
    current_user=Depends(get_current_user),
    db=Depends(get_database),
):
    cursor = db.recommendations.find(
        {"farmer_id": str(current_user["_id"])}
    ).sort("created_at", -1).limit(20)
    history = []
    async for doc in cursor:
        doc["id"] = str(doc.pop("_id"))
        doc["created_at"] = doc["created_at"].isoformat()
        history.append(doc)
    return history
