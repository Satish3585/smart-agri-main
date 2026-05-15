# 🌱 Farm AI — From Soil to Success with AI

> *"Our focus is not just Artificial Intelligence, but Explainable AI — technology farmers can trust and understand."*

## Overview

Farm AI is a complete production-quality AI-powered smart agriculture ecosystem. It uniquely solves the problem of **market saturation** — when too many farmers grow the same crop, prices crash. Our Adaptive Market Balancing AI tracks regional cultivation trends and dynamically redirects farmers toward low-competition, high-profit crops.

## Key Features

| Feature | Technology |
|---|---|
| **Adaptive Market Balancing AI** | Custom saturation algorithm + MongoDB analytics |
| **AI Crop Recommendation** | Random Forest scoring + soil/climate matching |
| **Explainable AI (XAI)** | Google Gemini API + rule-based explanations |
| **Disease Detection** | CNN / PIL image analysis + treatment KB |
| **Smart Irrigation Alerts** | Weather API + rule-based irrigation engine |
| **Weather Intelligence** | OpenWeatherMap API |
| **Voice Assistant** | Web Speech API (EN/KN/HI/MR) |
| **Farmer Marketplace** | Direct buyer/seller commerce |
| **Admin Dashboard** | Real-time platform analytics |

---

## Project Structure

```
farm-ai/
├── backend/               # FastAPI backend
│   ├── app/
│   │   ├── main.py        # FastAPI app entry point
│   │   ├── core/          # Config, DB, Security
│   │   ├── models/        # Pydantic schemas
│   │   ├── api/routes/    # All API endpoints
│   │   ├── services/      # AI, Market, Weather logic
│   │   └── ml_models/     # Crop & Disease models
│   ├── requirements.txt
│   └── .env
│
└── frontend/              # React + Vite frontend
    ├── src/
    │   ├── pages/         # 10 full pages
    │   ├── components/    # Reusable components
    │   ├── services/      # API service layer
    │   └── context/       # Auth context
    ├── package.json
    └── tailwind.config.js
```

---

## Quick Setup

### 1. Prerequisites
- Python 3.10+
- Node.js 18+
- MongoDB Atlas account (free tier works)
- OpenWeatherMap API key (free)
- Google Gemini API key (free)

### 2. Backend Setup

```bash
cd farm-ai/backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
# Edit .env with your MongoDB URL and API keys

# Start server
uvicorn app.main:app --reload --port 8000
```

API docs available at: **http://localhost:8000/docs**

### 3. Frontend Setup

```bash
cd farm-ai/frontend

npm install
npm run dev
```

Frontend at: **http://localhost:5173**

### 4. MongoDB Atlas Setup

1. Create free cluster at https://cloud.mongodb.com
2. Create database user with password
3. Whitelist IP `0.0.0.0/0` (or your specific IP)
4. Copy connection string → paste in `backend/.env` as `MONGODB_URL`
5. Collections are auto-created with indexes on first run

### 5. API Keys

| Service | URL | Required |
|---|---|---|
| OpenWeatherMap | https://openweathermap.org/api | Optional (mock data used without it) |
| Google Gemini | https://aistudio.google.com/app/apikey | Optional (XAI falls back to rule-based) |

---

## Adaptive Market Balancing AI — How It Works

```
Problem: All farmers grow tomato → oversupply → price crash

Solution:
1. When farmer A registers tomato cultivation → saturation_tracking DB updated
2. Farmer B requests AI recommendation
3. AI checks: tomato saturation in region = 73% (critical)
4. AI penalizes tomato score by 30% in recommendation ranking
5. Chili (15% saturation, lower competition) rises to top
6. Farmer B sees: "Chili recommended — tomato oversupply risk 73%"
7. Both farmers profit sustainably

Saturation Index Formula:
  saturation = (farmers_growing_crop / total_regional_farmers) / market_demand_multiplier

Risk Levels:
  < 30%  → Low     (green)  — Recommended
  30-50% → Medium  (yellow) — Proceed with caution  
  50-70% → High    (orange) — Consider alternatives
  > 70%  → Critical (red)   — Avoid — price crash likely
```

---

## Tech Stack

**Frontend:** React 18, Vite 5, Tailwind CSS 3, Framer Motion, Recharts, React Router v6, Axios, Lucide React

**Backend:** FastAPI, Motor (async MongoDB), Pydantic v2, python-jose (JWT), passlib (bcrypt)

**AI/ML:** scikit-learn, NumPy, PIL (disease detection), Custom crop scoring model

**Database:** MongoDB Atlas with 9 collections

**External APIs:** OpenWeatherMap, Google Gemini

---

## Test Accounts

After starting the server, register a new account at `/auth`. Use role `admin` to access admin panel.

To create an admin: register normally, then update role in MongoDB Atlas:
```javascript
db.users.updateOne({email: "admin@example.com"}, {$set: {role: "admin"}})
```

---

## Supported Languages (Voice Assistant)
- English (en-IN)
- ಕನ್ನಡ Kannada (kn-IN)  
- हिन्दी Hindi (hi-IN)
- मराठी Marathi (mr-IN)

---

*Built with ❤️ for Indian farmers. Powered by Explainable AI.*
