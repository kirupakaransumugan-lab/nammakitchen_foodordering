from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.config import settings
from app.database import Base, engine, get_db

# Import every model here, so create_all knows which tables to make.
from app.models import user  # noqa: F401

from app.routers import auth


Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="Namma Kitchen API",
    description="Single Restaurant Food Ordering System",
    version="1.0.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL,
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


app.include_router(auth.router, prefix="/api")


@app.get("/")
def root():
    return {
        "message": "Namma Kitchen API is running"
    }


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy"
    }


@app.get("/api/health/db")
def database_health_check(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        raise HTTPException(
            status_code=503,
            detail="Database is not connected"
        )

    return {
        "database": "connected"
    }
