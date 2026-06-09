"""Pydantic 요청/응답 모델."""
from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

Perspective = Literal["A", "B", "C", "D", "E"]


# ---------- /healthz ----------
class HealthResponse(BaseModel):
    status: str
    modelLoaded: bool
    device: str


# ---------- /users ----------
class UserSummary(BaseModel):
    userId: str
    jobs: list[str]
    industries: list[str]
    abilityKeywords: list[str]
    starPreview: str


class UserListResponse(BaseModel):
    users: list[UserSummary]
    total: int


# ---------- /perspectives ----------
class PerspectiveWeights(BaseModel):
    role: float
    industry: float
    skill: float
    star: float
    comp: float


class PerspectiveInfo(BaseModel):
    id: Perspective
    name: str
    description: str
    weights: PerspectiveWeights


class PerspectiveListResponse(BaseModel):
    perspectives: list[PerspectiveInfo]


# ---------- /match ----------
class MatchRequest(BaseModel):
    userId: str = Field(..., examples=["P0247"])
    perspective: Perspective = Field(..., examples=["E"])
    topK: int = Field(10, ge=1, le=50)


# ---------- /match-custom ----------
class MatchCustomRequest(BaseModel):
    text: str = Field(..., min_length=20, description="자기소개서 본문")
    jobs: list[str] = Field(default_factory=list, description="관심 직무 (예: rnd)")
    industries: list[str] = Field(default_factory=list, description="관심 산업")
    abilityKeywords: list[str] = Field(default_factory=list, description="보유 역량 키워드")
    perspective: Perspective = "E"
    topK: int = Field(10, ge=1, le=50)


class ComponentScores(BaseModel):
    role_match: float
    hard_skill: float
    industry_match: float
    star_overlap: float
    competency: float


class MatchItem(BaseModel):
    rank: int
    jobId: int
    company: str
    title: str
    role: str
    industry: str
    score: float
    label: int  # 0~4
    components: ComponentScores
    summary: str | None = None
    duties: str | None = None
    ideal: str | None = None
    requiredSkills: list[str] = []


class ModelInfo(BaseModel):
    backbone: str
    head: str
    perspective: Perspective
    userPool: int
    jdPool: int


class MatchResponse(BaseModel):
    userId: str
    perspective: Perspective
    results: list[MatchItem]
    modelInfo: ModelInfo
