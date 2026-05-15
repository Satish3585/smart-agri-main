from fastapi import APIRouter, Depends
from typing import Optional

from ...core.database import get_database
from ..dependencies import get_current_user
from ...services.market_service import (
    get_saturation_dashboard, get_market_alerts,
    get_market_trends, get_price_prediction
)

router = APIRouter(prefix="/market", tags=["Market Intelligence"])


@router.get("/saturation-dashboard")
async def saturation_dashboard(
    region: str = "Karnataka",
    season: str = "kharif",
    db=Depends(get_database),
):
    return await get_saturation_dashboard(region, season, db)


@router.get("/trends/{crop_id}")
async def market_trends(crop_id: str, db=Depends(get_database)):
    return await get_market_trends(crop_id, db)


@router.get("/price-prediction/{crop_id}")
async def price_prediction(crop_id: str, months: int = 6):
    return get_price_prediction(crop_id, months)


@router.get("/alerts")
async def market_alerts(
    region: str = "Karnataka",
    season: str = "kharif",
    db=Depends(get_database),
):
    return await get_market_alerts(region, season, db)


@router.get("/overview")
async def market_overview(
    region: str = "Karnataka",
    season: str = "kharif",
    db=Depends(get_database),
    _=Depends(get_current_user),
):
    dashboard = await get_saturation_dashboard(region, season, db)
    alerts = await get_market_alerts(region, season, db)
    return {
        "region": region,
        "season": season,
        "total_crops_tracked": len(dashboard),
        "critical_crops": [d for d in dashboard if d["saturation_level"] == "critical"],
        "low_opportunity_crops": [d for d in dashboard if d["saturation_level"] == "low"],
        "active_alerts": len(alerts),
        "alerts": alerts[:5],
        "dashboard": dashboard,
    }
