from typing import Optional
from pydantic import BaseModel, field_validator


class APIReview(BaseModel):
    title: str
    note: float
    imdb_link: Optional[str] = None
    date: Optional[str] = None
    season: Optional[int] = None

    @field_validator("season", mode="before")
    @classmethod
    def empty_string_as_none(cls, v):
        if isinstance(v, str):
            if not v.strip():
                return None
            try: return int(v)
            except ValueError:
                return None
        return v


class APIToseeItem(BaseModel):
    title: str
    media_type: str
    imdb_link: Optional[str] = None
    seasons: Optional[int] = None

    @field_validator("media_type")
    @classmethod
    def validate_media_type(cls, v):
        normalized = v.strip().lower()
        if normalized not in {"movie", "series"}:
            raise ValueError("media_type must be 'movie' or 'series'")
        return normalized

    @field_validator("seasons", mode="before")
    @classmethod
    def empty_string_as_none(cls, v):
        if isinstance(v, str):
            if not v.strip():
                return None
            try: return int(v)
            except ValueError:
                return None
        return v