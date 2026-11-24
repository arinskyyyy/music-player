import os
import json
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

_cors_env = os.getenv("CORS_ORIGINS")
if _cors_env and not _cors_env.strip().startswith("["):
    _parsed_cors = [origin.strip() for origin in _cors_env.split(",") if origin.strip()]
    os.environ["CORS_ORIGINS"] = json.dumps(_parsed_cors)

class Settings(BaseSettings):
    PROJECT_NAME: str = "SyncRoom Audio API"
    VERSION: str = "1.0.0"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://syncroom:syncroom@localhost:5432/syncroom")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "syncroom_pixel_super_secret_jwt_key_2026")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    ALLOW_RESET_CODE_IN_RESPONSE: bool = os.getenv("ALLOW_RESET_CODE_IN_RESPONSE", "true").lower() in ("true", "1", "yes")
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"]
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")
    APPLE_CLIENT_ID: str = os.getenv("APPLE_CLIENT_ID", "")

settings = Settings()