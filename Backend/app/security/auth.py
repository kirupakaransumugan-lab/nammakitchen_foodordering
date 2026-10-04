from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User, ROLE_ADMIN, ROLE_OWNER, ROLE_CUSTOMER
from app.security.jwt import decode_access_token


# Reads the "Authorization: Bearer <token>" header.
# tokenUrl makes the Swagger /docs "Authorize" button show a
# username/password form that calls our login endpoint.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    token_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token. Please login again.",
        headers={"WWW-Authenticate": "Bearer"}
    )

    try:
        payload = decode_access_token(token)
        user_id = payload.get("sub")
    except JWTError:
        raise token_error

    if user_id is None:
        raise token_error

    user = db.query(User).filter(User.id == int(user_id)).first()

    if user is None:
        raise token_error

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is deactivated."
        )

    return user


def require_admin(current_user: User = Depends(get_current_user)):
    if current_user.role != ROLE_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )

    return current_user


def require_owner(current_user: User = Depends(get_current_user)):
    if current_user.role != ROLE_OWNER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Restaurant owner access required"
        )

    return current_user


def require_customer(current_user: User = Depends(get_current_user)):
    if current_user.role != ROLE_CUSTOMER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Customer access required"
        )

    return current_user
