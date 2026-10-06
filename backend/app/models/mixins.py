"""Shared column helpers for models."""
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime


def utcnow():
    return datetime.now(timezone.utc)


def created_col():
    return Column(DateTime(timezone=True), default=utcnow, nullable=False)


def updated_col():
    return Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)
