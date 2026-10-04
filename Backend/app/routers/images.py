from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.services import upload_service


# Public: anyone viewing the menu needs to see the photos
router = APIRouter(
    prefix="/images",
    tags=["Images"]
)


# Example: <img src="/api/images/5">
@router.get("/{image_id}")
def get_image(image_id: int, db: Session = Depends(get_db)):
    image = upload_service.get_image(db, image_id)

    # A photo never changes after upload (a new photo gets a new id),
    # so browsers and Vercel's CDN may keep it for a year.
    return Response(
        content=image.data,
        media_type=image.content_type,
        headers={"Cache-Control": "public, max-age=31536000, immutable"}
    )
