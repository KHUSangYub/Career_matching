"""User/JD 메타·임베딩·5컴포넌트 행렬 로드.

exp-023과 동일한 5컴포넌트 + 라벨 로직을 재사용.
"""
from __future__ import annotations

import ast
import json
import re
from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[2]
RAW = ROOT / "data"
EXP_DIR = ROOT / "output" / "17_v2_embedding_fusion"
EMB_DIR = EXP_DIR / "embeddings"

PERSPS: list[str] = list("ABCDE")
COMP_COLS = ["role_match", "hard_skill", "industry_match", "star_overlap", "competency"]
KO = re.compile(r"[가-힣A-Za-z]{2,}")

# 관점별 가중치 (exp-018/023과 동일)
PERSP_W = {
    "A": dict(role=0.55, ind=0.15, skill=0.15, comp=0.15, star=0.00),
    "B": dict(role=0.15, ind=0.00, skill=0.20, comp=0.25, star=0.40),
    "C": dict(role=0.20, ind=0.00, skill=0.35, comp=0.35, star=0.10),
    "D": dict(role=0.20, ind=0.45, skill=0.00, comp=0.15, star=0.20),
    "E": dict(role=0.20, ind=0.20, skill=0.20, comp=0.20, star=0.20),
}
PERSP_NAMES = {
    "A": "Job-Centric (직무 일치 우선)",
    "B": "Resume-Centric (자소서 내용 우선)",
    "C": "Skill-Centric (스킬 우선)",
    "D": "Context-Fit (산업 매칭 우선)",
    "E": "Mixed (균등)",
}
PERSP_DESC = {
    "A": "직무 일치를 가장 중요하게 평가합니다.",
    "B": "자소서(STAR) 내용과 JD의 단어 겹침을 우선 평가합니다.",
    "C": "필수 스킬 매칭을 가장 중요하게 평가합니다.",
    "D": "산업 매칭을 가장 중요하게 평가합니다. 중소기업 매칭에 강점.",
    "E": "5요소를 균등하게 결합합니다.",
}
THRESH = [0.15, 0.32, 0.52, 0.75]


# ---------- 파싱 헬퍼 ----------
def _parse_list(v):
    if v is None or (isinstance(v, float) and pd.isna(v)):
        return []
    if isinstance(v, list):
        return v
    s = str(v).strip()
    if not s or s == "[]":
        return []
    try:
        x = json.loads(s)
        return x if isinstance(x, list) else [str(x)]
    except Exception:
        try:
            x = ast.literal_eval(s)
            return x if isinstance(x, list) else [str(x)]
        except Exception:
            return [s]


def _norm(s):
    if s is None or (isinstance(s, float) and pd.isna(s)):
        return ""
    return str(s).strip().lower()


def _norm_ind(s):
    s = _norm(s)
    return s[:-1] if s.endswith("s") else s


def _build_user_profile(g: pd.DataFrame) -> dict:
    r0 = g.iloc[0]
    jobs = [_norm(r0[c]) for c in ["interestedJobs_1", "interestedJobs_2", "interestedJobs_3"] if _norm(r0[c])]
    inds = [
        _norm_ind(r0[c])
        for c in ["interestedIndustries_1", "interestedIndustries_2", "interestedIndustries_3"]
        if _norm(r0[c])
    ]
    akw: set[str] = set()
    skill: list[str] = []
    star: list[str] = []
    for _, row in g.iterrows():
        for i in range(3):
            kw = _norm(row.get(f"ability_{i}_keyword"))
            if kw:
                akw.add(kw)
            nm = row.get(f"ability_{i}_name")
            if isinstance(nm, str) and nm.strip():
                skill.append(nm)
        for c in ["Situation", "Task", "Action", "Reason", "Result"]:
            v = row.get(c)
            if isinstance(v, str) and v.strip():
                star.append(v)
    st_txt = " ".join(star)
    return {
        "jobs": jobs,
        "industries": inds,
        "ability_kw": akw,
        "star_tokens": set(t.lower() for t in KO.findall(st_txt)),
        "skill_tokens": set(t.lower() for t in KO.findall(" ".join(skill) + " " + st_txt)),
        "star_text": st_txt[:400],
    }


def _build_jd_profile(r: pd.Series) -> dict:
    req = [
        _norm(x)
        for x in _parse_list(r.get("jd_required_skills")) + _parse_list(r.get("jd_preferred_skills"))
        if _norm(x)
    ]
    comp = [_norm(x) for x in _parse_list(r.get("jd_competencies")) if _norm(x)]
    summ = " ".join(
        [
            str(r.get(c))
            for c in ["jd_summary", "jd_main_duties_text", "jd_ideal_candidate_text"]
            if isinstance(r.get(c), str)
        ]
    )
    req_tokens: set[str] = set()
    for s in req:
        req_tokens |= set(s.split())
    return {
        "role": _norm(r.get("jd_job_role")),
        "role2": _norm(r.get("jd_job_role_secondary")),
        "industry": _norm_ind(r.get("jd_industry")),
        "req": set(req),
        "req_tokens": req_tokens,
        "comp": set(comp),
        "summary_tokens": set(t.lower() for t in KO.findall(summ)),
    }


def _components(u: dict, j: dict) -> np.ndarray:
    s_role = (
        1.0
        if (j["role"] and j["role"] not in ("", "unknown") and j["role"] in u["jobs"])
        else (0.5 if (j["role2"] and j["role2"] not in ("", "unknown") and j["role2"] in u["jobs"]) else 0.0)
    )
    s_ind = 1.0 if (j["industry"] and j["industry"] not in ("", "unknown") and j["industry"] in u["industries"]) else 0.0
    s_skill = (
        min(len(j["req_tokens"] & u["skill_tokens"]) / max(len(j["req_tokens"]), 1), 1.0)
        if j["req_tokens"]
        else 0.0
    )
    s_star = (
        min(len(u["star_tokens"] & j["summary_tokens"]) / max(len(j["summary_tokens"]), 1) * 3, 1.0)
        if (j["summary_tokens"] and u["star_tokens"])
        else 0.0
    )
    s_comp = len(j["comp"] & u["ability_kw"]) / max(len(j["comp"]), 1) if (j["comp"] and u["ability_kw"]) else 0.0
    return np.array([s_role, s_skill, s_ind, s_star, s_comp], dtype=np.float32)


def _label_matrix(C: np.ndarray, p: str) -> np.ndarray:
    w = PERSP_W[p]
    r = (
        w["role"] * C[:, :, 0]
        + w["skill"] * C[:, :, 1]
        + w["ind"] * C[:, :, 2]
        + w["star"] * C[:, :, 3]
        + w["comp"] * C[:, :, 4]
    )
    r[(C[:, :, 0] == 0) & (C[:, :, 2] == 0)] *= 0.5
    mask_dm = (C[:, :, 0] == 1) & (C[:, :, 2] == 1)
    r[mask_dm] = np.minimum(1.0, r[mask_dm] + 0.10)
    r[(C[:, :, 0] == 1) & (C[:, :, 1] == 0) & (C[:, :, 4] == 0)] *= 0.8
    L = np.zeros_like(r, dtype=np.int8)
    for t in THRESH:
        L += (r >= t).astype(np.int8)
    return L


class DataStore:
    """모든 데이터·임베딩·라벨 보관소. FastAPI lifespan에서 1회 생성."""

    user_emb: np.ndarray
    jd_emb: np.ndarray
    comp_mat: np.ndarray  # (N_U, N_J, 5)
    label_mat: dict[str, np.ndarray]
    user_ids: list[str]
    jd_ids: np.ndarray
    user_profiles: dict[str, dict]
    jd_meta: pd.DataFrame  # indexed by job_id

    def __init__(self) -> None:
        print("[data_loader] 임베딩 npz 로드 중...")
        self.user_emb = np.load(EMB_DIR / "user_qwen3.npz", allow_pickle=True)["emb"]
        self.jd_emb = np.load(EMB_DIR / "jd_qwen3.npz", allow_pickle=True)["emb"]

        print("[data_loader] user/JD 메타 로드 중...")
        ud = pd.read_csv(RAW / "user_data.csv")
        jd_df = pd.read_csv(RAW / "company_jobdescription_enriched.partial.csv")

        self.user_profiles = {uid: _build_user_profile(g) for uid, g in ud.groupby("userId")}
        jp = {int(r["job_id"]): _build_jd_profile(r) for _, r in jd_df.iterrows()}

        self.user_ids = sorted(ud["userId"].unique())
        self.jd_ids = np.array(sorted(jp.keys()))
        self.jd_meta = jd_df.set_index("job_id")

        print(f"[data_loader] 5컴포넌트 행렬 계산 중 ({len(self.user_ids)} × {len(self.jd_ids)})...")
        n_u, n_j = len(self.user_ids), len(self.jd_ids)
        self.comp_mat = np.zeros((n_u, n_j, 5), dtype=np.float32)
        for i, uid in enumerate(self.user_ids):
            u = self.user_profiles[uid]
            for k, jid in enumerate(self.jd_ids):
                self.comp_mat[i, k] = _components(u, jp[int(jid)])

        print("[data_loader] 라벨 행렬 계산 중 (5관점)...")
        self.label_mat = {p: _label_matrix(self.comp_mat.copy(), p) for p in PERSPS}
        # 학습용 jd_role/jd_industry 캐시 (matcher가 sample_candidates 만들 때 필요)
        self._jp = jp
        print(f"[data_loader] 완료. users={n_u}, jds={n_j}, emb_dim={self.user_emb.shape[1]}")
