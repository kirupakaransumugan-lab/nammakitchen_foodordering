import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile, status


# Backend/uploads  (main.py shares this folder at /uploads)
UPLOAD_DIR = Path(__file__).resolve().parent.parent.parent / "uploads"

MAX_SIZE = 2 * 1024 * 1024   # 2 MB

# Allowed photo types -> file ending we save with
IMAGE_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp"
}


# Saves the photo with a new random name and returns "uploads/foods/<name>"
async def save_image(file: UploadFile, folder: str = "foods") -> str:
    ending = IMAGE_TYPES.get(file.content_type)

    if ending is None:
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

    # A random name, so two photos called "biryani.jpg" never overwrite each other
    name = uuid.uuid4().hex + ending

    target_dir = UPLOAD_DIR / folder
    target_dir.mkdir(parents=True, exist_ok=True)
    (target_dir / name).write_bytes(content)

    return f"uploads/{folder}/{name}"
