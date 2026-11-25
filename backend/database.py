from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from backend.config import settings

db_url = settings.DATABASE_URL
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)
connect_args = {}

if db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(db_url, connect_args=connect_args, pool_pre_ping=True)

# Test PostgreSQL connection; if unreachable, fallback to local SQLite for smooth development
try:
    with engine.connect() as conn:
        print("[Database] Connected successfully to PostgreSQL.")
except Exception as e:
    print(f"[Database] PostgreSQL service not reachable on port 5432 ({e}).")
    print("[Database] Falling back to local development database (sqlite:///./syncroom.db).")
    engine = create_engine("sqlite:///./syncroom.db", connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
