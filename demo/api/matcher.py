"""V2 inference — MLP-128 head 5개를 시작 시 학습하고 inference에 사용.

exp-023 sweep best config 채택:
- arch: MLP-128 (Linear+ReLU+Dropout+Linear)
- loss: MSE (rank loss와 성능 동률 + 8배 빠름)
- wd: 1e-3
- epochs: 15, batch: 512, lr: 1e-3
"""
from __future__ import annotations

import re
from typing import Optional

import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F

from data_loader import DataStore, PERSPS

SEED = 42
DEVICE = torch.device("mps" if torch.backends.mps.is_available() else "cpu")
QWEN3_MODEL_ID = "Qwen/Qwen3-Embedding-0.6B"
KO = re.compile(r"[가-힣A-Za-z]{2,}")


class FusionHead(nn.Module):
    def __init__(self, user_dim: int, jd_dim: int, comp_dim: int = 5, hidden: int = 128) -> None:
        super().__init__()
        in_dim = user_dim + jd_dim + comp_dim
        self.net = nn.Sequential(
            nn.Linear(in_dim, hidden),
            nn.ReLU(),
            nn.Dropout(0.1),
            nn.Linear(hidden, 1),
        )

    def forward(self, user_emb: torch.Tensor, jd_emb: torch.Tensor, comp: torch.Tensor) -> torch.Tensor:
        x = torch.cat([user_emb, jd_emb, comp], dim=-1)
        return self.net(x).squeeze(-1)


class Matcher:
    """V2 fusion heads (관점 5개) 보관 + inference."""

    heads: dict[str, FusionHead]
    user_t: torch.Tensor
    jd_t: torch.Tensor
    comp_t: torch.Tensor

    def __init__(self, store: DataStore) -> None:
        self.store = store
        self.heads = {}
        self.device = DEVICE
        # Qwen3 모델은 첫 /match-custom 호출 시 lazy load
        self._qwen_tokenizer = None
        self._qwen_model = None

    # ---------- 학습 데이터 생성 (exp-023과 동일) ----------
    def _sample_candidates(self, uid: str, n_pos: int = 8, n_hard: int = 6, n_easy: int = 8) -> list[int]:
        u = self.store.user_profiles[uid]
        jp = self.store._jp
        all_jids = self.store.jd_ids
        jid_role = {int(j): jp[int(j)]["role"] for j in all_jids}
        jid_ind = {int(j): jp[int(j)]["industry"] for j in all_jids}
        pos = [j for j in all_jids if jid_role[int(j)] in u["jobs"]]
        hard = [j for j in all_jids if jid_role[int(j)] not in u["jobs"] and jid_ind[int(j)] in u["industries"]]
        easy = [j for j in all_jids if jid_role[int(j)] not in u["jobs"] and jid_ind[int(j)] not in u["industries"]]
        rng = np.random.default_rng(42 + hash(uid) % 1000)
        out: list[int] = []
        for pool, n in [(pos, n_pos), (hard, n_hard), (easy, n_easy)]:
            if pool:
                out += list(rng.choice(pool, size=min(n, len(pool)), replace=False))
        return [int(j) for j in out]

    # ---------- 학습 ----------
    def train_all_heads(self) -> dict[str, float]:
        torch.manual_seed(SEED)
        np.random.seed(SEED)
        if self.device.type == "mps":
            torch.mps.manual_seed(SEED)

        # train/held-out (exp-023과 동일: 800/199)
        rng2 = np.random.default_rng(7)
        shuf = list(self.store.user_ids)
        rng2.shuffle(shuf)
        train_uids = shuf[:800]

        train_pairs: list[tuple[str, int]] = []
        for uid in train_uids:
            for jid in self._sample_candidates(uid):
                train_pairs.append((uid, jid))

        user_t = torch.tensor(self.store.user_emb, dtype=torch.float32, device=self.device)
        jd_t = torch.tensor(self.store.jd_emb, dtype=torch.float32, device=self.device)
        comp_t = torch.tensor(self.store.comp_mat, dtype=torch.float32, device=self.device)
        self.user_t = user_t
        self.jd_t = jd_t
        self.comp_t = comp_t

        all_uids = self.store.user_ids
        all_jids = list(self.store.jd_ids)
        train_user_idx = np.array([all_uids.index(uid) for uid, _ in train_pairs])
        train_jd_idx = np.array([all_jids.index(jid) for _, jid in train_pairs])

        final_losses: dict[str, float] = {}
        for p in PERSPS:
            print(f"[matcher] head {p} 학습 중...")
            Ls = self.store.label_mat[p]
            train_labels = np.array(
                [Ls[ui, ji] for ui, ji in zip(train_user_idx, train_jd_idx)],
                dtype=np.float32,
            )
            head = FusionHead(self.store.user_emb.shape[1], self.store.jd_emb.shape[1], 5).to(self.device)
            opt = torch.optim.Adam(head.parameters(), lr=1e-3, weight_decay=1e-3)
            n = len(train_pairs)
            perm = np.arange(n)
            last_loss = 0.0
            for _ep in range(15):
                np.random.shuffle(perm)
                for bi in range(0, n, 512):
                    idx = perm[bi : bi + 512]
                    ui = train_user_idx[idx]
                    ji = train_jd_idx[idx]
                    lb = train_labels[idx]
                    u_emb = user_t[ui]
                    j_emb = jd_t[ji]
                    c_in = comp_t[ui, ji]
                    y = torch.tensor(lb, dtype=torch.float32, device=self.device)
                    pred = head(u_emb, j_emb, c_in)
                    L = F.mse_loss(pred, y)
                    opt.zero_grad()
                    L.backward()
                    opt.step()
                    last_loss = L.item()
            head.eval()
            self.heads[p] = head
            final_losses[p] = float(last_loss)
            print(f"[matcher] head {p} 완료 (final loss={last_loss:.4f})")
        return final_losses

    # ---------- Qwen3 라이브 인코딩 (lazy) ----------
    def _ensure_qwen(self) -> None:
        if self._qwen_model is not None:
            return
        print(f"[matcher] Qwen3 모델 lazy load 중 ({QWEN3_MODEL_ID})...")
        from transformers import AutoModel, AutoTokenizer

        tok = AutoTokenizer.from_pretrained(QWEN3_MODEL_ID, padding_side="left")
        if tok.pad_token is None:
            tok.pad_token = tok.eos_token
        mdl = AutoModel.from_pretrained(QWEN3_MODEL_ID, dtype=torch.float32).to(self.device)
        mdl.eval()
        self._qwen_tokenizer = tok
        self._qwen_model = mdl
        print("[matcher] Qwen3 모델 ready ✅")

    def _last_token_pool(self, hidden: torch.Tensor, mask: torch.Tensor) -> torch.Tensor:
        seq_lens = mask.sum(dim=1) - 1
        return hidden[torch.arange(hidden.shape[0], device=hidden.device), seq_lens]

    @torch.no_grad()
    def encode_user_text(self, text: str, max_len: int = 512) -> torch.Tensor:
        """자유 텍스트(자소서) → 1024-dim 임베딩."""
        self._ensure_qwen()
        enc = self._qwen_tokenizer(
            [text],
            padding=True,
            truncation=True,
            max_length=max_len,
            return_tensors="pt",
        ).to(self.device)
        out = self._qwen_model(**enc)
        emb = self._last_token_pool(out.last_hidden_state, enc.attention_mask)
        emb = F.normalize(emb, p=2, dim=1)
        return emb  # shape (1, 1024)

    @torch.no_grad()
    def match_custom(
        self,
        text: str,
        jobs: list[str],
        industries: list[str],
        ability_keywords: list[str],
        perspective: str,
        top_k: int = 10,
    ) -> list[dict]:
        """자유 입력 자소서/프로필 → Top-K JD 매칭.

        라이브 Qwen3 인코딩 + 5컴포넌트 즉석 계산.
        """
        if perspective not in self.heads:
            raise ValueError(f"unknown perspective: {perspective}")
        # 1. user 임베딩 라이브 계산
        user_text = (
            f"관심 직무: {', '.join(jobs)}\n"
            f"관심 산업: {', '.join(industries)}\n"
            f"보유 역량: {', '.join(ability_keywords)}\n"
            f"자기소개서: {text}"
        )
        user_emb = self.encode_user_text(user_text)  # (1, 1024) on device

        # 2. 5컴포넌트 즉석 계산 (모든 JD)
        u_profile = {
            "jobs": [j.lower().strip() for j in jobs if j.strip()],
            "industries": [
                i.lower().strip().rstrip("s") for i in industries if i.strip()
            ],
            "ability_kw": set(k.lower().strip() for k in ability_keywords if k.strip()),
            "star_tokens": set(t.lower() for t in KO.findall(text)),
            "skill_tokens": set(t.lower() for t in KO.findall(text)),
        }
        from data_loader import _components  # noqa: PLC0415

        n_j = len(self.store.jd_ids)
        comp_arr = np.zeros((n_j, 5), dtype=np.float32)
        for k, jid in enumerate(self.store.jd_ids):
            comp_arr[k] = _components(u_profile, self.store._jp[int(jid)])
        comp_t = torch.tensor(comp_arr, dtype=torch.float32, device=self.device)

        # 3. forward
        head = self.heads[perspective]
        u_expand = user_emb.expand(n_j, -1)
        scores = head(u_expand, self.jd_t, comp_t).cpu().numpy()
        top_idx = np.argsort(-scores)[:top_k]

        items = []
        for rank, ji in enumerate(top_idx, 1):
            jid = int(self.store.jd_ids[ji])
            c = comp_arr[ji]
            items.append(
                {
                    "rank": rank,
                    "jobId": jid,
                    "score": float(scores[ji]),
                    "label": 0,  # 라벨 미정의 (입력에 정답 없음)
                    "components": {
                        "role_match": float(c[0]),
                        "hard_skill": float(c[1]),
                        "industry_match": float(c[2]),
                        "star_overlap": float(c[3]),
                        "competency": float(c[4]),
                    },
                }
            )
        return items

    # ---------- inference ----------
    @torch.no_grad()
    def match(self, user_id: str, perspective: str, top_k: int = 10) -> list[dict]:
        if perspective not in self.heads:
            raise ValueError(f"unknown perspective: {perspective}")
        if user_id not in self.store.user_ids:
            raise ValueError(f"unknown userId: {user_id}")
        u_idx = self.store.user_ids.index(user_id)
        n_j = len(self.store.jd_ids)
        head = self.heads[perspective]
        u_emb = self.user_t[u_idx : u_idx + 1].expand(n_j, -1)
        j_emb = self.jd_t
        c_in = self.comp_t[u_idx]
        scores = head(u_emb, j_emb, c_in).cpu().numpy()
        top_idx = np.argsort(-scores)[:top_k]
        labels = self.store.label_mat[perspective][u_idx]
        items = []
        for rank, ji in enumerate(top_idx, 1):
            jid = int(self.store.jd_ids[ji])
            comp = self.store.comp_mat[u_idx, ji]
            items.append(
                {
                    "rank": rank,
                    "jobId": jid,
                    "score": float(scores[ji]),
                    "label": int(labels[ji]),
                    "components": {
                        "role_match": float(comp[0]),
                        "hard_skill": float(comp[1]),
                        "industry_match": float(comp[2]),
                        "star_overlap": float(comp[3]),
                        "competency": float(comp[4]),
                    },
                }
            )
        return items
