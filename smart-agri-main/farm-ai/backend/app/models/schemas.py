from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class UserRole(str, Enum):
    farmer = "farmer"
    buyer = "buyer"
    admin = "admin"


class SaturationLevel(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class IrrigationStatus(str, Enum):
    required = "required"
    not_required = "not_required"
    caution = "caution"


# ── Auth ──────────────────────────────────────────────────────────────────────

class UserRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)
    role: UserRole = UserRole.farmer
    phone: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    land_size_acres: Optional[float] = None
    preferred_language: Optional[str] = "en"


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]


class UserOut(BaseModel):
    id: str
    name: str
    email: str
    role: str
    phone: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    land_size_acres: Optional[float] = None
    preferred_language: str = "en"
    created_at: datetime


# ── Crop Recommendation ───────────────────────────────────────────────────────

class SoilInput(BaseModel):
    nitrogen: float = Field(..., ge=0, le=200, description="N in kg/ha")
    phosphorus: float = Field(..., ge=0, le=200, description="P in kg/ha")
    potassium: float = Field(..., ge=0, le=200, description="K in kg/ha")
    ph: float = Field(..., ge=0, le=14)
    humidity: Optional[float] = Field(None, ge=0, le=100)
    temperature: Optional[float] = None
    rainfall: Optional[float] = None
    region: str
    season: Optional[str] = "kharif"
    crop_type_preference: Optional[str] = None


class CropRecommendation(BaseModel):
    crop_id: str
    crop_name: str
    confidence: float
    expected_profit_per_acre: float
    saturation_level: SaturationLevel
    saturation_index: float
    farmers_growing_nearby: int
    market_demand_score: float
    sustainability_score: float
    weather_compatibility: float
    xai_explanation: List[str]
    gemini_explanation: Optional[str] = None
    image_url: str
    rank: int


class RecommendationResponse(BaseModel):
    recommendations: List[CropRecommendation]
    warning: Optional[str] = None
    region_saturation_summary: Dict[str, Any]
    generated_at: datetime


class CultivationRegister(BaseModel):
    crop_id: str
    region: str
    season: str
    land_area_acres: float


# ── Market ────────────────────────────────────────────────────────────────────

class MarketTrendPoint(BaseModel):
    date: str
    price: float
    supply: float
    demand: float
    farmers_count: int


class SaturationDashboardItem(BaseModel):
    crop_id: str
    crop_name: str
    saturation_index: float
    saturation_level: SaturationLevel
    farmers_count: int
    market_demand_score: float
    price_trend: str
    alert: Optional[str] = None
    image_url: str


class MarketAlert(BaseModel):
    crop_id: str
    crop_name: str
    alert_type: str
    message: str
    severity: str
    region: str
    timestamp: datetime


# ── Weather & Irrigation ──────────────────────────────────────────────────────

class WeatherData(BaseModel):
    city: str
    temperature: float
    feels_like: float
    humidity: float
    pressure: float
    description: str
    wind_speed: float
    visibility: float
    rainfall_1h: Optional[float] = 0.0
    icon: str
    timestamp: datetime


class ForecastDay(BaseModel):
    date: str
    temp_min: float
    temp_max: float
    humidity: float
    description: str
    rainfall_probability: float
    rainfall_mm: float
    icon: str
    farming_advice: str


class IrrigationAdvice(BaseModel):
    status: IrrigationStatus
    title: str
    message: str
    next_irrigation: Optional[str] = None
    water_amount_liters_per_acre: Optional[float] = None
    xai_reasons: List[str]
    crop_specific_advice: Optional[str] = None
    water_saving_tip: Optional[str] = None


class FarmingAlert(BaseModel):
    alert_type: str
    severity: str
    title: str
    message: str
    action_required: str


# ── Disease Detection ─────────────────────────────────────────────────────────

class DiseaseResult(BaseModel):
    disease_id: str
    disease_name: str
    confidence: float
    severity: str
    affected_area_percentage: Optional[float] = None
    treatment_steps: List[str]
    preventive_measures: List[str]
    organic_treatment: Optional[str] = None
    chemical_treatment: Optional[str] = None
    urgency: str
    xai_explanation: List[str]


class DiseaseReportOut(BaseModel):
    id: str
    disease_name: str
    confidence: float
    severity: str
    image_url: Optional[str]
    timestamp: datetime
    treatment_steps: List[str]


# ── Commerce ──────────────────────────────────────────────────────────────────

class ListingCreate(BaseModel):
    crop_name: str
    quantity_kg: float
    price_per_kg: float
    description: Optional[str] = None
    location: str
    harvest_date: Optional[str] = None
    organic: bool = False
    images: Optional[List[str]] = []


class ListingOut(BaseModel):
    id: str
    seller_id: str
    seller_name: str
    crop_name: str
    quantity_kg: float
    price_per_kg: float
    description: Optional[str]
    location: str
    harvest_date: Optional[str]
    organic: bool
    images: List[str]
    status: str
    created_at: datetime


class OrderCreate(BaseModel):
    listing_id: str
    quantity_kg: float
    delivery_address: str
    notes: Optional[str] = None


class OrderOut(BaseModel):
    id: str
    listing_id: str
    crop_name: str
    buyer_id: str
    seller_id: str
    quantity_kg: float
    total_price: float
    status: str
    delivery_address: str
    created_at: datetime


# ── Admin ─────────────────────────────────────────────────────────────────────

class AdminDashboardStats(BaseModel):
    total_farmers: int
    total_buyers: int
    total_recommendations: int
    total_disease_reports: int
    active_listings: int
    completed_orders: int
    top_growing_crop: str
    highest_saturation_crop: str
    platform_health_score: float
