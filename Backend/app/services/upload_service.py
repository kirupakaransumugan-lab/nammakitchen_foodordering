import os
from pathlib import Path

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.models.uploaded_image import UploadedImage


# Old photo folder from before photos were kept in the database.
# main.py still shares it at /uploads so old links keep working locally,
# and migrate_uploads.py copies these files into the database.
# Local: Backend/uploads. Vercel (sets VERCEL=1) only allows writing to /tmp.
# Set UPLOAD_DIR to choose another folder.
LOCAL_UPLOAD_DIR = Path(__file__).resolve().parent.parent.parent / "uploads"
DEFAULT_UPLOAD_DIR = "/tmp/uploads" if os.getenv("VERCEL") else LOCAL_UPLOAD_DIR

UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", DEFAULT_UPLOAD_DIR))

MAX_SIZE = 2 * 1024 * 1024   # 2 MB

# Allowed photo types (and the file ending each one uses)
IMAGE_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp"
}


# Saves the photo in the database and returns its address, "/api/images/<id>".
# The address has no host, so it works on localhost and on Vercel alike.
async def save_image(db: Session, file: UploadFile) -> str:
    if file.content_type not in IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please choose a JPG, PNG or WEBP image."
        )

    # Read one byte more than allowed, so we know when it is too big
    content = await file.read(MAX_SIZE + 1)

    if len(content) > MAX_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The image must be 2 MB or smaller."
        )

    image = UploadedImage(content_type=file.content_type, data=content)
    db.add(image)
    db.commit()
    db.refresh(image)

    return f"/api/images/{image.id}"


def get_image(db: Session, image_id: int) -> UploadedImage:
    image = db.get(UploadedImage, image_id)

    if image is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found."
        )

    return image
