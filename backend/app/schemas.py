from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserRegister(BaseModel):
    name: str | None = Field(default=None, max_length=255)
    email: EmailStr
    phone: str | None = Field(default=None, max_length=32)
    password: str = Field(min_length=6)
    referral_code: str | None = None


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    email: str
    phone: str | None = None
    balance: float = 0.0
    is_admin: bool = False
    is_manager: bool = False
    referral_code: str | None = None
    referred_by_manager_id: str | None = None
    settings: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime | None = None


class Token(BaseModel):
    access_token: str
    token_type: str


class SportOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    slug: str


class LeagueOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    sport_id: int
    name: str
    slug: str


class GameOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    external_id: str
    league_id: int
    home: str
    away: str
    home_abbr: str | None = None
    away_abbr: str | None = None
    starts_at: datetime | None = None
    status: str
    is_live: bool = False
    live_minute: int | None = None
    home_score: int | None = None
    away_score: int | None = None
    odds_home: float | None = None
    odds_draw: float | None = None
    odds_away: float | None = None


class TransactionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    bet_id: str | None = None
    type: str
    amount: float
    description: str | None = None
    created_at: datetime


class WalletOp(BaseModel):
    amount: float = Field(gt=0)
    description: str | None = None


class BetSelectionIn(BaseModel):
    match_id: str
    home_team: str
    away_team: str
    selection: str
    selection_label: str
    odds: float = Field(gt=0)
    league: str = ""
    market_id: str | None = None
    market_name: str | None = None


class BetSelectionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    leg_index: int
    match_id: str
    home_team: str
    away_team: str
    selection: str
    selection_label: str
    odds: float
    league: str
    market_id: str | None = None
    market_name: str | None = None


class BetCreate(BaseModel):
    stake: float = Field(gt=0)
    odds: float = Field(gt=0)


class BetPlaceIn(BaseModel):
    stake: float = Field(gt=0)
    selections: list[BetSelectionIn] = Field(min_length=1)
    flex_cut: int | None = Field(default=None, ge=0)


class BetOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    booking_code: str
    ticket_id: str | None = None
    verify_code: str | None = None
    stake: float
    total_odds: float
    potential_win: float
    bonus: float = 0.0
    flex_cut: int | None = None
    status: str
    payout: float | None = None
    leg_results: list[dict[str, Any]] | None = None
    placed_at: datetime
    settled_at: datetime | None = None
    selections: list[BetSelectionOut] = Field(default_factory=list)


class ErrorResponse(BaseModel):
    detail: str
