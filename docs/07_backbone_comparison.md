# exp-009: 한국어/다국어 백본 5종 비교 (1k baseline)

> 내 연구 관점에서의 핵심 takeaway
> - **차별성 축:** ② 한국어 (백본 진화) — 본 연구의 핵심 *베이스라인 위에 어디까지 끌어올릴 수 있나*의 1차 검증
> - **무엇을 발견했나:** ⚠️ **예상과 반대** — 최신 한국어 SOTA (KURE-v1) + 2025 다국어 SOTA (Qwen3-Embedding-0.6B)가 *5년 된 multilingual-e5-small + cosine+overlap fusion(S09)*보다 **평균 NDCG@10 -0.032~-0.035p 낮음**. 그러나 **D 관점(Context-Fit, 산업·근무지)에서는 Qwen3가 +0.028p 우위**.
> - **위협 vs 기회:** (a) 최신 임베딩 모델이 *자동으로 더 좋다*는 가설 부정 — 본 시스템 데이터 분포·라벨링 방식·후보풀 구성과의 fit이 결정적. (b) **휴리스틱 Judge 순환 편향 — `docs/13_independent_eval.md`에서 확인됨**(자체 라벨로 가짜 우위) → 본 백본 ordering도 순환 라벨 위 결과라 *신뢰 보류*. (c) D 관점 우위는 *한국어 산업 의미 매칭 강도* 차이로 해석 가능.
> - **영향 부위:** `docs/01_experiment_timeline.md` §6 다음 액션 우선순위 재조정 / `docs/04_dual_encoder_roadmap.md` §6 결과표 / 보고서 0518 §5.3 표 3 확장 + 신규 §6.9
> - **당장 가져갈 1개 액션:** 본 백본 ordering은 휴리스틱(순환) 라벨 위 결과라 **신뢰 보류** — 순환성은 `docs/13_independent_eval.md`에서 확인됨. 신뢰할 백본 비교는 *독립 라벨*(인간 κ 포함) 위에서 재측정 필요. *(사용자 판단: 백본 비교는 현 연구 핵심 아님. Gemini Judge 트랙은 폐기.)*

## 한 줄 요약

기존 1k 샘플 + 5관점 500쌍 라벨 위에서 4종 신규 백본 (KURE-v1 / Qwen3-Embedding-0.6B / BGE-M3 / ko-sroberta-multitask, S11~S15)을 S09 (profile + e5-small + cosine+overlap) baseline과 비교. **최종 결과 (4종 모두 완료)**: 평균 NDCG@10 = **S09 0.9656 ★** > S12 Qwen3=0.9339 > S13 BGE-M3=0.9316 > S11 KURE=0.9310 > S15 ko-sroberta=0.9298. *최신 한국어/다국어 SOTA 4종이 모두 e5-small 못 이김 (-0.032~-0.036p)*. 단 D 관점에서만 Qwen3 0.961 vs S09 0.933으로 **+0.028p 우위** — 산업 의미 매칭 강도 차이 시사. 휴리스틱 Judge 순환 편향이 본 결과의 1순위 위협 — `docs/13_independent_eval.md`에서 *순환성 확인됨* → 본 백본 ordering 신뢰 보류, 독립 라벨로 재측정 필요. (Gemini Judge 트랙 폐기.)

## 핵심 내용

### 1. 실험 설정

| 항목 | 값 |
|---|---|
| 노트북 | `output/exp-009-baseline-backbone-1k-comparison.ipynb` |
| 데이터 | 기존 1k 샘플 (`user_profiles.csv` 999 + `jd_profiles_sample1000.csv`) |
| 평가 데이터 | `benchmark_labeled_100_{A,B,C,D,E}.csv` 500쌍 동일 라벨 |
| 평가 대상 unique | user 59명 + JD 289개 (= 348개 임베딩 × 4 모델) |
| 입력 텍스트 | profile baseline_text (user: 자소서+희망 산업·직무+역량, JD: 회사+공고+스킬+상세) |
| 임베딩 환경 | CPU (MPS OOM 회피, batch_size=8) |
| 메트릭 | NDCG@10 (메인), NDCG@5, Recall@5, MRR@10 |
| 풀데이터 필요? | ❌ 1k baseline 비교가 본 실험의 본질. v2(풀데이터)는 후속 |

### 2. 모델 정보

| ID | 모델 | dim | 출시 | 한국어 강도 | 입력 길이 처리 |
|---|---|---|---|---|---|
| S09 (baseline) | `intfloat/multilingual-e5-small` | 384 | 2023 | ★ multilingual | max 512 tokens (truncate) |
| S11 | `nlpai-lab/KURE-v1` | 1024 | 2024-12 | ★★★ MTEB-ko 1위 (BGE-M3 한국어 fine-tune) | max 8192 tokens |
| S12 | `Qwen/Qwen3-Embedding-0.6B` | 1024 | 2025-06 | ★★ 119언어, LLM 기반 (decoder-only) | max 32k tokens |
| S13 (진행 중) | `BAAI/bge-m3` dense only | 1024 | 2024-02 | ★★ multi-lingual SOTA | max 8192 tokens |
| S15 (대기) | `jhgan/ko-sroberta-multitask` | 768 | 2022 | ★ KR-SBERT 후속 | max 512 tokens |
| S14 (skip) | `Qwen/Qwen3-Embedding-4B` | 2560 | 2025-06 | ★★★ MTEB-Multi 70.58 | (Mac CPU 메모리 부담으로 별도 실행) |

### 3. NDCG@10 매트릭스 (5관점 × 모델)

| Setup | 모델 | A. Job | B. Resume | C. Skill | D. Context | E. Mixed | **평균** |
|---|---|---|---|---|---|---|---|
| **S09** | profile + e5-small + cosine+overlap (★기존 best) | **0.998** | **0.939** | **0.964** | 0.933 | **0.994** | **0.966** ★ |
| **S11** | KURE-v1 + cosine+overlap | 0.962 | 0.917 | 0.899 | 0.939 | 0.937 | 0.931 |
| **S12** | Qwen3-Embedding-0.6B + cosine+overlap | 0.958 | 0.903 | 0.905 | **0.961** ★ | 0.943 | 0.934 |
| **S13** | BGE-M3 dense + cosine+overlap | 0.961 | 0.919 | 0.898 | 0.943 | 0.938 | 0.932 |
| **S15** | ko-sroberta-multitask + cosine+overlap | 0.955 | 0.900 | 0.904 | 0.947 | 0.943 | 0.930 |

### 3.1 NDCG@5 매트릭스 (5관점 × 모델)

| Setup | 모델 | A | B | C | D | E | 평균 |
|---|---|---|---|---|---|---|---|
| S09 (baseline) | e5-small + overlap | **0.998** | **0.893** | **0.908** | 0.843 | **0.985** | **0.925** ★ |
| S11 | KURE-v1 | 0.915 | 0.843 | 0.738 | 0.841 | 0.872 | 0.842 |
| S12 | Qwen3-0.6B | 0.912 | 0.805 | 0.762 | **0.865** ★ | 0.875 | 0.844 |
| S13 | BGE-M3 | 0.903 | 0.838 | 0.745 | 0.857 | 0.863 | 0.841 |
| S15 | ko-sroberta | 0.869 | 0.807 | **0.789** | 0.849 | 0.847 | 0.832 |

### 3.2 관점별 1위 (S09 + 신규 4종)

| 관점 | 1위 모델 | NDCG@10 | NDCG@5 |
|---|---|---|---|
| A. Job-Centric | S09 | 0.998 | 0.998 |
| B. Resume-Centric | S09 (신규 중 S13 BGE-M3 1위) | 0.939 | 0.893 |
| C. Skill-Centric | S09 (신규 중 S12 Qwen3 NDCG@5=0.762 1위) | 0.964 | 0.908 |
| **D. Context-Fit** | **S12 Qwen3** ★ | **0.961** | **0.865** |
| E. Mixed | S09 | 0.994 | 0.985 |

→ **D 관점에서만 Qwen3가 S09 압도 (+0.028p NDCG@10)**. A·B·C·E는 모두 S09가 1위.

### 4. 가설별 검증

#### 4.1 H1 (가설): 최신 SOTA가 e5-small (2023) 평균 NDCG@10 +0.05~0.10p 개선

**❌ 가설 부정** — S11·S12 모두 S09보다 평균 -0.032~-0.035p **하락**. 단순히 "최신·더 큰 모델 = 더 좋다"는 가정 깨짐. 본 도메인·평가 환경에서 e5-small이 *예상보다 잘함*.

#### 4.2 H2 (관점별 분포): "단일 모델 우위 없음 (MTEB finding)" — 관점별 1위 갈림

**✅ 부분 성공** — D 관점에서 Qwen3-Embedding-0.6B (0.961)가 S09(0.933)를 +0.028p 앞섬. A·B·C·E 관점은 S09가 1위.

→ **관점별 1위 갈림 자체는 사실** — A·B·C·E는 e5-small, D는 Qwen3가 적합. 향후 *관점별 백본 분기*가 가능한 설계 후속 검토 가능.

### 5. 추정 원인 (3가지)

> ⚠️ 본 결과는 1k 샘플 + 휴리스틱 Judge 라벨 위에서 측정된 *1차 결과*. 결정적 결론 아님.

#### 5.1 도메인 mismatch — 일반 검색 SOTA ≠ 채용 매칭 SOTA

KURE-v1 / Qwen3-Embedding은 *일반 search query ↔ passage retrieval*에 학습. 본 시스템의 임베딩 입력은 **Gemini profile schema 텍스트** (구조화 필드 concat: `학력/전공: X. 희망 산업: Y. 자기소개서 문항: Z...`). 사전학습 분포와 일치 안 함 → 일반 query-passage retrieval에서의 SOTA 우위가 본 도메인에서 약화.

Mira-Embeddings-V1 finding과 일관 — "채용 도메인 fine-tune이 zero-shot SOTA 대비 +8.66p Recall@50". 본 결과는 *zero-shot KURE-v1/Qwen3*이 일반 SOTA이지만 채용 도메인 미적합을 시사. Mira-style LoRA 적용(exp-013) 시 결과 달라질 가능성.

#### 5.2 휴리스틱 Judge 순환 편향 (가장 핵심)

현재 100쌍·500쌍 라벨이 **휴리스틱 Judge** (profile field overlap %) 기반. 즉 *라벨러가 hard_skill 교집합, industry 일치 등 fusion과 동일 신호*로 채점.

- e5-small이 *profile schema concat 텍스트의 surface overlap*에 정합한 임베딩을 생성하면 → 휴리스틱 라벨과 우연히 일치하는 ranking 만들 가능성.
- KURE-v1/Qwen3는 *의미적 추상화*가 더 강해 surface overlap을 *덜* 따름 → 휴리스틱 라벨과 ranking 차이 발생 → NDCG 하락.

→ **순환 편향이 `docs/13_independent_eval.md`에서 확인됨** → 본 백본 ordering 신뢰 보류. 신뢰할 비교는 독립 라벨(인간 κ) 위에서 재측정 (Gemini Judge 트랙 폐기).

#### 5.3 차원 trade-off — *큰 차원이 항상 좋은 게 아님*

- e5-small: 384-dim
- KURE-v1/Qwen3/BGE-M3: 1024-dim
- 후보풀 N=10 (관점당 10명 user × 10 후보)에서 *고차원 임베딩의 nearest-neighbor 변별력*이 small-N에서 dilute됨.
- 풀데이터 235k JD 환경 (exp-009 v2)에서는 결과 다를 수 있음 — 큰 차원이 *진짜 효과*를 낼 가능성.

### 6. D 관점 Qwen3 우위 해석 — **이건 신호로 채택 가능**

Qwen3-Embedding-0.6B는 119언어 멀티링구얼 + LLM 기반 의미 추상화 → *산업 의미*(예: "반도체"·"화학" 카테고리)를 enum 매칭 너머의 의미 공간에서 잘 처리.

`docs/03_perspective_fusion_weight_design.md` §6 D 관점 노이즈 문제 (`docs/05_benchmark_100pairs_analysis.md` §3.4)에 대한 *임베딩 단에서의 해결책* 후보:
- **exp-009 후속 가설**: D 관점에서만 Qwen3 임베딩을 사용하고, A·B·C·E는 e5-small 유지하는 *관점별 백본 분기* 가능.
- 또는 D 관점 가중치(industry=0.55, `docs/06_perspective_matrix.md` D 세트)와 결합 — Qwen3 임베딩 + D 가중치가 두 신호로 D 관점 NDCG 추가 끌어올림.

### 7. 이전 대비

| 비교 기준 | 값 |
|---|---|
| S04 (raw + KR-SBERT baseline) NDCG@10 평균 | 0.908 |
| **S09** (best fusion, e5-small) | **0.966** |
| **S11** (KURE-v1, 2024-12) | 0.931 |
| **S12** (Qwen3-Embedding-0.6B, 2025-06) | 0.934 |
| **S13** (BGE-M3 dense, 2024-02) | 0.932 |
| **S15** (ko-sroberta-multitask, 2022) | 0.930 |
| **S09 vs S04** Δ | +0.058p (Cohen's d=-5.15, exp-014에서 측정) |
| **신규 4종 평균 vs S04** Δ | +0.023~0.026p |
| **신규 4종 평균 vs S09** Δ | -0.032~-0.036p |

→ 신규 백본도 *S04 baseline 대비 +0.02~0.03p 개선*은 함. 단 S09 vs S04 +0.058p에는 모두 못 미침. **신규 4종 사이 차이는 0.004p 이내** — 사실상 동률.

## 내 연구에의 적용

- **자기소개서 파이프라인:** 직접 영향 없음 — Gemini profile 추출은 동일 schema 유지.
- **JD 파이프라인:** 동일 — JD profile schema 동일.
- **Dual Encoder / 매칭:** ⚠️ **단일 백본 채택 보류**. e5-small을 production default로 유지하되, *D 관점 사용자에게는 Qwen3-Embedding-0.6B 백본 분기* 검토. 풀데이터 235k에서 재검증(exp-009 v2) 필요.
- **평가 프레임워크:** **휴리스틱 Judge 순환 편향이 본 결과의 1순위 위협** — `docs/13_independent_eval.md`에서 *확인됨*. 신뢰할 백본 비교는 독립 라벨(인간 κ) 위에서 (Gemini Judge 폐기).
- **데이터(Careermizing/JD 크롤링):** 영향 없음 — 동일 raw 데이터 사용.

## 한계 · 비판 · 모순

> ⚠️ 휴리스틱 Judge 라벨 위 측정의 한계
> 본 실험의 NDCG는 *휴리스틱 Judge가 매긴 0~4 라벨* 위에서 계산. 휴리스틱이 *profile field overlap*을 라벨링 기준으로 쓰는데, e5-small도 *profile concat 임베딩의 surface overlap*에 정합. 즉 라벨러와 모델이 *같은 surface 신호*를 사용한다는 순환 편향. **본 결과의 ordering이 진짜 의미적 매칭 quality를 반영하는지 확실하지 않음**. → exp-019/020에서 순환성 *확인됨* → 본 ordering 신뢰 보류, 독립 라벨로 재측정 필요.

> ⚠️ N=10 per perspective 한계 (exp-014 finding과 일관)
> 관점당 user 10명이라 모델 페어 차이가 통계 노이즈 범위 내일 수 있음 (exp-014 Wilcoxon 결과 paired weight 페어 모두 negligible effect size). S11~S15와 S09 차이도 *통계적 유의*가 아닐 수 있음. exp-008 N=30 후 재검정 우선.

> ⚠️ 1k JD 후보풀이 small-search 환경
> Top-K NDCG는 *후보 풀 크기*에 민감. 1k에서는 e5-small의 *조밀한 384-dim 공간*이 충분히 변별력 있을 수 있지만, 235k에서는 *고차원 1024-dim*이 진짜 효과를 낼 가능성. 풀데이터 exp-009 v2가 본 실험의 *진짜 검증*.

> ⚠️ Mac CPU 환경 - 모델당 실측 속도 차이
> Qwen3-Embedding-0.6B는 KURE-v1 대비 *CPU에서 약 50배 느림* (long-context 32k + LLM 기반 attention). 본 결과는 *정확도 측정*만 다루지만, *production 추론 비용* 관점에서는 e5-small + cosine+overlap이 압도적 우위. Production 채택 시 latency·비용 trade-off도 고려.

> ⚠️ S14 (Qwen3-4B) skip
> Qwen3-Embedding-4B (2560-dim, MTEB-Multi 70.58)는 CPU 메모리 부담으로 본 실험에서 skip. GPU 환경 확보 후 별도 실행 필요. 더 큰 모델이 *작은 모델보다 잘함*을 본 데이터에서 검증해야 함.

## 관련 페이지

- `docs/04_dual_encoder_roadmap.md` — exp-009 위치, §6 결과표
- `docs/05_benchmark_100pairs_analysis.md` — S09 baseline 측정 데이터
- `docs/03_perspective_fusion_weight_design.md` — D 관점 Qwen3 우위와 직접 연결
- `docs/06_perspective_matrix.md` — D 세트 가중치(industry=0.55)와의 결합 후속 검토
- `docs/08_wilcoxon_test.md` — 본 실험 결과 통계 검정 (effect size 보고 표준)
- `docs/09_ablation_6component.md` — fusion 6요소 ablation, 본 실험은 cosine 단일 교체
- KURE-v1 — S11 모델
- Qwen3-Embedding — S12 모델
- BGE-M3 — S13 모델
- Mira-Embeddings-V1 — 채용 도메인 fine-tune 필요성 시사

## 출처

- 코드: `output/exp-009-baseline-backbone-1k-comparison.ipynb`
- 분석 스크립트: `/tmp/exp009_compute_ndcg.py` (캐시된 임베딩으로 즉시 NDCG 계산, 백그라운드 노트북과 병행)
- 결과: `raw/experiments/exp-009-baseline-backbone-1k/{ndcg10_matrix.csv, ndcg5_matrix.csv, exp009_summary.json, comparison_vs_S09_ndcg10/5.csv}`
- 임베딩 캐시: `raw/experiments/exp-009-baseline-backbone-1k/embeddings/{S11/S12}_*.npz`
- 입력: `data/gemini_profile_outputs/{user_profiles.csv, jd_profiles_sample1000.csv, benchmark_labeled_100_*.csv, weighted_results.csv}`

## 메타

- 작성일: 2026-05-18
- 실행일: 2026-05-18 (S11/S12 완료, S13/S15 진행 중)
- 마지막 갱신: 2026-05-18 (부분 결과 ingest)
- 상태: 🟢 4종 모두 완료 (S11·S12·S13·S15). S14 Qwen3-4B는 GPU 환경 후속. v2 (풀데이터 235k) 후속.
- 다음 갱신 트리거: 독립 라벨(인간 κ 포함) 위 백본 재측정 (순환 편향은 exp-019/020에서 *확인됨*; Gemini Judge 트랙 폐기)
- 태그: #실험결과 #백본진화 #1k부분결과 #한국어임베딩 #순환편향가설