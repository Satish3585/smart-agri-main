"""
Crop Recommendation — Real RandomForestClassifier from Harvestify + rule-based ensemble.
Primary model: crop_recommendation_model.pkl (22 crops, trained on PlantVillage dataset).
Fallback: rule-based agronomic scoring on expanded 35-crop knowledge base.
Features: N, P, K, temperature, humidity, ph, rainfall (pandas DataFrame, exact column names).
"""

from __future__ import annotations

import os
import logging
import warnings
import numpy as np
from typing import Optional, List, Dict, Tuple

logger = logging.getLogger(__name__)

# ── Real model auto-detection ────────────────────────────────────────────────
_BASE_DIR    = os.path.dirname(os.path.abspath(__file__))          # .../ml_models
_BACKEND_DIR = os.path.dirname(os.path.dirname(_BASE_DIR))           # .../backend
_FARM_AI_DIR = os.path.dirname(_BACKEND_DIR)                         # .../farm-ai
_PROJECT_ROOT = os.path.dirname(_FARM_AI_DIR)                        # .../bengalur

_HARVESTIFY_MODEL_CANDIDATES = [
    os.path.join(_PROJECT_ROOT, "Harvestify-master", "models", "crop_recommendation_model.pkl"),
    os.path.join(_PROJECT_ROOT, "Harvestify-master", "app", "models", "crop_recommendation_model.pkl"),
    os.path.join(_BASE_DIR, "crop_recommendation_model.pkl"),
]

# HF model feature order (exact column names from training)
_HF_FEATURE_COLS = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]

# ── Crop Knowledge Base ──────────────────────────────────────────────────────
CROP_DB: List[Dict] = [
    # ── Crops also in Harvestify RF model ────────────────────────────────────
    {"id": "rice",        "name": "Rice",        "N": (80, 120),  "P": (40, 60),  "K": (40, 60),   "pH": (5.5, 7.0), "temp": (22, 32), "rainfall": (150, 300), "humidity": (80, 95), "profit": 28000, "demand": 0.90, "season": ["kharif"], "water_intensive": True,  "image_url": "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400"},
    {"id": "maize",       "name": "Maize",       "N": (90, 130),  "P": (40, 65),  "K": (30, 50),   "pH": (5.5, 7.5), "temp": (18, 35), "rainfall": (60, 110),  "humidity": (55, 75), "profit": 35000, "demand": 0.80, "season": ["kharif", "rabi"], "water_intensive": False, "image_url": "https://images.unsplash.com/photo-1600335895229-6e75511892c8?w=400"},
    {"id": "banana",      "name": "Banana",      "N": (100, 150), "P": (30, 50),  "K": (150, 200), "pH": (5.5, 7.0), "temp": (20, 35), "rainfall": (100, 200), "humidity": (70, 90), "profit": 80000, "demand": 0.88, "season": ["kharif", "rabi", "zaid"], "water_intensive": True, "image_url": "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400"},
    {"id": "mango",       "name": "Mango",       "N": (60, 90),   "P": (30, 50),  "K": (80, 120),  "pH": (5.5, 7.5), "temp": (24, 38), "rainfall": (75, 125),  "humidity": (50, 70), "profit": 85000, "demand": 0.86, "season": ["zaid"],   "water_intensive": False, "image_url": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=400"},
    {"id": "watermelon",  "name": "Watermelon",  "N": (50, 90),   "P": (30, 60),  "K": (60, 100),  "pH": (6.0, 7.0), "temp": (25, 38), "rainfall": (40, 70),   "humidity": (50, 65), "profit": 50000, "demand": 0.79, "season": ["zaid"],   "water_intensive": True,  "image_url": "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400"},
    {"id": "cotton",      "name": "Cotton",      "N": (80, 120),  "P": (40, 60),  "K": (40, 60),   "pH": (6.0, 8.0), "temp": (21, 37), "rainfall": (50, 100),  "humidity": (50, 70), "profit": 42000, "demand": 0.75, "season": ["kharif"], "water_intensive": True,  "image_url": "https://images.unsplash.com/photo-1594401610867-2b4bf28e3eda?w=400"},
    {"id": "pomegranate", "name": "Pomegranate", "N": (50, 80),   "P": (30, 50),  "K": (60, 90),   "pH": (6.5, 7.5), "temp": (25, 38), "rainfall": (50, 80),   "humidity": (40, 60), "profit": 120000, "demand": 0.74, "season": ["kharif", "rabi"], "water_intensive": False, "image_url": "https://images.unsplash.com/photo-1541344999736-83eca272f6fc?w=400"},
    {"id": "grapes",      "name": "Grapes",      "N": (60, 100),  "P": (40, 70),  "K": (70, 100),  "pH": (6.0, 7.5), "temp": (15, 35), "rainfall": (50, 100),  "humidity": (50, 70), "profit": 95000, "demand": 0.77, "season": ["rabi", "zaid"], "water_intensive": True, "image_url": "https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=400"},
    {"id": "apple",       "name": "Apple",       "N": (80, 100),  "P": (40, 60),  "K": (40, 60),   "pH": (5.5, 7.0), "temp": (10, 22), "rainfall": (100, 200), "humidity": (60, 80), "profit": 100000, "demand": 0.85, "season": ["rabi"], "water_intensive": False, "image_url": "https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=400"},
    {"id": "orange",      "name": "Orange",      "N": (60, 100),  "P": (30, 50),  "K": (60, 100),  "pH": (6.0, 7.5), "temp": (20, 30), "rainfall": (80, 150),  "humidity": (60, 80), "profit": 75000, "demand": 0.82, "season": ["rabi", "zaid"], "water_intensive": False, "image_url": "https://images.unsplash.com/photo-1582979512210-99b6a53386f9?w=400"},
    {"id": "papaya",      "name": "Papaya",      "N": (100, 150), "P": (40, 60),  "K": (80, 120),  "pH": (6.0, 7.5), "temp": (22, 35), "rainfall": (100, 175), "humidity": (60, 80), "profit": 60000, "demand": 0.78, "season": ["kharif", "zaid"], "water_intensive": True, "image_url": "https://images.unsplash.com/photo-1517282009859-f000ec3b26fe?w=400"},
    {"id": "coconut",     "name": "Coconut",     "N": (80, 120),  "P": (40, 60),  "K": (80, 120),  "pH": (5.5, 7.5), "temp": (27, 35), "rainfall": (150, 250), "humidity": (70, 90), "profit": 70000, "demand": 0.80, "season": ["kharif", "rabi", "zaid"], "water_intensive": True, "image_url": "https://images.unsplash.com/photo-1580984969071-a8da5656c2fb?w=400"},
    {"id": "coffee",      "name": "Coffee",      "N": (80, 120),  "P": (30, 50),  "K": (80, 120),  "pH": (6.0, 7.0), "temp": (15, 25), "rainfall": (150, 250), "humidity": (65, 85), "profit": 110000, "demand": 0.72, "season": ["kharif"], "water_intensive": True, "image_url": "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=400"},
    {"id": "chickpea",    "name": "Chickpea",    "N": (20, 40),   "P": (40, 70),  "K": (20, 40),   "pH": (6.0, 8.0), "temp": (15, 25), "rainfall": (40, 100),  "humidity": (50, 70), "profit": 42000, "demand": 0.83, "season": ["rabi"],   "water_intensive": False, "image_url": "https://images.unsplash.com/photo-1583864697784-a0efc8379f70?w=400"},
    {"id": "lentil",      "name": "Lentil",      "N": (20, 40),   "P": (30, 50),  "K": (20, 40),   "pH": (6.0, 8.0), "temp": (12, 25), "rainfall": (25, 60),   "humidity": (40, 60), "profit": 38000, "demand": 0.79, "season": ["rabi"],   "water_intensive": False, "image_url": "https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=400"},
    {"id": "blackgram",   "name": "Black Gram",  "N": (20, 40),   "P": (40, 60),  "K": (20, 40),   "pH": (6.0, 7.5), "temp": (25, 35), "rainfall": (60, 100),  "humidity": (60, 80), "profit": 45000, "demand": 0.76, "season": ["kharif", "rabi"], "water_intensive": False, "image_url": "https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=400"},
    {"id": "mungbean",    "name": "Mung Bean",   "N": (20, 40),   "P": (30, 50),  "K": (20, 40),   "pH": (6.0, 7.5), "temp": (25, 35), "rainfall": (60, 100),  "humidity": (60, 80), "profit": 40000, "demand": 0.77, "season": ["kharif", "zaid"], "water_intensive": False, "image_url": "https://images.unsplash.com/photo-1552841100-5e0d7d43c5e2?w=400"},
    {"id": "kidneybeans", "name": "Kidney Beans","N": (20, 40),   "P": (50, 70),  "K": (20, 40),   "pH": (6.0, 7.5), "temp": (15, 25), "rainfall": (60, 120),  "humidity": (50, 70), "profit": 48000, "demand": 0.75, "season": ["kharif", "rabi"], "water_intensive": False, "image_url": "https://images.unsplash.com/photo-1590779033100-9f60a05a013d?w=400"},
    {"id": "pigeonpeas",  "name": "Pigeon Peas", "N": (20, 40),   "P": (40, 70),  "K": (20, 40),   "pH": (5.5, 7.5), "temp": (18, 29), "rainfall": (60, 150),  "humidity": (50, 70), "profit": 35000, "demand": 0.74, "season": ["kharif"],  "water_intensive": False, "image_url": "https://images.unsplash.com/photo-1547592180-85f173990554?w=400"},
    {"id": "mothbeans",   "name": "Moth Beans",  "N": (15, 30),   "P": (30, 50),  "K": (20, 40),   "pH": (6.0, 8.0), "temp": (28, 38), "rainfall": (25, 60),   "humidity": (40, 60), "profit": 30000, "demand": 0.65, "season": ["kharif"],  "water_intensive": False, "image_url": "https://images.unsplash.com/photo-1608198093002-ad4e005484ec?w=400"},
    {"id": "muskmelon",   "name": "Muskmelon",   "N": (50, 90),   "P": (30, 60),  "K": (60, 100),  "pH": (6.0, 7.5), "temp": (28, 38), "rainfall": (40, 80),   "humidity": (50, 70), "profit": 45000, "demand": 0.73, "season": ["zaid"],    "water_intensive": True,  "image_url": "https://images.unsplash.com/photo-1571575309630-c91a1e9f23af?w=400"},
    {"id": "jute",        "name": "Jute",        "N": (60, 100),  "P": (30, 50),  "K": (30, 50),   "pH": (6.0, 7.5), "temp": (25, 35), "rainfall": (150, 250), "humidity": (70, 90), "profit": 22000, "demand": 0.60, "season": ["kharif"],  "water_intensive": True,  "image_url": "https://images.unsplash.com/photo-1599940778173-e276d4acb2bb?w=400"},
    # ── Farm AI–specific crops (rule-based only) ──────────────────────────────
    {"id": "wheat",       "name": "Wheat",       "N": (100, 140), "P": (50, 70),  "K": (30, 50),   "pH": (6.0, 7.5), "temp": (12, 25), "rainfall": (60, 120),  "humidity": (50, 70), "profit": 32000, "demand": 0.88, "season": ["rabi"],   "water_intensive": False, "image_url": "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400"},
    {"id": "tomato",      "name": "Tomato",      "N": (120, 160), "P": (60, 80),  "K": (80, 120),  "pH": (6.0, 7.0), "temp": (18, 30), "rainfall": (60, 120),  "humidity": (60, 75), "profit": 65000, "demand": 0.82, "season": ["kharif", "rabi"], "water_intensive": True,  "image_url": "https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=400"},
    {"id": "chili",       "name": "Chili",       "N": (80, 120),  "P": (50, 70),  "K": (70, 100),  "pH": (6.0, 7.5), "temp": (20, 32), "rainfall": (60, 100),  "humidity": (60, 75), "profit": 72000, "demand": 0.78, "season": ["kharif", "rabi"], "water_intensive": False, "image_url": "https://images.unsplash.com/photo-1583119022894-919a68a3d0e3?w=400"},
    {"id": "onion",       "name": "Onion",       "N": (60, 100),  "P": (30, 60),  "K": (60, 90),   "pH": (6.0, 7.5), "temp": (13, 28), "rainfall": (50, 80),   "humidity": (50, 65), "profit": 55000, "demand": 0.85, "season": ["rabi", "zaid"],  "water_intensive": False, "image_url": "https://images.unsplash.com/photo-1518977956812-cd3dbadaaf31?w=400"},
    {"id": "potato",      "name": "Potato",      "N": (100, 140), "P": (60, 80),  "K": (90, 120),  "pH": (5.0, 6.5), "temp": (10, 25), "rainfall": (50, 100),  "humidity": (65, 80), "profit": 48000, "demand": 0.87, "season": ["rabi"],   "water_intensive": True,  "image_url": "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400"},
    {"id": "soybean",     "name": "Soybean",     "N": (20, 40),   "P": (50, 80),  "K": (20, 40),   "pH": (6.0, 7.5), "temp": (20, 30), "rainfall": (60, 100),  "humidity": (55, 75), "profit": 38000, "demand": 0.77, "season": ["kharif"], "water_intensive": False, "image_url": "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400"},
    {"id": "groundnut",   "name": "Groundnut",   "N": (15, 25),   "P": (30, 60),  "K": (50, 80),   "pH": (6.0, 7.5), "temp": (25, 35), "rainfall": (50, 100),  "humidity": (50, 65), "profit": 45000, "demand": 0.76, "season": ["kharif"], "water_intensive": False, "image_url": "https://images.unsplash.com/photo-1567892320421-6bda2e29a1e5?w=400"},
    {"id": "sugarcane",   "name": "Sugarcane",   "N": (100, 150), "P": (50, 70),  "K": (80, 120),  "pH": (6.0, 8.0), "temp": (20, 35), "rainfall": (100, 175), "humidity": (65, 80), "profit": 55000, "demand": 0.83, "season": ["kharif"], "water_intensive": True,  "image_url": "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=400"},
    {"id": "turmeric",    "name": "Turmeric",    "N": (60, 100),  "P": (40, 70),  "K": (60, 100),  "pH": (5.5, 7.0), "temp": (20, 30), "rainfall": (150, 250), "humidity": (65, 80), "profit": 90000, "demand": 0.72, "season": ["kharif"], "water_intensive": True,  "image_url": "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400"},
    {"id": "ginger",      "name": "Ginger",      "N": (60, 100),  "P": (40, 70),  "K": (60, 100),  "pH": (5.5, 6.5), "temp": (19, 28), "rainfall": (150, 250), "humidity": (70, 90), "profit": 95000, "demand": 0.70, "season": ["kharif"], "water_intensive": True,  "image_url": "https://images.unsplash.com/photo-1598257006458-087169a1f08d?w=400"},
    {"id": "sunflower",   "name": "Sunflower",   "N": (60, 90),   "P": (30, 60),  "K": (30, 60),   "pH": (6.0, 7.5), "temp": (18, 35), "rainfall": (40, 80),   "humidity": (50, 70), "profit": 36000, "demand": 0.73, "season": ["kharif", "rabi"], "water_intensive": False, "image_url": "https://images.unsplash.com/photo-1490750967868-88df5691cc54?w=400"},
    {"id": "brinjal",     "name": "Brinjal",     "N": (80, 120),  "P": (40, 70),  "K": (70, 100),  "pH": (5.5, 7.0), "temp": (20, 32), "rainfall": (60, 100),  "humidity": (55, 75), "profit": 42000, "demand": 0.78, "season": ["kharif", "rabi"], "water_intensive": False, "image_url": "https://images.unsplash.com/photo-1527324688151-0e627063f2b1?w=400"},
    {"id": "cabbage",     "name": "Cabbage",     "N": (100, 140), "P": (50, 70),  "K": (70, 100),  "pH": (6.0, 7.5), "temp": (10, 22), "rainfall": (40, 80),   "humidity": (60, 80), "profit": 38000, "demand": 0.76, "season": ["rabi"],   "water_intensive": False, "image_url": "https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400"},
]

# Map Farm AI crop_id → Harvestify class name (only for crops in both systems)
_CROP_ID_TO_HF_CLASS: Dict[str, str] = {
    "rice":        "rice",
    "maize":       "maize",
    "banana":      "banana",
    "mango":       "mango",
    "watermelon":  "watermelon",
    "cotton":      "cotton",
    "pomegranate": "pomegranate",
    "grapes":      "grapes",
    "apple":       "apple",
    "orange":      "orange",
    "papaya":      "papaya",
    "coconut":     "coconut",
    "coffee":      "coffee",
    "chickpea":    "chickpea",
    "lentil":      "lentil",
    "blackgram":   "blackgram",
    "mungbean":    "mungbean",
    "kidneybeans": "kidneybeans",
    "pigeonpeas":  "pigeonpeas",
    "mothbeans":   "mothbeans",
    "muskmelon":   "muskmelon",
    "jute":        "jute",
}

FEATURE_NAMES = ["N", "P", "K", "pH", "temperature", "rainfall", "humidity"]


# ── Load real model ──────────────────────────────────────────────────────────

def _load_harvestify_model():
    try:
        import joblib
        for path in _HARVESTIFY_MODEL_CANDIDATES:
            if os.path.isfile(path):
                with warnings.catch_warnings():
                    warnings.simplefilter("ignore")
                    model = joblib.load(path)
                logger.info(f"Loaded Harvestify crop RF model from {path} ({len(model.classes_)} classes)")
                return model, path
        logger.info("Harvestify crop model not found — using rule-based scoring")
    except Exception as e:
        logger.warning(f"Could not load Harvestify crop model: {e}")
    return None, None


_hf_model, _hf_model_path = _load_harvestify_model()
_HF_AVAILABLE = _hf_model is not None


def _hf_predict_proba(N: float, P: float, K: float, pH: float,
                       temp: float, rainfall: float, humidity: float) -> Dict[str, float]:
    """Call the Harvestify RF model; returns {class_name: probability}."""
    try:
        import pandas as pd
        df = pd.DataFrame([[N, P, K, temp, humidity, pH, rainfall]], columns=_HF_FEATURE_COLS)
        proba = _hf_model.predict_proba(df)[0]
        return {_hf_model.classes_[i]: float(proba[i]) for i in range(len(_hf_model.classes_))}
    except Exception as e:
        logger.warning(f"HF model inference failed: {e}")
        return {}


# ── Fallback synthetic RF (trained on CROP_DB ranges) ───────────────────────

def _train_fallback_model():
    try:
        from sklearn.ensemble import RandomForestClassifier
        from sklearn.preprocessing import LabelEncoder

        rng = np.random.RandomState(42)
        X_list, y_list = [], []
        for crop in CROP_DB:
            lo_hi = [(crop["N"][0], crop["N"][1]), (crop["P"][0], crop["P"][1]),
                     (crop["K"][0], crop["K"][1]), (crop["pH"][0], crop["pH"][1]),
                     (crop["temp"][0], crop["temp"][1]), (crop["rainfall"][0], crop["rainfall"][1]),
                     (crop["humidity"][0], crop["humidity"][1])]
            for _ in range(80):
                X_list.append([rng.uniform(*r) for r in lo_hi])
                y_list.append(crop["id"])

        X = np.array(X_list, dtype=np.float32)
        le = LabelEncoder()
        y_enc = le.fit_transform(y_list)
        rf = RandomForestClassifier(n_estimators=100, max_depth=18, random_state=42, n_jobs=-1)
        rf.fit(X, y_enc)
        logger.info(f"Fallback crop RF trained — {len(le.classes_)} classes")
        return rf, le
    except Exception as e:
        logger.warning(f"Fallback RF training failed: {e}")
        return None, None


_fallback_rf, _fallback_le = _train_fallback_model()


# ── Scoring helpers ──────────────────────────────────────────────────────────

def _range_score(value: float, optimal_range: Tuple[float, float]) -> float:
    lo, hi = optimal_range
    if lo <= value <= hi:
        return 1.0
    mid = (lo + hi) / 2
    span = max((hi - lo) / 2, 1.0)
    return max(0.0, 1.0 - abs(value - mid) / (span * 2))


def _rule_based_score(crop: Dict, N: float, P: float, K: float,
                       pH: float, temp: float, rainfall: float, humidity: float) -> float:
    return (
        _range_score(N, crop["N"])               * 0.18 +
        _range_score(P, crop["P"])               * 0.12 +
        _range_score(K, crop["K"])               * 0.12 +
        _range_score(pH, crop["pH"])             * 0.15 +
        _range_score(temp, crop["temp"])         * 0.20 +
        _range_score(rainfall, crop["rainfall"]) * 0.13 +
        _range_score(humidity, crop["humidity"]) * 0.10
    )


# ── Public API ───────────────────────────────────────────────────────────────

def get_top_crops(
    N: float, P: float, K: float, pH: float,
    temp: float = 25.0, rainfall: float = 80.0,
    humidity: float = 65.0, season: str = "kharif",
    top_n: int = 5,
) -> List[Dict]:
    season_crops = [c for c in CROP_DB if season in c.get("season", [])]
    if not season_crops:
        season_crops = CROP_DB

    # Get Harvestify RF probabilities (real model, 22 classes)
    hf_proba: Dict[str, float] = {}
    if _HF_AVAILABLE:
        hf_proba = _hf_predict_proba(N, P, K, pH, temp, rainfall, humidity)

    # Get fallback RF probabilities for Farm AI–specific crops
    fallback_proba: Dict[str, float] = {}
    if _fallback_rf is not None:
        try:
            feat = np.array([[N, P, K, pH, temp, rainfall, humidity]], dtype=np.float32)
            fp = _fallback_rf.predict_proba(feat)[0]
            fallback_proba = {_fallback_le.classes_[i]: float(fp[i]) for i in range(len(_fallback_le.classes_))}
        except Exception:
            pass

    results = []
    for crop in season_crops:
        rule_score  = _rule_based_score(crop, N, P, K, pH, temp, rainfall, humidity)
        hf_class    = _CROP_ID_TO_HF_CLASS.get(crop["id"])
        rf_prob     = hf_proba.get(hf_class, 0.0) if hf_class else 0.0

        if _HF_AVAILABLE and hf_class and rf_prob > 0:
            # Real model available for this crop: strong ensemble
            final_score = rf_prob * 0.65 + rule_score * 0.35
        elif fallback_proba:
            # Synthetic RF for Farm AI–specific crops
            fb_prob = fallback_proba.get(crop["id"], 0.0)
            final_score = fb_prob * 0.50 + rule_score * 0.50
        else:
            final_score = rule_score

        results.append({
            **crop,
            "soil_score":    round(final_score, 4),
            "rf_probability": round(rf_prob if hf_class else fallback_proba.get(crop["id"], rule_score), 4),
            "model_source":  "harvestify_rf" if (hf_class and rf_prob > 0) else "fallback_rf",
        })

    results.sort(key=lambda x: x["soil_score"], reverse=True)
    return results[:top_n]


def get_feature_importance() -> Dict[str, float]:
    if _HF_AVAILABLE and _hf_model is not None:
        imp = _hf_model.feature_importances_
        hf_cols = _HF_FEATURE_COLS  # ['N','P','K','temperature','humidity','ph','rainfall']
        fa_cols  = ["N", "P", "K", "temperature", "rainfall", "humidity", "pH"]
        return {fa_cols[i]: round(float(imp[i]), 4) for i in range(len(hf_cols))}
    if _fallback_rf is not None:
        imp = _fallback_rf.feature_importances_
        return {FEATURE_NAMES[i]: round(float(imp[i]), 4) for i in range(len(FEATURE_NAMES))}
    return {f: round(1 / len(FEATURE_NAMES), 4) for f in FEATURE_NAMES}


def get_crop_by_id(crop_id: str) -> Optional[Dict]:
    for crop in CROP_DB:
        if crop["id"] == crop_id:
            return crop
    return None
