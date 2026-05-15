from fastapi import APIRouter, Depends, File, UploadFile, HTTPException, Form
from datetime import datetime
from bson import ObjectId
from typing import Optional

from ...core.database import get_database
from ..dependencies import get_current_user
from ...ml_models.disease_model import predict, get_disease_by_id, get_disease_stats

router = APIRouter(prefix="/disease", tags=["Disease Detection"])


@router.post("/detect")
async def detect_disease(
    file: UploadFile = File(...),
    crop_type: Optional[str] = Form(None),
    current_user=Depends(get_current_user),
    db=Depends(get_database),
):
    if file.content_type not in ("image/jpeg", "image/png", "image/webp", "image/jpg"):
        raise HTTPException(status_code=400, detail="Only JPEG/PNG/WebP images are accepted")

    image_bytes = await file.read()
    if len(image_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image must be under 10 MB")

    result = predict(image_bytes)

    report = {
        "farmer_id":                 str(current_user["_id"]),
        "crop_type":                 crop_type,
        "disease_id":                result["disease_id"],
        "disease_name":              result["disease_name"],
        "confidence":                result["confidence"],
        "severity":                  result["severity"],
        "severity_score":            result.get("severity_score", 0),
        "urgency":                   result["urgency"],
        "spread_risk":               result.get("spread_risk", 0),
        "weather_triggers":          result.get("weather_triggers", []),
        "treatment_steps":           result["treatment_steps"],
        "preventive_measures":       result["preventive_measures"],
        "fertilizer_recommendation": result.get("fertilizer_recommendation", ""),
        "irrigation_advice":         result.get("irrigation_advice", ""),
        "organic_treatment":         result["organic_treatment"],
        "chemical_treatment":        result["chemical_treatment"],
        "xai_explanation":           result["xai_explanation"],
        "affected_area_percentage":  result["affected_area_percentage"],
        "timestamp":                 datetime.utcnow(),
    }
    inserted = await db.disease_reports.insert_one(report)
    report["id"] = str(inserted.inserted_id)

    return {**result, "report_id": report["id"]}


@router.get("/history")
async def disease_history(
    current_user=Depends(get_current_user),
    db=Depends(get_database),
):
    cursor = db.disease_reports.find(
        {"farmer_id": str(current_user["_id"])}
    ).sort("timestamp", -1).limit(30)
    history = []
    async for doc in cursor:
        doc["id"] = str(doc.pop("_id"))
        doc["timestamp"] = doc["timestamp"].isoformat()
        history.append(doc)
    return history


@router.get("/stats")
async def disease_stats(
    current_user=Depends(get_current_user),
    db=Depends(get_database),
):
    farmer_id = str(current_user["_id"])
    total = await db.disease_reports.count_documents({"farmer_id": farmer_id})
    critical = await db.disease_reports.count_documents({"farmer_id": farmer_id, "severity": {"$in": ["high", "critical"]}})
    healthy = await db.disease_reports.count_documents({"farmer_id": farmer_id, "disease_id": "healthy"})
    model_info = get_disease_stats()
    return {
        "total_scans": total,
        "critical_cases": critical,
        "healthy_scans": healthy,
        "diseases_detected": total - healthy,
        **model_info,
    }


@router.get("/treatment/{disease_id}")
async def get_treatment(disease_id: str):
    disease = get_disease_by_id(disease_id)
    if not disease:
        raise HTTPException(status_code=404, detail="Disease not found")
    return disease
