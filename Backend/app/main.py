from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import inspect, text
from sqlalchemy.orm import Session

from app.config import settings
from app.database import Base, engine, get_db

# Import every model here, so create_all knows which tables to make.
from app import models  # noqa: F401

from app.routers import admin, auth, categories, foods, orders, owner
from app.services.upload_service import UPLOAD_DIR


Base.metadata.create_all(bind=engine)


# create_all only makes NEW tables; it never adds a column to an old table.
# These columns came later, so add them to databases made before that.
NEW_COLUMNS = {
    "foods": {
        "discount_price": "NUMERIC(10, 2) NULL",
        "prep_time": "INT NULL",
        "calories": "INT NULL"
    },
    "users": {
        "last_login_at": "DATETIME NULL"
    }
}


def add_missing_columns():
    inspector = inspect(engine)

    with engine.begin() as connection:
        for table, columns in NEW_COLUMNS.items():
            existing = {column["name"] for column in inspector.get_columns(table)}

            for name, sql_type in columns.items():
                if name not in existing:
                    connection.execute(text(f"ALTER TABLE {table} ADD COLUMN {name} {sql_type}"))


add_missing_columns()


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
app.include_router(categories.router, prefix="/api")
app.include_router(foods.router, prefix="/api")
app.include_router(orders.router, prefix="/api")
app.include_router(owner.router, prefix="/api")
app.include_router(admin.router, prefix="/api")


# Uploaded photos: UPLOAD_DIR/foods/abc.jpg -> http://.../uploads/foods/abc.jpg
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


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
