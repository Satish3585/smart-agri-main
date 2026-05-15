from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


BASE_DIR = Path(__file__).resolve().parents[2]
ENV_FILE = BASE_DIR / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=str(ENV_FILE), case_sensitive=True, extra="ignore")

    MONGODB_URL: str = "mongodb://localhost:27017/farmai"
    SECRET_KEY: str = "change-this-secret-key-in-production-min-32-chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    OPENWEATHER_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    FRONTEND_URL: str = "http://localhost:5173"
    APP_ENV: str = "development"
    APP_NAME: str = "Farm AI"
    APP_VERSION: str = "1.0.0"
    RAZORPAY_KEY_ID: str = ""
    RAZORPAY_KEY_SECRET: str = ""


settings = Settings()
