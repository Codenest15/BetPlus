from pydantic import BaseModel


class UserCreate(BaseModel):
    email: str
    password: str


class UserOut(BaseModel):
    id: int
    email: str
    balance: float = 0.0
    is_admin: bool = False

    class Config:
        orm_mode = True


class Token(BaseModel):
    access_token: str
    token_type: str


class SportOut(BaseModel):
    id: int
    name: str
    slug: str

    class Config:
        orm_mode = True


class LeagueOut(BaseModel):
    id: int
    sport_id: int
    name: str
    slug: str

    class Config:
        orm_mode = True


class GameOut(BaseModel):
    id: int
    league_id: int
    home: str
    away: str
    starts_at: str | None = None
    status: str

    class Config:
        orm_mode = True


class TransactionOut(BaseModel):
    id: int
    user_id: int
    type: str
    amount: float
    description: str | None = None
    created_at: str

    class Config:
        orm_mode = True


class WalletOp(BaseModel):
    amount: float
    description: str | None = None
