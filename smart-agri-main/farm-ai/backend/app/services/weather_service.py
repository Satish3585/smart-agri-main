"""
Weather Intelligence + Smart Irrigation Alert Service
"""

import httpx
import logging
from datetime import datetime
from typing import List, Dict, Optional
from ..core.config import settings

logger = logging.getLogger(__name__)

OPENWEATHER_BASE = "https://api.openweathermap.org/data/2.5"

WATER_INTENSIVE_CROPS = {"rice", "sugarcane", "banana", "potato", "tomato", "watermelon"}
DROUGHT_TOLERANT_CROPS = {"groundnut", "sunflower", "soybean", "chili", "onion", "cotton"}

# mm rainfall per crop per day (approximate)
CROP_WATER_NEEDS = {
    "rice": 8, "wheat": 4, "tomato": 5, "chili": 3, "onion": 3.5,
    "potato": 5, "cotton": 4, "maize": 4.5, "soybean": 3.5, "groundnut": 3,
    "banana": 7, "sugarcane": 7, "turmeric": 6, "ginger": 6,
    "pomegranate": 2.5, "sunflower": 3.5, "mango": 3, "watermelon": 5,
    "brinjal": 4, "cabbage": 4,
}


async def get_current_weather(lat: float, lon: float) -> Dict:
    if not settings.OPENWEATHER_API_KEY:
        return _mock_weather(lat, lon)

    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(
            f"{OPENWEATHER_BASE}/weather",
            params={"lat": lat, "lon": lon, "appid": settings.OPENWEATHER_API_KEY, "units": "metric"}
        )
        resp.raise_for_status()
        data = resp.json()

    return {
        "city": data.get("name", "Unknown"),
        "temperature": data["main"]["temp"],
        "feels_like": data["main"]["feels_like"],
        "humidity": data["main"]["humidity"],
        "pressure": data["main"]["pressure"],
        "description": data["weather"][0]["description"].title(),
        "wind_speed": data["wind"]["speed"],
        "visibility": data.get("visibility", 10000) / 1000,
        "rainfall_1h": data.get("rain", {}).get("1h", 0.0),
        "icon": data["weather"][0]["icon"],
        "timestamp": datetime.utcnow(),
    }


async def get_forecast(lat: float, lon: float, days: int = 5) -> List[Dict]:
    if not settings.OPENWEATHER_API_KEY:
        return _mock_forecast(lat, lon, days)

    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(
            f"{OPENWEATHER_BASE}/forecast",
            params={"lat": lat, "lon": lon, "appid": settings.OPENWEATHER_API_KEY, "units": "metric", "cnt": days * 8}
        )
        resp.raise_for_status()
        data = resp.json()

    daily: Dict[str, Dict] = {}
    for item in data["list"]:
        date = item["dt_txt"][:10]
        if date not in daily:
            daily[date] = {
                "temps": [], "humidity": [], "rainfall": 0.0,
                "descriptions": [], "icons": []
            }
        daily[date]["temps"].append(item["main"]["temp"])
        daily[date]["humidity"].append(item["main"]["humidity"])
        daily[date]["rainfall"] += item.get("rain", {}).get("3h", 0.0)
        daily[date]["descriptions"].append(item["weather"][0]["description"])
        daily[date]["icons"].append(item["weather"][0]["icon"])

    forecast = []
    for date, d in list(daily.items())[:days]:
        rain_prob = min(d["rainfall"] / 15, 1.0)
        desc = max(set(d["descriptions"]), key=d["descriptions"].count).title()
        advice = _get_daily_farming_advice(
            d["rainfall"], sum(d["temps"]) / len(d["temps"]),
            sum(d["humidity"]) / len(d["humidity"])
        )
        forecast.append({
            "date": date,
            "temp_min": round(min(d["temps"]), 1),
            "temp_max": round(max(d["temps"]), 1),
            "humidity": round(sum(d["humidity"]) / len(d["humidity"]), 1),
            "description": desc,
            "rainfall_probability": round(rain_prob * 100, 1),
            "rainfall_mm": round(d["rainfall"], 2),
            "icon": max(set(d["icons"]), key=d["icons"].count),
            "farming_advice": advice,
        })

    return forecast


def generate_irrigation_advice(
    weather: Dict,
    crop_type: str = "tomato",
    soil_moisture_pct: float = 50.0,
    last_irrigation_days: int = 2,
) -> Dict:
    """
    Smart Irrigation AI with Explainable AI reasons.
    """
    temp = weather.get("temperature", 25)
    humidity = weather.get("humidity", 60)
    rain_1h = weather.get("rainfall_1h", 0.0)
    description = weather.get("description", "").lower()

    forecast_rain_likely = any(word in description for word in ["rain", "drizzle", "shower", "storm"])
    heavy_rain_recent = rain_1h > 5.0

    water_need = CROP_WATER_NEEDS.get(crop_type, 4)  # mm/day
    is_water_intensive = crop_type in WATER_INTENSIVE_CROPS
    is_drought_tolerant = crop_type in DROUGHT_TOLERANT_CROPS

    xai_reasons = []
    irrigation_status = "required"
    title = ""
    message = ""
    water_amount = None
    next_irrigation = None
    water_saving_tip = None

    # Decision tree
    if heavy_rain_recent or rain_1h > 2.0:
        irrigation_status = "not_required"
        title = "Irrigation Not Required — Recent Rainfall Detected"
        message = f"Recent rainfall of {rain_1h}mm detected. Soil moisture is being replenished naturally."
        next_irrigation = "After 2–3 days, reassess soil moisture"
        xai_reasons = [
            f"Recent rainfall: {rain_1h}mm in last hour — sufficient for most crops",
            f"Over-irrigation risk: watering now may cause waterlogging",
            f"Soil moisture currently replenishing naturally",
            f"Next check recommended in 2–3 days based on drainage rate"
        ]
        water_saving_tip = "You save approximately 2,000–4,000 litres/acre by skipping today's irrigation."

    elif forecast_rain_likely and humidity > 70:
        irrigation_status = "not_required"
        title = "Hold Irrigation — Rain Expected"
        message = "Weather forecast shows rain probability is high. Delay irrigation to save water."
        next_irrigation = "Irrigate only if no rain within next 24 hours"
        xai_reasons = [
            f"Weather description: '{weather.get('description')}' indicates upcoming rain",
            f"High humidity ({humidity}%) suggests atmospheric moisture is high",
            f"Unnecessary irrigation wastes water and may cause root rot",
            f"Recommended: monitor rainfall and irrigate only if dry spell exceeds 48 hours"
        ]
        water_saving_tip = "Delaying irrigation 24 hours could save 1,500–3,000 litres/acre."

    elif soil_moisture_pct > 70:
        irrigation_status = "not_required"
        title = "Soil Moisture Adequate — No Irrigation Needed"
        message = f"Current soil moisture ({soil_moisture_pct}%) is above optimal threshold. Plants are well hydrated."
        next_irrigation = f"Irrigate after {3 if is_drought_tolerant else 2} days"
        xai_reasons = [
            f"Soil moisture at {soil_moisture_pct}% — above 70% threshold for {crop_type}",
            f"Watering now risks over-irrigation and nutrient leaching",
            f"Drought tolerance of {crop_type}: {'high' if is_drought_tolerant else 'low'}"
        ]

    elif soil_moisture_pct < 35 and not forecast_rain_likely:
        irrigation_status = "required"
        water_amount = water_need * 400  # litres/acre approximation
        title = "Irrigation Required Urgently"
        message = f"Soil moisture critically low ({soil_moisture_pct}%). Immediate irrigation recommended for {crop_type}."
        next_irrigation = "Irrigate within next 4–6 hours"
        xai_reasons = [
            f"Soil moisture critically low at {soil_moisture_pct}% (threshold: 35%)",
            f"No rainfall expected — crop stress will increase",
            f"{crop_type.title()} is {'water-intensive' if is_water_intensive else 'moderately water-sensitive'}",
            f"Temperature at {temp}°C increases evapotranspiration demand",
            f"Recommended water: {water_amount:,} litres/acre"
        ]
        water_saving_tip = "Use drip irrigation to reduce water usage by 40% vs flood irrigation."

    elif temp > 35 and is_water_intensive:
        irrigation_status = "required"
        water_amount = water_need * 500
        title = "Heat Stress Alert — Increase Irrigation"
        message = f"Temperature {temp}°C is high. {crop_type.title()} needs extra water to prevent heat stress."
        next_irrigation = "Irrigate in early morning (6–8 AM) or evening (5–7 PM)"
        xai_reasons = [
            f"Temperature {temp}°C exceeds comfort threshold for {crop_type}",
            f"{crop_type.title()} is water-intensive — heat stress risk is high",
            f"Evapotranspiration rate increases 15–25% above 35°C",
            f"Irrigation timing: morning/evening reduces evaporation loss by 30%",
        ]
        water_saving_tip = "Mulching around plants can reduce water loss by 20–30%."

    elif soil_moisture_pct < 50:
        irrigation_status = "caution"
        water_amount = water_need * 300
        title = "Moderate Irrigation Recommended"
        message = f"Soil moisture at {soil_moisture_pct}%. Light irrigation is recommended."
        next_irrigation = "Irrigate lightly today, reassess tomorrow"
        xai_reasons = [
            f"Soil moisture at {soil_moisture_pct}% — approaching lower threshold",
            f"Moderate conditions — preventive irrigation beneficial",
            f"Last irrigated {last_irrigation_days} days ago",
        ]

    else:
        irrigation_status = "not_required"
        title = "Irrigation Not Required Today"
        message = "Current conditions do not require irrigation. Soil moisture and weather are balanced."
        next_irrigation = "Re-evaluate tomorrow"
        xai_reasons = [
            f"Soil moisture {soil_moisture_pct}% is within optimal range",
            f"Temperature {temp}°C is normal — evapotranspiration is moderate",
            f"Humidity at {humidity}% reduces water demand",
        ]

    crop_specific = _get_crop_irrigation_advice(crop_type, temp, humidity)

    return {
        "status": irrigation_status,
        "title": title,
        "message": message,
        "next_irrigation": next_irrigation,
        "water_amount_liters_per_acre": water_amount,
        "xai_reasons": xai_reasons,
        "crop_specific_advice": crop_specific,
        "water_saving_tip": water_saving_tip,
    }


def _get_crop_irrigation_advice(crop_type: str, temp: float, humidity: float) -> str:
    advice_map = {
        "rice": "Rice requires standing water (5–10 cm) during vegetative stage. Drain fields 2 weeks before harvest.",
        "wheat": "Irrigate at crown root initiation, tillering, and grain filling stages. Total 4–5 irrigations.",
        "tomato": "Use drip irrigation. Critical stages: flowering and fruit development. Avoid wetting foliage.",
        "chili": "Water logging is fatal for chili. Use furrow irrigation at 7–10 day intervals.",
        "onion": "Critical irrigation stages: bulb formation and initial growth. Stop irrigation 15 days before harvest.",
        "potato": "Maintain uniform soil moisture. Critical: stolon formation and tuber bulking stages.",
        "cotton": "Deep irrigation at flowering. Avoid excessive water during boll opening.",
        "banana": "High water requirement. Ensure continuous soil moisture. Avoid waterlogging.",
        "sugarcane": "Critical: germination, tillering, and grand growth period. Total 8–10 irrigations.",
        "maize": "Critical stages: knee-high, tasseling, and silking. Deficit at silking reduces yield 20–50%.",
    }
    return advice_map.get(crop_type, f"Monitor soil moisture regularly and irrigate at {CROP_WATER_NEEDS.get(crop_type, 4)} mm/day rate.")


def get_farming_alerts(weather: Dict, crop_type: str) -> List[Dict]:
    alerts = []
    temp = weather.get("temperature", 25)
    wind = weather.get("wind_speed", 0)
    humidity = weather.get("humidity", 60)
    rain_1h = weather.get("rainfall_1h", 0)
    desc = weather.get("description", "").lower()

    if wind > 15:
        alerts.append({
            "alert_type": "wind",
            "severity": "warning",
            "title": f"Strong Winds Alert ({wind} m/s)",
            "message": "Avoid pesticide/fertilizer spraying — drift risk is high.",
            "action_required": "Postpone spraying operations until wind speed drops below 10 m/s"
        })
    if humidity > 85 and temp > 20:
        alerts.append({
            "alert_type": "disease_risk",
            "severity": "warning",
            "title": "High Disease Risk — Hot & Humid Conditions",
            "message": "Fungal disease risk is elevated. Apply preventive fungicide.",
            "action_required": "Scout crop for early disease signs; apply preventive copper spray"
        })
    if temp > 40:
        alerts.append({
            "alert_type": "heat_stress",
            "severity": "critical",
            "title": f"Extreme Heat Alert ({temp}°C)",
            "message": "Crop heat stress risk. Increase irrigation frequency.",
            "action_required": "Irrigate in early morning; apply kaolin clay spray as sunscreen"
        })
    if rain_1h > 20:
        alerts.append({
            "alert_type": "heavy_rain",
            "severity": "warning",
            "title": "Heavy Rainfall Detected",
            "message": "Avoid field operations. Ensure drainage channels are clear.",
            "action_required": "Check field drainage; apply fungicide 24 hours after rain stops"
        })
    if temp < 5 and crop_type not in ("wheat", "potato", "cabbage"):
        alerts.append({
            "alert_type": "frost",
            "severity": "warning",
            "title": "Frost Risk Alert",
            "message": f"Temperature {temp}°C is dangerously low for {crop_type}.",
            "action_required": "Apply protective covering; light irrigation can prevent frost damage"
        })

    return alerts


def _get_daily_farming_advice(rainfall_mm: float, avg_temp: float, avg_humidity: float) -> str:
    if rainfall_mm > 15:
        return "Heavy rain expected. Avoid spraying. Ensure field drainage."
    elif rainfall_mm > 5:
        return "Moderate rain. Delay fertilizer application to prevent runoff."
    elif avg_temp > 38:
        return "Extreme heat. Irrigate early morning. Watch for heat stress."
    elif avg_humidity > 80:
        return "High humidity — fungal disease risk. Apply preventive fungicide."
    elif avg_temp < 10:
        return "Cold weather. Protect frost-sensitive crops with covers."
    else:
        return "Good conditions for field operations and crop management."


def _mock_weather(lat: float, lon: float) -> Dict:
    return {
        "city": "Bengaluru",
        "temperature": 28.5,
        "feels_like": 30.2,
        "humidity": 72,
        "pressure": 1013,
        "description": "Partly Cloudy",
        "wind_speed": 3.2,
        "visibility": 8.5,
        "rainfall_1h": 0.0,
        "icon": "02d",
        "timestamp": datetime.utcnow(),
    }


def _mock_forecast(lat: float, lon: float, days: int) -> List[Dict]:
    templates = [
        ("Sunny", 0.05, 0.0, "02d"),
        ("Partly Cloudy", 0.15, 1.2, "03d"),
        ("Light Rain", 0.55, 5.8, "10d"),
        ("Cloudy", 0.25, 0.5, "04d"),
        ("Thunderstorm", 0.75, 18.0, "11d"),
    ]
    from datetime import timedelta
    today = datetime.utcnow()
    forecast = []
    for i in range(days):
        t = templates[i % len(templates)]
        date = (today + timedelta(days=i)).strftime("%Y-%m-%d")
        avg_temp = 26 + (i % 3) * 2
        advice = _get_daily_farming_advice(t[2], avg_temp, 70)
        forecast.append({
            "date": date,
            "temp_min": round(avg_temp - 4, 1),
            "temp_max": round(avg_temp + 4, 1),
            "humidity": 65 + i * 2,
            "description": t[0],
            "rainfall_probability": round(t[1] * 100, 1),
            "rainfall_mm": t[2],
            "icon": t[3],
            "farming_advice": advice,
        })
    return forecast
