from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.activity_log import AREA_USER
from app.models.user import User, ROLE_CUSTOMER
from app.schemas.auth import RegisterRequest, LoginRequest
from app.services import activity_service
from app.security.password import hash_password, verify_password
from app.security.jwt import create_access_token


def register_user(db: Session, data: RegisterRequest) -> User:
    email = data.email.lower().strip()

    # 1. Email must be unique
    existing_user = db.query(User).filter(User.email == email).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists."
        )

    # 2. Only ONE admin and ONE owner can be created this way.
    #    After they exist, nobody can register as admin/owner again.
    if data.role != ROLE_CUSTOMER:
        role_taken = db.query(User).filter(User.role == data.role).first()

        if role_taken:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"An {data.role} account already exists."
            )

    # 3. Save the new user with a hashed password
    new_user = User(
        name=data.name.strip(),
        email=email,
        phone=data.phone.strip(),
        address=data.address,
        password_hash=hash_password(data.password),
        role=data.role,
        is_active=True
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    article = "an" if new_user.role[0] in "aeiou" else "a"
    activity_service.log(db, new_user, AREA_USER, "register", f"created {article} {new_user.role} account")

    return new_user


def login_user(db: Session, data: LoginRequest) -> dict:
    email = data.email.lower().strip()

    user = db.query(User).filter(User.email == email).first()

    # Same message for "wrong email" and "wrong password",
    # so nobody can find out which emails are registered.
    if user is None or not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is deactivated. Please contact the admin."
        )

    user.last_login_at = datetime.now()
    db.commit()
    activity_service.log(db, user, AREA_USER, "login", "logged in")

    access_token = create_access_token(user_id=user.id, role=user.role)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }
