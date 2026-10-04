from datetime import datetime

from sqlalchemy import DateTime, String, func
from sqlalchemy.dialects.mysql import MEDIUMBLOB
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


# Photos uploaded by the owner, kept inside MySQL.
# Saving them in the database (not on disk) means they work the same
# on a local PC and on Vercel, where files on disk are wiped.
# Shown at /api/images/{id}.
class UploadedImage(Base):
    __tablename__ = "uploaded_images"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    # e.g. "image/jpeg"
    content_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False
    )

    # MEDIUMBLOB holds up to 16 MB (photos are limited to 2 MB)
    data: Mapped[bytes] = mapped_column(
        MEDIUMBLOB,
        nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now(),
        nullable=False
    )
