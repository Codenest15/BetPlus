from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.security import create_access_token, get_password_hash, verify_password
from app.db.session import get_db
from app.models.user import User
from app.schemas import Token, UserOut, UserRegister

router = APIRouter()


def _ensure_manager_referral(db: Session, user: User) -> None:
    if not user.is_manager or user.referral_code:
        return
    prefix = "".join(ch for ch in user.name if ch.isalnum())[:4].upper() or "MGR"
    suffix = user.id.replace("-", "")[:4].upper()
    code = f"{prefix}{suffix}"
    attempt = 0
    while db.query(User).filter(User.referral_code == code, User.id != user.id).first():
        attempt += 1
        code = f"{prefix}{suffix}{attempt}"
    user.referral_code = code
    db.add(user)
    db.commit()
    db.refresh(user)


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(payload: UserRegister, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    phone = payload.phone.strip() if payload.phone else None
    if phone and db.query(User).filter(User.phone == phone).first():
        raise HTTPException(status_code=400, detail="Phone already registered")

    referred_by_manager_id = None
    if payload.referral_code:
        manager = (
            db.query(User)
            .filter(User.referral_code == payload.referral_code.strip().upper())
            .first()
        )
        if manager and manager.is_manager:
            referred_by_manager_id = manager.id

    user = User(
        name=(payload.name or email.split("@")[0]).strip(),
        email=email,
        phone=phone,
        hashed_password=get_password_hash(payload.password),
        referred_by_manager_id=referred_by_manager_id,
        settings={
            "notifications": True,
            "oddsFormat": "decimal",
            "language": "en",
            "managerMode": False,
        },
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)
):
    identifier = form_data.username.strip()
    user = (
        db.query(User)
        .filter((User.email == identifier.lower()) | (User.phone == identifier))
        .first()
    )
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )
    token = create_access_token({"sub": user.id})
    return {"access_token": token, "token_type": "bearer"}


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user
