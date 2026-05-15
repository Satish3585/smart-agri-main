from fastapi import APIRouter, Depends, Query
from typing import Optional

from ..dependencies import get_current_user
from ...services.weather_service import (
    get_current_weather, get_forecast,
    generate_irrigation_advice, get_farming_alerts
)

router = APIRouter(prefix="/weather", tags=["Weather Intelligence"])


@router.get("/current")
async def current_weather(
    lat: float = Query(12.9716, description="Latitude"),
    lon: float = Query(77.5946, description="Longitude"),
):
    return await get_current_weather(lat, lon)


@router.get("/forecast")
async def weather_forecast(
    lat: float = Query(12.9716),
    lon: float = Query(77.5946),
    days: int = Query(5, ge=1, le=7),
):
    return await get_forecast(lat, lon, days)


@router.get("/irrigation-advice")
async def irrigation_advice(
    lat: float = Query(12.9716),
    lon: float = Query(77.5946),
    crop_type: str = Query("tomato"),
    soil_moisture: float = Query(50.0, ge=0, le=100),
    last_irrigation_days: int = Query(2, ge=0),
):
    weather = await get_current_weather(lat, lon)
    advice = generate_irrigation_advice(
        weather=weather,
        crop_type=crop_type,
        soil_moisture_pct=soil_moisture,
        last_irrigation_days=last_irrigation_days,
    )
    return {
        "current_weather": weather,
        "irrigation_advice": advice,
    }


@router.get("/farming-alerts")
async def farming_alerts(
    lat: float = Query(12.9716),
    lon: float = Query(77.5946),
    crop_type: str = Query("tomato"),
):
    weather = await get_current_weather(lat, lon)
    alerts = get_farming_alerts(weather, crop_type)
    return {
        "weather": weather,
        "alerts": alerts,
        "alert_count": len(alerts),
    }
