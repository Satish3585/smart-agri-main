from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime
from bson import ObjectId

from ...models.schemas import UserRegister, UserLogin, TokenResponse, UserOut
from ...core.security import hash_password, verify_password, create_access_token
from ...core.database import get_database
from ..dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


def _serialize_user(user: dict) -> dict:
    return {
        "id": str(user["_id"]),
        "name": user["name"],
        "email": user["email"],
        "role": user["role"],
        "phone": user.get("phone"),
        "state": user.get("state"),
        "district": user.get("district"),
        "land_size_acres": user.get("land_size_acres"),
        "preferred_language": user.get("preferred_language", "en"),
        "created_at": user.get("created_at", datetime.utcnow()).isoformat(),
    }


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(data: UserRegister, db=Depends(get_database)):
    existing = await db.users.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_doc = {
        "name": data.name,
        "email": data.email,
        "password_hash": hash_password(data.password),
        "role": data.role,
        "phone": data.phone,
        "state": data.state,
        "district": data.district,
        "land_size_acres": data.land_size_acres,
        "preferred_language": data.preferred_language or "en",
        "created_at": datetime.utcnow(),
        "is_active": True,
    }
    result = await db.users.insert_one(user_doc)
    user_doc["_id"] = result.inserted_id

    token = create_access_token({"sub": str(result.inserted_id), "role": data.role})
    return TokenResponse(access_token=token, user=_serialize_user(user_doc))


@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin, db=Depends(get_database)):
    user = await db.users.find_one({"email": data.email})
    if not user or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    if not user.get("is_active", True):
        raise HTTPException(status_code=403, detail="Account is deactivated")

    token = create_access_token({"sub": str(user["_id"]), "role": user["role"]})
    return TokenResponse(access_token=token, user=_serialize_user(user))


@router.get("/me")
async def get_me(current_user=Depends(get_current_user)):
    return _serialize_user(current_user)


@router.put("/me")
async def update_profile(
    update_data: dict,
    current_user=Depends(get_current_user),
    db=Depends(get_database),
):
    allowed = {"name", "phone", "state", "district", "land_size_acres", "preferred_language"}
    update = {k: v for k, v in update_data.items() if k in allowed}
    if update:
        await db.users.update_one({"_id": current_user["_id"]}, {"$set": update})
    updated = await db.users.find_one({"_id": current_user["_id"]})
    return _serialize_user(updated)
