"""Auth schemas (plain email string — validation in the router)."""
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class RegisterIn(BaseModel):
    email: str
    password: str


class LoginIn(BaseModel):
    email: str
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    created_date: datetime


class TokenOut(BaseModel):
    token: str
    user: UserOut
