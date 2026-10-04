# One-time move: photos saved on disk (Backend/uploads) -> the database.
#
# Before: foods.image = "http://localhost:8000/uploads/foods/abc.jpg"
# After:  foods.image = "/api/images/7"
#
# Run from the Backend folder:  python -m app.migrate_uploads
# Safe to run again: links that are already "/api/images/..." are skipped.

from app import models  # noqa: F401
from app.database import Base, SessionLocal, engine
from app.models.category import Category
from app.models.food import Food
from app.models.food_image import FoodImage
from app.models.food_option import FoodOption
from app.models.uploaded_image import UploadedImage
from app.services.upload_service import IMAGE_TYPES, UPLOAD_DIR


# Every column that can hold a photo link: (model, column name)
IMAGE_COLUMNS = [
    (Category, "image"),
    (Food, "image"),
    (FoodImage, "url"),
    (FoodOption, "image")
]

# ".jpg" -> "image/jpeg"
CONTENT_TYPES = {ending: content_type for content_type, ending in IMAGE_TYPES.items()}


# Returns the part after "/uploads/" (e.g. "foods/abc.jpg") when the link
# points at our old photo folder, or None for any other link.
def old_upload_path(url: str | None) -> str | None:
    # TODO(human)
    pass


def migrate():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # The same file can be used twice (e.g. food photo + extra photo)
    new_links = {}
    moved = 0
    missing = []

    try:
        for model, column in IMAGE_COLUMNS:
            for row in db.query(model).all():
                path = old_upload_path(getattr(row, column))

                if path is None:
                    continue

                if path not in new_links:
                    file = UPLOAD_DIR / path

                    if not file.is_file():
                        missing.append(path)
                        continue

                    image = UploadedImage(
                        content_type=CONTENT_TYPES.get(file.suffix.lower(), "image/jpeg"),
                        data=file.read_bytes()
                    )
                    db.add(image)
                    db.flush()  # gives image.id
                    new_links[path] = f"/api/images/{image.id}"

                setattr(row, column, new_links[path])
                moved += 1

        db.commit()
    finally:
        db.close()

    print(f"Updated {moved} photo links ({len(new_links)} files copied into the database).")

    for path in missing:
        print(f"Not found on disk, left unchanged: {path}")


if __name__ == "__main__":
    migrate()
