from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
import logging

from .core.config import settings
from .core.database import connect_to_mongo, close_mongo_connection, get_database
from .api.routes import auth, crops, market, weather, disease, commerce, admin, payment

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s — %(message)s")
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongo()
    logger.info(f"Farm AI Backend started — {settings.APP_ENV}")
    yield
    await close_mongo_connection()
    logger.info("Farm AI Backend stopped")


app = FastAPI(
    title="Farm AI — Smart Agriculture API",
    description="AI-powered agriculture ecosystem: crop recommendation, disease detection, market intelligence & irrigation alerts",
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(crops.router)
app.include_router(market.router)
app.include_router(weather.router)
app.include_router(disease.router)
app.include_router(commerce.router)
app.include_router(admin.router)
app.include_router(payment.router)


@app.get("/", tags=["Health"])
async def root():
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "tagline": "From Soil to Success with AI",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "healthy", "timestamp": __import__("datetime").datetime.utcnow().isoformat()}


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    messages = [f"{' → '.join(str(loc) for loc in e['loc'] if loc != 'body')}: {e['msg']}" for e in errors]
    return JSONResponse(status_code=422, content={"detail": messages[0] if len(messages) == 1 else messages})


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error: {exc}", exc_info=True)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})
