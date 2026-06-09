# Dual Encoder 진화 실험 계획 — 위키 페이퍼 기반 발전 로드맵

> 내 연구 관점에서의 핵심 takeaway
> - **차별성 축:** ② 한국어 (백본 진화), ③ 양방향 매칭, ④ GT 부재 (5관점 평가 + 순환성 진단), ⑤ LLM 역할 한정 (전처리·평가만, reranker 미채택), ⑧ 학습 fusion
> - **무엇을 강화하는가:** 현재 Dual Encoder = *KR-SBERT 단일 dense + FAISS IndexFlatIP + 휴리스틱 fusion + 1k 샘플*이라는 *원시* 구조. 위키 paper/ 폴더에 정리된 14개 논문(임베딩 5종 + reranker 4종 + 평가 표준 3종 + 5관점 토대 2종)을 바탕으로 **10단계 발전 로드맵 exp-005 ~ exp-015**를 구체화. **모든 실험은 user_data 전체(999명) + JD 전체(235,850)에서 동작**
> - **위협:** 235k JD 전체로 확장 시 (a) FAISS 메모리 (b) Gemini profile 생성 비용 (c) reranker 추론 시간이 *블로커*. 단계적 확장 필요
> - **영향 부위:** `docs/02_project_status.md` §5 다음 마일스톤의 정확한 구체화
> - **당장 가져갈 1개 액션:** (2026-05-31) exp-017~020 완료 → **다음 = V2 임베딩 head 학습** (`docs/10_learnable_fusion_plan.md`). *구 액션(Gemini Judge·reranker)은 폐기.*

## 한 줄 요약

현재 KR-SBERT 단일·FAISS 단독·휴리스틱 fusion·1k 샘플의 *원시* 시스템 → (1) 평가 신뢰도 확보 → (2) 한국어 백본 진화 + 전체 데이터 → (3) 하이브리드 검색 → (4) ~~Stage 2 reranker~~ → (5) ~~도메인 LoRA~~로 진화. 각 단계가  폴더의 *어느 논문*을 어떻게 적용하는지 매핑.

> ★ 2026-05-31 노선 정정 — 이 페이지는 **구(舊) 로드맵**, 일부 폐기
> - **현 노선 = `docs/10_learnable_fusion_plan.md`** (exp-017~020 완료). 다음 = **V2 임베딩 head 학습**.
> - **Gemini Judge(exp-007) 폐기**(비용) → 평가 라벨링은 **LLM 직접 채점**(`docs/13_independent_eval.md`). LLM reranker(exp-011/012/013)도 폐기.
> - 본 페이지 exp-005~016 번호는 *구 dual-encoder 로드맵*. 실제 신규 실험은 exp-017~020. (§6 결과표 하단에 추가)
> - **LLM 경계:** 전처리(profile·JD enrich)·평가 라벨링만 허용, *판정·재랭킹·매칭은 자체*.

---

## 1. 현재 Dual Encoder 시스템 (출발점) — *간단히 적힌 부분*

`docs/01_experiment_timeline.md` Φ4·Φ5 결과:

```
User Side (999명·11,986행 → 1k 샘플)         JD Side (235,850 → 1k 샘플)
        │                                              │
        ▼                                              ▼
Gemini USER_PROFILE_SCHEMA                  Gemini JD_PROFILE_SCHEMA
(target_jobs/industries/hard_skills/        (job_role/industry/required_skills/
 tools/achievement_evidence/competencies/    preferred_skills/soft_competencies/
 embedding_summary)                          posting_type/quality_flags/embedding_summary)
        │                                              │
        ▼                                              ▼
KR-SBERT (snunlp/KR-SBERT-V40K-klueNLI-augSTS)  ← 단일 백본, 768-dim, 2021
        │                                              │
        ▼                                              ▼
user_embeddings (1000, 768)              jd_embeddings (1000, 768)
                       │                  │
                       ▼                  ▼
              FAISS IndexFlatIP (cosine via normalize)
                       │
                       ▼
              Top-K (K=100) 후보
                       │
                       ▼
              [Model C fusion] 6요소 휴리스틱 가중합
              (role_semantic 0.35 + hard_skill 0.20 +
               competency 0.15 + achievement 0.10 +
               industry 0.10 + quality_adjustment 0.10)
                       │
                       ▼
              ranked Top-K
```

**현재 한계 (이 페이지의 모든 실험이 해소 대상):**
- 백본 KR-SBERT (2021, 768-dim, *5년 격차*)
- 데이터 1k 샘플 (전체의 0.4%) — *전체 사용 필수* (메모리)
- Sparse 신호 없음 (dense only) — BM25·BGE-M3 sparse 미활용
- Stage 2 reranker 없음 — fusion이 *학습 안 된 휴리스틱*
- Judge가 휴리스틱 (순환 편향) → exp-019/020 LLM 독립 라벨로 진단·완화 (Gemini Judge 트랙 폐기)
- 후보 풀 own/other/random에 *self-advantage* 내장

---


> 모든 신규 실험 = user 전체 999명 × JD 전체 235,850 (메모리)
> - 1k 샘플 사용 금지 (Φ3·Φ4는 legacy)
> - FAISS 메모리 산정:
>   - KR-SBERT 768-dim: 720 MB
>   - KURE-v1/BGE-M3/Qwen3-0.6B 1024-dim: **960 MB**
>   - Qwen3-8B 4096-dim: 3.8 GB
> - Gemini profile 생성 *전체* 확장은 비용 큼 → retriever 평가는 전체, profile 생성은 *단계적 확장* 검토 (Mira 5-stage 합성 prompt 패턴 활용)

---

## 3. 진화 5 트랙 (위키 paper와 매핑)

### 트랙 ① 평가 신뢰도 확보 (단계 6)
- MTEB·BEIR·embedding-model-evaluation-skill — 평가 표준
- **평가 라벨 = LLM 직접 채점**(exp-019/020) — *Gemini Judge 교체 트랙 폐기*. 순환성은 LLM 독립 라벨로 진단·완화
- 인간 라벨 일부 + Cohen's κ (순환성 완전 탈출, future)

### 트랙 ② 한국어 백본 진화 (단계 7)
- KURE-v1 — 한국어 SOTA (bge-m3 한국어 fine-tune, MTEB-ko 1위)
- Qwen3-Embedding — 교수 추천, 119언어, MTEB-Multi 70.58, *동일 패밀리 reranker*
- BGE-M3 — dense+sparse+multi-vec 통합
- Embedding-Leaderboard-Snapshot-2026 — 비교 매트릭스

### 트랙 ③ 하이브리드 검색 (단계 7)
- BGE-M3 dense + sparse(BM25-style) 모드
- RRF (Reciprocal Rank Fusion)
- BEIR finding: BM25 robust + 하이브리드가 dense 단독보다 +5~10p

### 트랙 ④ Stage 2 Reranker (단계 7) — **★ 2026-05-28 보류**

> ⚠️ 2026-05-28 사용자 결정 — Stage 2 LLM Reranker 트랙 보류
> Gemini API는 *전처리(profile 추출)에만* 사용, 최종 랭킹은 **embedding model + FAISS 단독**으로 결정. exp-011/012/013 모두 SKIP. 본 트랙은 future work / 비교 baseline용 historical record로 유지.
> 단, Mira-Embeddings-V1의 *LoRA fine-tuning* 부분은 트랙 ②(임베딩 강화)로 재포지션 가능.

- RankZephyr / Qwen3-Reranker — zero-shot listwise *(보류)*
- Mira-Embeddings-V1 — 채용 도메인 BoundaryHead MLP + JD-CV LoRA 2-round *(보류, 단 LoRA는 트랙 ②로 흡수 가능)*
- ConFit-v3 — Qwen3-32B multi-pass listwise *(보류)*
- IRPO — sparse feedback 학습 objective *(보류, future work)*

### 트랙 ⑤ 5관점 분기 + Multi-aspect (단계 5·7)
- `docs/03_perspective_fusion_weight_design.md` — 5세트 가중치 분기 (v0 완료)
- JobRec-Dual-Perspective — 학술 토대
- MURAL — multi-aspect retrieval 학술 토대

### 트랙 ⑥ Late Interaction (단계 7~8, 보류)
- ColBERT — 한국어 부재. BGE-M3 multi-vec 모드로 우회

---

## 4. 구체 실험 exp-005 ~ exp-015 (★ 본 페이지 핵심)

각 실험은 실험-결과-기록-템플릿을 따른다. 평가 매트릭스 = NDCG@10(메인) + NDCG@5/Recall@5/MRR@10/Spearman(보조). 모든 실험은 전체 데이터.

### exp-005 — Gemini Profile baseline 전체 데이터 재실행 (단계 4·5) ★ 노트북 작성 완료

| 항목        | 내용                                                                                                                                                                |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **트랙**    | ② 데이터 전체 확장 (백본은 아직 KR-SBERT 유지)                                                                                                                                  |
| **노트북**   | `output/exp-005-baseline-full-data.ipynb` (raw `gemini_profile_faiss_matching.ipynb` 복사 + JD 샘플링 1k → 235,850 변경)                                                 |
| **데이터**   | **user 999명 전체 + JD 235,850 전체** (★ 첫 full-data 실행)                                                                                                               |
| **모델**    | KR-SBERT + Gemini profile (heuristic_fallback 가능) + Model A/B/C + 100쌍 휴리스틱 Judge — *exp-002와 동일 모델, 데이터만 235배*                                                   |
| **가설**    | (1) exp-002 finding *"전처리만으로 효과 없음"*은 235k에서도 유지. Model C 우위만 유지 (2) Top-100 후보의 *기업 다양성* 폭발적 증가 — 중소기업 58.7% 1회성 게시가 후보에 진입 (3) 더 어려운 후보들로 Recall@K 작은 K에서 하락 가능 |
| **메트릭**   | NDCG@10/5, Recall@5, MRR@10, Spearman + *Top-100 unique JD 수·임베딩 시간·FAISS 메모리*                                                                                    |
| **이전 대비** | exp-002 (1k JD): Baseline A NDCG@5=0.422 / Model B=0.421 / Model C=0.805                                                                                          |
| **성공 기준** | Model C 우위 유지 (NDCG@5 > Baseline A + 0.20p) + Top-100 다양성 검증                                                                                                      |
| **상태**    | 🟢 **노트북 작성 완료 (2026-05-17)**, 실행 대기 — heuristic_fallback으로 우선 실행 권장 (Gemini 호출 비용 검토 후 단계적 확장)                                                                   |

### exp-006 — 관점별 fusion 가중치 25셀 측정 (단계 5)

| 항목        | 내용                                                                                                         |                     |
| --------- | ---------------------------------------------------------------------------------------------------------- | ------------------- |
| **트랙**    | ⑤ 5관점 분기                                                                                                   |                     |
| **데이터**   | 5관점 × 100쌍 = 500쌍 (`docs/05_benchmark_100pairs_analysis.md` 분석된 기존 데이터)                                               |                     |
| **모델**    | Model C(profile + e5-small) +  5세트 가중치 A·B·C·D·E |
| **가설**    | 관점 i 가중치를 관점 i 데이터셋에 적용 시 *대각선 i,i가 1위*. 특히 D 관점에서 `industry=0.55`가 NDCG@5 ≥ 0.882 (S07 단일 가중치 D 1위 수치) 통과 |                     |
| **메트릭**   | NDCG@10 × 25셀 + NDCG@5 + Recall@5 + MRR@10                                                                 |                     |
| **이전 대비** | 단일 가중치(현행 Model C) vs 5세트 분기                                                                               |                     |
| **성공 기준** | 5관점 모두에서 분기 NDCG@10 ≥ 단일 + 0.01p / D 관점에서 NDCG@5 ≥ 0.882                                                   |                     |

### exp-007 — Gemini Judge 활성화 (단계 6) ❌ 폐기 (2026-05-31, 비용)

> ⚠️ 폐기 — Gemini Judge 트랙 전체 폐기. 평가 라벨링은 **LLM 직접 채점**(`docs/13_independent_eval.md`)으로 대체. 아래는 historical record.

| 항목        | 내용                                                                                                         |                                            |
| --------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| **트랙**    | ① 평가 신뢰도                                                                                                   |                                            |
| **데이터**   | 단일 100쌍 + 5관점 500쌍 (총 600쌍 재라벨)                                                                            |                                            |
| **모델**    | Gemini API (`gemini-3-flash-preview` 또는 `gemini-2.5-flash`)로 `judge_prompt` 호출 → 0~4 라벨                    |                                            |
| **가설**    | 휴리스틱 Judge의 *순환 편향* 제거 → profile 계열 setup의 인위적 우위 감소. 동시에  P0493 finance가 IT 직무에 rel=4 같은 noise 사라짐 |
| **메트릭**   | Judge ↔ 휴리스틱 Spearman·Pearson + Cohen's κ (별도 인간 5명 평가 수집 시) + 동일 모델에서 단일·5관점 NDCG@10 재측정                  |                                            |
| **이전 대비** | 모든 모델 NDCG@10 변화량 (수치보다 *순위 변화*가 핵심)                                                                       |                                            |
| **성공 기준** | (a) Judge↔모델 Spearman 부호 유지(≥+0.3) (b) Model C와 Baseline A의 NDCG@5 차이가 휴리스틱(+0.38p)보다 *축소*되면 *순환 편향 존재 증명* |                                            |

### exp-008 — N=30 확장 (단계 6)

| 항목        | 내용                                                                |
| --------- | ----------------------------------------------------------------- |
| **트랙**    | ① 평가 신뢰도                                                          |
| **데이터**   | 관점당 30명 × 10 후보 = 300쌍 × 5관점 = **1,500쌍** (현재 500쌍의 3배)           |
| **모델**    | Gemini Judge (exp-007 후)                                          |
| **가설**    | 표본 확대로 NDCG@5 차이 0.01~0.03 변동이 *통계적으로 유의*해짐. Wilcoxon 검정 p < 0.05 |
| **메트릭**   | NDCG@10 (관점별) + Wilcoxon 부호순위 검정 p-value                          |
| **이전 대비** | exp-007 결과의 신뢰구간 좁아짐                                              |
| **성공 기준** | 관점별 NDCG@10의 95% CI가 종전 대비 1/√3 ≈ 0.58배 축소                        |

### exp-009 — 한국어/다국어 백본 5종 비교 (1k baseline, 단계 7) ★ 본실험 → v2에서 풀데이터

| 항목 | 내용 |
|---|---|
| **트랙** | ② 백본 진화 + 데이터 전체 |
| **데이터** | **user_profiles.csv 999명 + jd_profiles_sample1000.csv 1k JD** (baseline 비교 정밀도 충분, 표 3 확장 목적). 풀데이터 235k는 exp-009 v2(후속). |
| **모델 setup** | S11=KURE-v1, S12=Qwen3-Embedding-0.6B, S13=BGE-M3 dense, S14=Qwen3-Embedding-4B, S15=`ko-sroberta-multitask` + 기존 S01~S10 baseline 유지 |
| **가설** | 한국어 학습 백본이 KR-SBERT보다 +0.05~0.10p NDCG@10 개선. MTEB *"단일 모델 우위 없음"* finding과 일관되게 *관점별 1위가 갈릴 것* |
| **메트릭** | 5관점 × NDCG@10 매트릭스 + MTEB-ko 공식 점수 동봉 (embedding-model-evaluation-skill §5.3) + 235k JD 임베딩 시간·메모리 |
| **이전 대비** | exp-008의 S04 (KR-SBERT) 기준 |
| **성공 기준** | KURE-v1 또는 Qwen3-Embedding-0.6B가 평균 NDCG@10 ≥ KR-SBERT + 0.05p |

### exp-010 — Hybrid Retrieval (BGE-M3 sparse + dense + RRF) (단계 7) [SKIP: 풀데이터 필요]

| 항목 | 내용 |
|---|---|
| **트랙** | ③ 하이브리드 검색 |
| **데이터** | user 999명 + JD 235,850 (BGE-M3 sparse·dense 동시 추출) |
| **모델** | BGE-M3 또는 KURE-v1 (BGE-M3 fine-tune이라 sparse 모드 잠재적 활성화 — Q-D8 검증 필요) + BM25(rank_bm25) + RRF fusion |
| **가설** | C Skill-Centric·D Context-Fit 관점에서 *sparse 신호*가 dense 단독보다 +0.03~0.05p. BEIR finding과 일관 |
| **메트릭** | 5관점 × NDCG@10 + sparse vs dense vs hybrid 비교 |
| **이전 대비** | exp-009 best 백본 (dense only) 기준 |
| **성공 기준** | hybrid가 C·D 관점에서 dense 단독보다 +0.03p ↑, A·B·E에서는 ≥ 동등 |

### exp-011 — Stage 2 Reranker: Gemini RankZephyr 패턴 (단계 7) [SKIP — 2026-05-28]

> ⚠️ 보류 사유 (2026-05-28)
> 사용자 결정: Gemini API는 전처리에만 사용, 매칭 최종 랭킹은 자체 임베딩+FAISS. 본 실험 노트북([output/exp-011-gemini-reranker.ipynb](../../output/exp-011-gemini-reranker.ipynb))은 historical record로 유지하되 결과 누적표에서 deprioritize.

| 항목 | 내용 |
|---|---|
| **트랙** | ④ Reranker (단기 1순위 — 학습 부담 없음) |
| **데이터** | exp-009 best 백본의 Top-100 → Gemini reranker로 Top-10 재정렬 |
| **모델** | Gemini API (RankZephyr 패턴) — system prompt에 5관점 분기 (A/B/C/D/E) 주입 |
| **가설** | Listwise reranker가 *5관점별 system prompt 1줄 변경*만으로 가중치 분기 효과 ≥ exp-006 (학습 reranker 없이) |
| **메트릭** | 5관점 × NDCG@10 + **MAP** + **Hit@1** (Stage 2 표준) |
| **이전 대비** | exp-010 hybrid best 기준 |
| **성공 기준** | 5관점 평균 NDCG@10 ≥ exp-009 + 0.05p / D 관점 ≥ +0.08p (Gemini가 산업 enum 매칭 잘함) |

### exp-012 — Stage 2 Reranker: Qwen3-Reranker (단계 7) [SKIP — 2026-05-28]

> ⚠️ 보류 사유 (2026-05-28)
> Qwen3-Reranker는 LLM reranker(쿼리·문서 페어를 LLM이 직접 점수화)이며 본 연구 노선(임베딩+FAISS 단독)과 불일치. **Qwen3-Embedding(임베딩 모델)은 트랙 ②(exp-009)에서 계속 비교 대상으로 유지** — 둘은 다른 모델임.

| 항목 | 내용 |
|---|---|
| **트랙** | ④ Reranker |
| **데이터** | exp-011과 동일 |
| **모델** | Qwen3-Reranker-0.6B / 4B (오픈, 비용 ↓) — Qwen3-Embedding과 동일 패밀리로 인프라 통합 |
| **가설** | Qwen3-Reranker가 Gemini와 동등 또는 약간 낮은 NDCG@10에 *추론 비용 1/10* |
| **메트릭** | exp-011과 동일 + 추론 시간 비교 |
| **이전 대비** | exp-011 (Gemini) |
| **성공 기준** | Qwen3-Reranker NDCG@10 ≥ Gemini × 0.95 / 추론 시간 ≤ Gemini × 0.2 |

### exp-013 — Mira-style 도메인 LoRA Reranker (단계 7~8) [SKIP — LoRA 학습 필요 + 2026-05-28 노선]

> ⚠️ 2026-05-28 노선 변경 + 학습 부담
> 종전 SKIP 사유(LoRA 학습 필요)에 더해, 본 노선이 Stage 2 reranker가 아닌 *Stage 1 임베딩 fine-tune*으로 재포지션되면 트랙 ②로 흡수 가능 (예: KURE-v1 베이스에 LoRA → 임베딩 강화). 본 페이지 트랙 ④에서 분리.

| 항목 | 내용 |
|---|---|
| **트랙** | ④ Reranker (중기) |
| **데이터** | user 999명 STAR + JD 235,850 — Mira-Embeddings-V1 5-stage 합성 prompt로 학습 데이터 생성 |
| **모델** | KURE-v1 위에 R1(JD-JD contrastive) + R2(JD-CV triplet) LoRA + BoundaryHead MLP |
| **가설** | 채용 도메인 fine-tune이 zero-shot 대비 NDCG@10 +0.10p. Recall@50 +8.66p 인용 효과 본 도메인 재현 |
| **메트릭** | NDCG@10 + Recall@50 (Mira 메인 메트릭) + 학습 시간·비용 |
| **이전 대비** | exp-012 best |
| **성공 기준** | NDCG@10 ≥ +0.05p / Recall@50 ≥ +0.05p |

### exp-014 — Wilcoxon 부호순위 검정 (단계 7)

| 항목 | 내용 |
|---|---|
| **트랙** | ① 평가 신뢰도 |
| **데이터** | exp-006~013 모든 결과 (1k 샘플 기반 즉시 실행 가능 — paired Wilcoxon on per-perspective NDCG@10) |
| **모델** | (검정만 — 모델 없음) |
| **가설** | 제안 시스템(best of exp-011~013) vs Baseline A NDCG@10 차이가 p < 0.05 |
| **메트릭** | Wilcoxon p-value, effect size (Cohen's d) |
| **성공 기준** | p < 0.05 + effect size ≥ medium (≥0.5) |

### exp-015 — Ablation Study: 6요소 단일 제거 (단계 7~8)

| 항목 | 내용 |
|---|---|
| **트랙** | ⑤ + 논문용 ablation |
| **데이터** | 기존 1k 샘플 weighted_results.csv 6요소 + benchmark_labeled_100_{A,B,C,D,E} 라벨 |
| **모델** | Model C 6요소(role_semantic·hard_skill·competency·achievement·industry·quality_adjustment) 단일 제거 6 setup |
| **가설** | 어떤 자질을 빼면 NDCG@10이 가장 떨어지나 = 가장 *기여도* 큰 자질 |
| **메트릭** | 5관점 × NDCG@10 (각 자질 제거 시) |
| **이전 대비** | full 6요소 vs −1요소 6세트 |
| **성공 기준** | 각 자질의 NDCG 기여도 정량화 (논문 §Ablation 표) |

### exp-016 — 개정쌍 방향성 검증 (단계 7)

| 항목 | 내용 |
|---|---|
| **트랙** | ③ 양방향 |
| **데이터** | `docs/01_experiment_timeline.md` — *현재 user_data.csv는 draftNum=1 고정이라 이 데이터는 별도 입력 필요* |
| **모델** | exp-006 best 가중치 + 기존 KR-SBERT (full 235k JD 임베딩 필요 X — 후보풀은 18 workspace 개정쌍만 사용) |
| **가설** | 자소서 개정 전→후 점수가 같은 JD에 대해 *방향성 있게* 변함 — 본 시스템이 *자소서 품질 향상*을 잡음 |
| **메트릭** | 개정 전·후 NDCG@10 차이 + Spearman |
| **성공 기준** | 개정 후 점수가 *통계적으로 유의하게* 향상 |

---

## 5. 실험 → 단계 매핑 (≒ `docs/02_project_status.md` §1과 동기화)

| 단계 | 실험 | 우선순위 | 1k 샘플로 실행 가능? |
|---|---|---|---|
| **5** 중간 검증 | exp-005 (Gemini Profile 풀데이터), exp-006 (25셀) | 🔴 즉시 | exp-006: ✅ / exp-005: 풀데이터 |
| **6** 합성 GT | ~~exp-007 (Gemini Judge)~~ 폐기 → **LLM 직접 채점**(exp-019/020) | ✅ 대체 완료 | 인간 κ는 future |
| **7** 최종 검증 | exp-009 (백본 4종), exp-010 (Hybrid) [SKIP], ~~exp-011 (Gemini Reranker)~~ [SKIP 2026-05-28], ~~exp-012 (Qwen3-Reranker)~~ [SKIP 2026-05-28], ~~exp-013 (Mira LoRA)~~ [SKIP], exp-014 (Wilcoxon), exp-015 (Ablation), exp-016 (개정쌍) | 🟡 순차 | exp-014/015: ✅ / 임베딩 비교는 트랙 ② 핵심 |
| **8** 논문 | exp-005~016 결과 통합 + 논문 draft | ⚪ 6월 | — |

---

## 6. 결과 누적 표 (각 exp 종료 시 한 줄 추가) — 살아 있는

> 매 실험 종료 후 실험-결과-기록-템플릿에 따라 분석 페이지 작성 + 본 표에 한 줄 추가

| Exp | 단계 | 핵심 결과 (NDCG@10 평균) | 이전 대비 Δ | 핵심 변화 이유 (1줄) |
|---|---|---|---|---|
| exp-001 (baseline) | 4 | (단일 100쌍) NDCG@5=0.422 | — | 단일 KR-SBERT raw concat |
| exp-002 (Model C) | 4 | (단일 100쌍) NDCG@5=0.805 | +0.383p | Gemini profile + fusion 가중합 추가 |
| exp-003 (5관점 평가) | 4·5 | (5관점) NDCG@5 평균=0.925 (S09) | (환경 다름, 직접 비교 X) | profile + e5 + overlap fusion이 4관점 1위 |
| **exp-005** ★실행중 | 4·5 | (실행 중, User 35%) | (대기) | Gemini Profile baseline을 *전체 데이터(999명 + 235k JD)*로 재실행 — exp-002 결과의 *전체 데이터 일반화 여부* 검증 |
| **exp-006** (25셀) ✅ | 5 | (5세트 분기) 대각선 평균=0.9560 / D세트 평균=**0.9562** ★ / SINGLE=0.9513 | +0.0047p (분기 평균) | D 관점에서 industry=0.55가 +0.0139p 회복. D세트가 모든 관점에서 안정. H1 부분 성공 (A·D만) |
| ~~exp-007~~ (Gemini Judge) | 6 | ❌ 폐기(2026-05-31) | — | Gemini 판정 트랙 폐기 → LLM 직접 채점(exp-019/020) |
| **exp-008** (N=30) | 6 | (실행 보류) | (대기) | 1,500쌍 확장 — exp-007 의존 |
| **exp-009** (백본 4종, 1k) ✅ | 7 | S09=0.966 > S12 Qwen=0.934 > S13 BGE-M3=0.932 > S11 KURE=0.931 > S15 ko-sroberta=0.930 (평균 NDCG@10). **D 관점만 Qwen3 0.961 vs S09 0.933 = +0.028p ★** | -0.032~0.036p (예상 반대) | 최신 SOTA 4종 모두 e5-small 못 이김. 신규 4종 차이 0.004p 이내(사실상 동률). 휴리스틱 Judge 순환 편향 + 도메인 mismatch + N=10 한계가 1순위 위협. → exp-019/020에서 순환성 확인 → 독립 라벨로 재측정 필요 |
| **exp-010** (Hybrid) | 7 | ❌ SKIP | — | 풀데이터 필수 |
| ~~**exp-011** (Gemini Reranker)~~ | 7 | ❌ SKIP (2026-05-28) | — | 사용자 노선 변경 — Gemini는 전처리에만 사용, 매칭 최종 랭킹은 임베딩+FAISS 단독 |
| ~~**exp-012** (Qwen3-Reranker)~~ | 7 | ❌ SKIP (2026-05-28) | — | LLM reranker 노선 보류. Qwen3-Embedding(임베딩 모델, 다른 모델)은 exp-009에서 유지 |
| ~~**exp-013** (Mira LoRA)~~ | 7~8 | ❌ SKIP | — | LoRA 학습 부담 + Stage 2 reranker 노선 보류. LoRA는 Stage 1 임베딩 강화로 흡수 가능 |
| **exp-014** (Wilcoxon) ✅ | 7 | S04→S09 Δ=+0.058p, **Cohen's d=-5.15 (large), p=0.063 (marginal)** | (N=5 한계) | 모든 setup 페어 p≥0.0625 (N=5 exact min). weight 페어 N=50 all negligible. **effect size 보고** 표준화 |
| **exp-015** (Ablation) ✅ | 7~8 | **hard_skill 제거 시 NDCG@10 +0.0034p** (단일 가중치 과대), industry 가장 중요(+0.0031p) | (다양) | 단일 가중치 v1 제안: role 0.40 / skill 0.10 / ind 0.15 / 나머지 |
| **exp-016** (개정쌍) | 7 | (실행 보류) | (대기) | 18 workspace 개정쌍 데이터 위치 확인 필요 |
| — | — | — | — | **↓ learnable fusion 트랙 ⑧ (2026-05-31, 현 노선)** |
| **exp-017** (황금 가중치 그리드) ✅ | 5 | 500쌍 NDCG@10 = **1.0 천장**(임의=황금) | — | 후보 ~10개라 변별력 없음 → 풀 확장 필요 |
| **exp-018** (학습 fusion V1) ✅ | 5 | 3,000풀: 임의 0.936 < 황금 0.998 ≈ 학습 0.996 | +0.062p (천장 해소) | LLM graded 라벨 + 관점별 Ridge |
| **exp-019** (독립 라벨 검증) ✅ | 5·6 | learned 0.906 ≈ arbitrary 0.917 | (순환성 상쇄) | LLM 독립 라벨 → exp-018 우위는 순환 아티팩트. role_match 최강·competency 최약 |
| **exp-020** (통계검정) ✅ | 5·6 | 우위 미재현: Wilcoxon p≈0.95, Cohen d≈0, CI 0포함 | (N=12) | 선형 가중치 재조정 한계 확정 → V2 임베딩 필요 |

---

## 7. 차별성 5축과의 매핑 (각 실험이 어떤 축 진전시키나)

| 실험 | 축 ① 자소서 | 축 ② 한국어 | 축 ③ 양방향 | 축 ④ GT 부재 | 축 ⑤ End-to-End LLM |
|---|---|---|---|---|---|
| exp-005 (Gemini baseline) | | | ✓ | ✓ | |
| exp-006 (25셀 매트릭스) | | | ✓ | ✓ | |
| exp-007 (Gemini Judge) | | | | ✓ | ✓ |
| exp-008 (N=30) | | | | ✓ | |
| exp-009 (백본 4종) [SKIP] | | ✓ | | | |
| exp-010 (Hybrid) [SKIP] | | ✓ | | | |
| ~~exp-011 (Gemini Reranker)~~ [SKIP] | | | | ✓ | ✓ |
| ~~exp-012 (Qwen3-Reranker)~~ [SKIP] | | ✓ | | | ✓ |
| ~~exp-013 (Mira LoRA)~~ [SKIP] | ✓ | ✓ | | | ✓ |
| exp-014 (Wilcoxon) | | | | ✓ | |
| exp-015 (Ablation) | ✓ | | | | |
| exp-016 (개정쌍) | ✓ | | ✓ | | |

---

## 관련 페이지

- `docs/02_project_status.md` — §3 살아 있는 로그·§5 마일스톤이 본 페이지와 동기
- 실험-결과-기록-템플릿 — 각 exp 페이지 양식
- `docs/03_perspective_fusion_weight_design.md` — exp-005 직접 대상
- `docs/05_benchmark_100pairs_analysis.md` — exp-005 측정의 *기존 분석* 토대
- Embedding-Leaderboard-Snapshot-2026 — exp-008 백본 비교 매트릭스
- embedding-model-evaluation-skill — 평가 매트릭스 메트릭 정의
- research-context §4.2 — 본 페이지의 3-stage 파이프라인 정합

## 출처

- `raw/experiments/중간_보고서_이상엽.pdf` §8 다음 액션 6가지 — exp-005~011 정당화
- `wiki/paper/` 14개 페이퍼 — 각 실험의 학술 토대

## 메타

- 작성일: 2026-05-17
- 마지막 갱신: **2026-05-31** — ★ 맥락 정합: 상단 노선정정 콜아웃 추가, **Gemini Judge(exp-007) 폐기 마킹**(→LLM 직접 채점), exp-017~020(learnable fusion 트랙 ⑧) 결과표 추가, 차별성 축 ⑤ 재서술+⑧ 추가. 구 exp-005~016은 historical 로드맵.
- 이전 갱신: 2026-05-28 (Stage 2 reranker 보류), 2026-05-18 (exp-005~016 재정렬)
- 상태: **현 노선 = learnable fusion(트랙⑧, exp-017~020) + V2 임베딩. LLM은 전처리·평가만. 구 dual-encoder 로드맵(005~016)은 historical**
- 다음 갱신 트리거: exp-005 결과 / exp-009 임베딩 비교 결과 / exp-006 25셀 결과 / 임베딩 모델 fine-tune 결정 시
- 태그: #실험계획 #dual-encoder진화 #로드맵 #전체데이터 #평가매트릭스누적 #1stage노선