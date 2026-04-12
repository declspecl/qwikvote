from __future__ import annotations

import uuid
from dataclasses import dataclass
from typing import Literal

from pydantic import BaseModel, Field


@dataclass(frozen=True)
class Vote:
    vote_id: str
    option_id: str
    weight: int
    is_veto: bool


class PollOption(BaseModel):
    option_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    text: str


class PollConfig(BaseModel):
    weighted_voting: bool = False
    veto_enabled: bool = False
    llm_suggestions_enabled: bool = False


class PollCreateRequest(BaseModel):
    title: str
    description: str = ""
    options: list[str]
    password: str | None = None
    config: PollConfig = Field(default_factory=PollConfig)


class VoteRequest(BaseModel):
    option_id: str
    weight: int = Field(default=1, ge=1, le=5)
    is_veto: bool = False
    password: str | None = None


class CloseRequest(BaseModel):
    password: str | None = None


class PollResults(BaseModel):
    scores: dict[str, float]
    winner: str | None = None
    winner_text: str | None = None
    result_justification: str = ""
    veto_disqualified: list[str] = Field(default_factory=list)
    ai_explanation: str | None = None


class PollResponse(BaseModel):
    poll_id: str
    title: str
    description: str
    options: list[PollOption]
    status: Literal["open", "closed"]
    config: PollConfig
    results: PollResults | None = None


class VoteResponse(BaseModel):
    vote_id: str
    option_id: str
    current_scores: dict[str, float]
