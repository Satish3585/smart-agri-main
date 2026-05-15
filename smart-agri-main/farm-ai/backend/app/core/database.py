import logging
from typing import Any, Iterable, Optional

import mongomock
from fastapi import HTTPException
from motor.motor_asyncio import AsyncIOMotorClient

from .config import settings

logger = logging.getLogger(__name__)

client: Any = None
database = None
using_mock_database = False


class AsyncMockCursor:
    def __init__(self, documents: Iterable[dict]):
        self._documents = list(documents)
        self._index = 0

    def sort(self, key: str, direction: int):
        reverse = direction == -1
        self._documents.sort(key=lambda doc: doc.get(key), reverse=reverse)
        return self

    def skip(self, amount: int):
        if amount > 0:
            self._documents = self._documents[amount:]
        return self

    def limit(self, amount: int):
        if amount >= 0:
            self._documents = self._documents[:amount]
        return self

    async def to_list(self, length: Optional[int] = None):
        if length is None:
            return list(self._documents)
        return list(self._documents[:length])

    def __aiter__(self):
        self._index = 0
        return self

    async def __anext__(self):
        if self._index >= len(self._documents):
            raise StopAsyncIteration
        document = self._documents[self._index]
        self._index += 1
        return document


class AsyncMockCollection:
    def __init__(self, collection):
        self._collection = collection

    async def find_one(self, *args, **kwargs):
        return self._collection.find_one(*args, **kwargs)

    async def insert_one(self, *args, **kwargs):
        return self._collection.insert_one(*args, **kwargs)

    async def update_one(self, *args, **kwargs):
        return self._collection.update_one(*args, **kwargs)

    async def delete_one(self, *args, **kwargs):
        return self._collection.delete_one(*args, **kwargs)

    async def count_documents(self, *args, **kwargs):
        return self._collection.count_documents(*args, **kwargs)

    async def create_index(self, *args, **kwargs):
        return self._collection.create_index(*args, **kwargs)

    def find(self, *args, **kwargs):
        return AsyncMockCursor(self._collection.find(*args, **kwargs))

    def aggregate(self, *args, **kwargs):
        return AsyncMockCursor(self._collection.aggregate(*args, **kwargs))


class AsyncMockDatabase:
    def __init__(self, db):
        self._db = db

    def __getattr__(self, name: str):
        return AsyncMockCollection(self._db[name])


def _enable_mock_database():
    global client, database, using_mock_database
    mock_client = mongomock.MongoClient()
    client = mock_client
    database = AsyncMockDatabase(mock_client["farmai"])
    using_mock_database = True
    logger.warning("Using local in-memory mongomock database because MongoDB connection failed")


async def connect_to_mongo():
    global client, database, using_mock_database
    using_mock_database = False
    is_development = settings.APP_ENV.lower() == "development"
    server_timeout_ms = 3000 if is_development else 12000
    options = [
        {},
        {"tlsAllowInvalidCertificates": True},
    ]
    for attempt, extra in enumerate(options):
        try:
            client = AsyncIOMotorClient(
                settings.MONGODB_URL,
                serverSelectionTimeoutMS=server_timeout_ms,
                **extra,
            )
            await client.admin.command("ping")
            database = client.farmai
            logger.info("Connected to MongoDB Atlas successfully")
            await create_indexes()
            return
        except Exception as e:
            client = None
            message = str(e)
            should_fallback_now = is_development and "SSL handshake failed" in message
            if attempt < len(options) - 1:
                logger.warning(f"MongoDB connect attempt {attempt + 1} failed, retrying: {type(e).__name__}: {e}")
                if should_fallback_now:
                    logger.warning("Skipping further Atlas retries in development because TLS handshake is failing")
                    _enable_mock_database()
                    await create_indexes()
                    return
            else:
                logger.warning(f"MongoDB connection failed: {e}")
                if is_development:
                    _enable_mock_database()
                    await create_indexes()
                    return
                logger.warning("Set a valid MONGODB_URL in backend/.env to enable database features")


async def close_mongo_connection():
    global client
    if client:
        client.close()
        logger.info("MongoDB connection closed")


async def create_indexes():
    await database.users.create_index("email", unique=True)
    await database.crops.create_index([("region", 1), ("season", 1)])
    await database.saturation_tracking.create_index([("crop_id", 1), ("region", 1), ("season", 1)])
    await database.market_trends.create_index([("crop_id", 1), ("timestamp", -1)])
    await database.disease_reports.create_index([("farmer_id", 1), ("timestamp", -1)])
    await database.recommendations.create_index([("farmer_id", 1), ("created_at", -1)])
    await database.orders.create_index([("buyer_id", 1), ("status", 1)])
    await database.listings.create_index([("seller_id", 1), ("status", 1)])
    logger.info("Database indexes created")


def get_database():
    if database is None:
        raise HTTPException(
            status_code=503,
            detail="Database not connected. Please set a valid MONGODB_URL in backend/.env and restart the server."
        )
    return database
