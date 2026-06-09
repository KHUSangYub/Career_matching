"""FastAPI 엔트리.

실행:
    cd demo/api
    uvicorn main:app --reload --port 8000

첫 시작 시 lifespan에서 임베딩 로드 + 5컴포넌트 행렬 계산 + head 5개 학습 (약 1~2분).
이후 /match는 즉시 응답.
"""
from __future__ import annotations

import ast
import json
from contextlib import asynccontextmanager
from typing import Any

import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from data_loader import COMP_COLS, PERSP_DESC, PERSP_NAMES, PERSP_W, PERSPS, DataStore
from matcher import DEVICE, Matcher
from schemas import (
    ComponentScores,
    HealthResponse,
    MatchCustomRequest,
    MatchItem,
    MatchRequest,
    MatchResponse,
    ModelInfo,
    PerspectiveInfo,
    PerspectiveListResponse,
    PerspectiveWeights,
    UserListResponse,
    UserSummary,
)

# 전역 상태 (lifespan에서 채움)
state: dict[str, Any] = {"store": None, "matcher": None, "ready": False}


def _parse_list(v):
    if v is None or (isinstance(v, float) and pd.isna(v)):
        return []
    if isinstance(v, list):
        return v
    s = str(v).strip()
    if not s or s == "[]":
        return []
    try:
        return json.loads(s)
    except Exception:
        try:
            return ast.literal_eval(s)
        except Exception:
            return [s]


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("=" * 60)
    print(f"[main] FastAPI 부팅 — device={DEVICE}")
    print("=" * 60)
    store = DataStore()
    matcher = Matcher(store)
    matcher.train_all_heads()
    state["store"] = store
    state["matcher"] = matcher
    state["ready"] = True
    print("=" * 60)
    print("[main] Model ready ✅  — http://localhost:8000/docs")
    print("=" * 60)
    yield


app = FastAPI(
    title="캡스톤 V2 매칭 API",
    description="자기소개서 → JD 매칭. Qwen3-Embedding-0.6B + MLP-128 학습 head.",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS — Next.js dev server :3000 허용
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------- /healthz ----------
@app.get("/healthz", response_model=HealthResponse)
async def healthz() -> HealthResponse:
    return HealthResponse(
        status="ok" if state["ready"] else "loading",
        modelLoaded=state["ready"],
        device=str(DEVICE),
    )


# ---------- /users ----------
@app.get("/users", response_model=UserListResponse)
async def list_users() -> UserListResponse:
    if not state["ready"]:
        raise HTTPException(503, "model not ready")
    store: DataStore = state["store"]
    users: list[UserSummary] = []
    for uid in store.user_ids:
        prof = store.user_profiles[uid]
        users.append(
            UserSummary(
                userId=uid,
                jobs=prof["jobs"],
                industries=prof["industries"],
                abilityKeywords=sorted(prof["ability_kw"]),
                starPreview=prof["star_text"][:200],
            )
        )
    return UserListResponse(users=users, total=len(users))


# ---------- /perspectives ----------
@app.get("/perspectives", response_model=PerspectiveListResponse)
async def list_perspectives() -> PerspectiveListResponse:
    items = [
        PerspectiveInfo(
            id=p,  # type: ignore[arg-type]
            name=f"{p}: {PERSP_NAMES[p]}",
            description=PERSP_DESC[p],
            weights=PerspectiveWeights(
                role=PERSP_W[p]["role"],
                industry=PERSP_W[p]["ind"],
                skill=PERSP_W[p]["skill"],
                star=PERSP_W[p]["star"],
                comp=PERSP_W[p]["comp"],
            ),
        )
        for p in PERSPS
    ]
    return PerspectiveListResponse(perspectives=items)


# ---------- /match ----------
@app.post("/match", response_model=MatchResponse)
async def match(req: MatchRequest) -> MatchResponse:
    if not state["ready"]:
        raise HTTPException(503, "model not ready")
    store: DataStore = state["store"]
    matcher: Matcher = state["matcher"]
    try:
        raw_items = matcher.match(req.userId, req.perspective, req.topK)
    except ValueError as e:
        raise HTTPException(400, str(e)) from e

    items: list[MatchItem] = []
    for it in raw_items:
        try:
            jrow = store.jd_meta.loc[it["jobId"]]
            if isinstance(jrow, pd.DataFrame):
                jrow = jrow.iloc[0]
        except KeyError:
            continue
        items.append(
            MatchItem(
                rank=it["rank"],
                jobId=it["jobId"],
                company=str(jrow.get("company_name", "")),
                title=str(jrow.get("title", ""))[:120],
                role=str(jrow.get("jd_job_role", "")),
                industry=str(jrow.get("jd_industry", "")),
                score=it["score"],
                label=it["label"],
                components=ComponentScores(**it["components"]),
                summary=(str(jrow.get("jd_summary"))[:400] if isinstance(jrow.get("jd_summary"), str) else None),
                duties=(
                    str(jrow.get("jd_main_duties_text"))[:600]
                    if isinstance(jrow.get("jd_main_duties_text"), str)
                    else None
                ),
                ideal=(
                    str(jrow.get("jd_ideal_candidate_text"))[:400]
                    if isinstance(jrow.get("jd_ideal_candidate_text"), str)
                    else None
                ),
                requiredSkills=[str(x) for x in _parse_list(jrow.get("jd_required_skills"))[:8]],
            )
        )

    return MatchResponse(
        userId=req.userId,
        perspective=req.perspective,
        results=items,
        modelInfo=ModelInfo(
            backbone="Qwen3-Embedding-0.6B",
            head="MLP-128 (branched per perspective)",
            perspective=req.perspective,
            userPool=len(store.user_ids),
            jdPool=len(store.jd_ids),
        ),
    )


# ---------- /match-custom (자유 입력 자소서 → 매칭, Qwen3 라이브 인코딩) ----------
@app.post("/match-custom", response_model=MatchResponse)
async def match_custom(req: MatchCustomRequest) -> MatchResponse:
    if not state["ready"]:
        raise HTTPException(503, "model not ready")
    store: DataStore = state["store"]
    matcher: Matcher = state["matcher"]
    try:
        raw_items = matcher.match_custom(
            text=req.text,
            jobs=req.jobs,
            industries=req.industries,
            ability_keywords=req.abilityKeywords,
            perspective=req.perspective,
            top_k=req.topK,
        )
    except ValueError as e:
        raise HTTPException(400, str(e)) from e

    items: list[MatchItem] = []
    for it in raw_items:
        try:
            jrow = store.jd_meta.loc[it["jobId"]]
            if isinstance(jrow, pd.DataFrame):
                jrow = jrow.iloc[0]
        except KeyError:
            continue
        items.append(
            MatchItem(
                rank=it["rank"],
                jobId=it["jobId"],
                company=str(jrow.get("company_name", "")),
                title=str(jrow.get("title", ""))[:120],
                role=str(jrow.get("jd_job_role", "")),
                industry=str(jrow.get("jd_industry", "")),
                score=it["score"],
                label=it["label"],
                components=ComponentScores(**it["components"]),
                summary=(str(jrow.get("jd_summary"))[:400] if isinstance(jrow.get("jd_summary"), str) else None),
                duties=(
                    str(jrow.get("jd_main_duties_text"))[:600]
                    if isinstance(jrow.get("jd_main_duties_text"), str)
                    else None
                ),
                ideal=(
                    str(jrow.get("jd_ideal_candidate_text"))[:400]
                    if isinstance(jrow.get("jd_ideal_candidate_text"), str)
                    else None
                ),
                requiredSkills=[str(x) for x in _parse_list(jrow.get("jd_required_skills"))[:8]],
            )
        )

    return MatchResponse(
        userId="(custom)",
        perspective=req.perspective,
        results=items,
        modelInfo=ModelInfo(
            backbone="Qwen3-Embedding-0.6B (live encode)",
            head="MLP-128 (branched per perspective)",
            perspective=req.perspective,
            userPool=len(store.user_ids),
            jdPool=len(store.jd_ids),
        ),
    )
