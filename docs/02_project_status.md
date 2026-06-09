# 프로젝트 진행 현황 — 8단계 진행 로그

> 내 연구 관점에서의 핵심 takeaway
> - **차별성 축:** 5축 전부의 *공통 추적 페이지*. 매 실험이 어느 단계에서 어느 축을 진전시키는지 한눈에 보이도록.
> - **무엇을 강화하는가:** 중간 보고서(`raw/experiments/중간_보고서_이상엽.pdf` §2 표 0)의 8단계 일정을 **살아 있는 로그**로 변환. 각 단계의 입력·산출물·실험 ID·다음 액션을 한 페이지에 누적. *새 실험을 진행할 때마다 어느 단계인지 표시*하는 룰을 §4에 명시.
> - **위협:** 살아 있는 페이지는 갱신되지 않으면 *마지막 갱신일이 늙어서* 신뢰도가 떨어진다. **매 실험 완료 후 §3에 한 줄 + §1 진행률 갱신을 룰화**.
> - **영향 부위:** 모든 실험 흐름의 *허브 페이지*. `docs/01_experiment_timeline.md`은 *완료된 과거*, `docs/03_perspective_fusion_weight_design.md`는 *최신 단일 결정*, 본 페이지는 *전체 일정 위치 + 진행 누적*.
> - **당장 가져갈 1개 액션:** 매 실험을 시작/완료할 때마다 §3 살아 있는 로그에 한 줄 추가 + §1 표의 진행률 갱신. *2주 이상 갱신 없으면 stale 경고*.

## 한 줄 요약

**2026-05-31 현재 위치: 단계 5 (중간 검증·기능 개선) 진행 중 ~70% / 단계 6 (평가 프레임워크 타당성) 진행 중**. 노선 = `docs/10_learnable_fusion_plan.md` (임의 가중치 → 학습 head, **LLM 호출 0건**). exp-017/018/019 실행 완료. **다음 마일스톤 = V2 임베딩 head(KURE-v1/Qwen3)** — exp-019에서 선형 컴포넌트 fusion의 한계가 독립 라벨로 확인됨. (※ Gemini Judge/Reranker 트랙은 2026-05-31 비용으로 폐기.)

---

## 1. 전체 일정 8단계 (중간보고 §2 표 0의 살아 있는 버전)

| #   | 단계                                       | 기간         | 진행 상태   | %        | 핵심 산출물                                                                                                                      |                                                                                           |
| --- | ---------------------------------------- | ---------- | ------- | -------- | --------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 1   | **문헌 조사 및 기술 현황 분석**                     | 2026-03    | ✅ 완료    | **100%** | 연구 배경 문서 §6 4세대 PJF + 5세대 (2025-2026) 추가; 9+5개 페이퍼 ingest                                                 |                                                                                           |
| 2   | **데이터 EDA 및 JD 크롤링, 합성 데이터 생성**          | 2026-03    | ✅ 완료    | **100%** | raw-user-data-EDA (999명·11,986행), raw-company-jobdescription-EDA (235k JD), `data/data_build_plan.md` |                                                                                           |
| 3   | **역량 추출 파이프라인 구현** (자기소개서 + JD)          | 2026-04    | ✅ 완료    | **100%** | STAR 5컬럼 + ability 3슬롯 (user_data 동봉), JD profile schema (Φ4 노트북)                                                           |                                                                                           |
| 4   | **Dual Encoder 매칭 시스템 구현 및 Baseline 비교** | 2026-04~05 | ✅ 완료    | **100%** | Φ3  baseline_faiss_matching.ipynb; Φ4 gemini_profile + Model A/B/C; Φ5 10 setup × 5관점 = 50셀 |
| 5   | **중간 검증 및 기능 개선**                        | 2026-05    | 🟡 진행 중 | **50%**  | 5관점 분리 평가 완료. **`docs/03_perspective_fusion_weight_design.md` v0 설계안 작성 완료**. 25셀 매트릭스 측정 대기                                             |                                                                                           |
| 6   | **합성 Ground Truth 구성 및 평가 프레임워크 타당성 검증** | 2026-05    | ⚪ 대기    | **0%**   | 라벨=LLM 직접 채점(exp-019/020) / 인간 κ(future) / 순환성 진단·완화 (Gemini Judge 폐기)                                                                            |                                                                                           |
| 7   | **최종 성능 검증 및 통계 분석**                     | 2026-06    | ⚪ 대기    | **0%**   | Wilcoxon 부호순위 검정 (p < 0.05), KURE-v1·BGE-M3·Qwen3 백본 추가                                                                     |                                                                                           |
| 8   | **최종 발표 및 논문 작성**                        | 2026-06    | ⚪ 대기    | **0%**   | 캡스톤 디자인 최종 발표 + 논문 draft                                                                                                    |                                                                                           |

**진행 요약:** 1·2·3·4 완료 (50%) / 5 진행 중 / 6·7·8 대기.

---

## 2. 단계별 상세 — 입력·산출물·다음 액션

### 단계 1. 문헌 조사 및 기술 현황 분석 ✅

**완료된 작업:**
- PJF 4세대(CNN/RNN → BERT+그래프 → 대조학습 → LLM) 흐름 정리
- 국내 채용 매칭 연구 및 정부 R&D 보고서 조사
- 5세대 (2025-2026) 보강: ConFit-v3, JobRec-Dual-Perspective, Mira-Embeddings-V1
- 5관점 학술 토대: JobRec-Dual-Perspective (dual-perspective), MURAL (multi-aspect)
- Retriever 패러다임: ColBERT, BGE-M3, KURE-v1, Qwen3-Embedding
- Reranker 패러다임: RankZephyr, IRPO
- 평가 표준: MTEB, MMTEB, BEIR

**산출물:** `raw/papers/` 14개 파일 + `docs/` 14개 해석 페이지 + 연구 배경 문서 §6 갱신

### 단계 2. 데이터 EDA 및 JD 크롤링, 합성 데이터 생성 ✅

**완료된 작업:**
- Careermizing 실데이터 ~300행 EDA
- 합성 페르소나 1,000명 + 자기소개서 생성 (GPT-4.1, `data/data_build_plan.md` 2026-03-29 기반)
- JD 크롤링 235,850건·52,243 기업

**산출물:**
- `data/user_data.csv` (53MB, 11,986행·45컬럼)
- `data/company_jobdescription.csv` (370MB, 235,850행·8컬럼)
- raw-user-data-EDA / raw-company-jobdescription-EDA

**미해결:** Q-D1 (JD 출처 사람인/잡코리아 아닐 가능성), Q-D4 (PAF 확장 여부) — 미해결 질문 목록 참조

### 단계 3. 역량 추출 파이프라인 구현 ✅

**완료된 작업:**
- 자소서 → STAR 분해 + 다차원 역량 (합성 데이터에 동봉됨)
- JD 측 역량 추출 병행 구현 (Φ4 노트북 `JD_PROFILE_SCHEMA`)
- 역량 추출 일관성 측정 (동일 입력 5회 반복 BGE-M3 cos)
- LLM-as-a-Judge 기반 추출 품질 평가 1차

**산출물:**
- user_data.csv `Situation/Task/Action/Reason/Result/ability_{0,1,2}_*` 컬럼
- `data/gemini_cache/{user_profile, jd_profile}/` 1,998 + 2,000 JSON

**미해결:** Q-D2 (12 ability_keyword ↔ 6차원 매핑)

### 단계 4. Dual Encoder 매칭 시스템 구현 및 Baseline 비교 ✅

**완료된 작업 (Φ3·Φ4·Φ5):**
- **Φ3:** `data/baseline_faiss_matching.ipynb` — KR-SBERT 단일, 1k×1k, GT 없이 정성 검증 (P0950 오매칭 사례)
- **Φ4:** `data/gemini_profile_faiss_matching.ipynb` — Gemini structured profile, Baseline A / Model B / Model C, 100쌍 휴리스틱 Judge 벤치마크 (Model C NDCG@5=0.805로 +0.38p)
- **Φ5:** 동일 100쌍을 5관점(A/B/C/D/E)으로 재라벨 = 500쌍, 10 setup × 5관점 = 50셀. **S09(profile+e5-small+overlap) 평균 NDCG@5=0.925, 5관점 중 4관점 1위, D 관점만 S07로 역전**
- 중간 검증으로 변경 요인 효과 크기 분석 (fusion +0.054~+0.096 > 임베딩 교체 ~0.04~0.07 > 전처리 +0.004~+0.041)

**산출물:**
- `docs/01_experiment_timeline.md` (Φ0~Φ5 종합)
- `data/gemini_profile_outputs/` 12개 CSV (exp_setups, exp_results_NDCG5/10, MRR10, Recall5, benchmark_pairs_100, benchmark_labeled_100_{A..E})

### 단계 5. 중간 검증 및 기능 개선 🟡 (50%)

**완료된 작업:**
- 5관점별 1위 모델 비교 + D 관점 예외 원인 분석 (fusion이 D에서 노이즈로 작용)
- 변경 요인별 효과 크기 분석
- **🟢 `docs/03_perspective_fusion_weight_design.md` v0 설계안 작성** — Model C 단일 가중치를 5세트(A·B·C·D·E)로 분기. 시그니처 가중치: A role_semantic=0.50 / B achievement=0.35 / C hard_skill=0.45 / D industry=0.55 / E 균등

**진행 중 / 다음 액션:**
- **25셀 매트릭스 측정** — 5세트 가중치 × 5관점 라벨 = 25셀 NDCG@10. *관점 i × 가중치 i 대각선*이 1위가 되는지 검증. **특히 D 관점에서 industry=0.55가 NDCG@5 ≥ 0.882(S07 단일 가중치 D 1위) 통과하는지 확인**
- 단일 vs 분기 NDCG 차이의 Wilcoxon 검정 (per-query 페어)

**다음 단계 진입 조건:** 25셀 매트릭스 측정 완료 → 단계 6 진입

### 단계 6. 합성 GT 구성 및 평가 프레임워크 타당성 검증 ⚪

**예정 작업 (2026-05-31 갱신 — Gemini Judge 트랙 폐기 반영):**
1. **라벨링 = LLM 직접 채점** (Gemini Judge 폐기). 휴리스틱 라벨의 순환 편향은 `docs/13_independent_eval.md`에서 독립 라벨로 *진단·완화* 확인 (learned≈arbitrary로 가짜 우위 노출)
2. **인간 라벨 일부 + Cohen's κ** — 순환성 완전 탈출(현재 1순위 평가 과제)
3. **N 확장** — 독립 라벨 N=12→200+로 통계 검정력 보강
4. context 자질: D 관점 placeholder는 산업과 중복이라 **competency로 대체**(exp-018), 별도 구현 불필요

**다음 단계 진입 조건:** LLM 독립 라벨 + 인간 κ로 5관점 라벨 신뢰도 검증 완료

### 단계 7. 최종 성능 검증 및 통계 분석 ⚪

> ⚠️ 2026-05-28 노선 변경
> Stage 2 LLM Reranker 항목(종전 #3)은 보류. 매칭 최종 랭킹은 **embedding model + FAISS 단독 + multi-perspective fusion**으로 진행. 자세한 사유는 연구 배경 문서 §4.2 참조.

**예정 작업 (2026-05-28 갱신):**
1. **관점별 fusion 가중치 grid search** (D 관점 grid가 1순위 — industry 0.30~0.60 5단계)
2. **★ 백본/임베딩 모델 비교 (트랙 ② 핵심):** KURE-v1 (S11), Qwen3-Embedding-0.6B/4B (S12), BGE-M3 (S13) — **"나만의 매칭 모델"의 본체**
3. ~~Stage 2 reranker 도입~~ → **보류 (2026-05-28).** Future work로 격하
4. **(옵션) 임베딩 모델 자체 fine-tuning** — Mira-Embeddings-V1 LoRA 패턴 차용 가능. 단 학습 부담 큼
5. **Wilcoxon 부호순위 검정** — 제안 시스템 vs Baseline 통계적 유의성 (p < 0.05)
6. **Ablation Study** — 역량 차원별 단일 제거 실험, 첨삭 전·후 개정 쌍(18 workspace) 방향성 타당성 검증

### 단계 8. 최종 발표 및 논문 작성 ⚪

**예정 작업:**
- 캡스톤 디자인 최종 발표 (6월)
- 논문 draft (영문 또는 국문)
- 5세대 PJF 흐름에서 본 연구의 위치 명시 (연구 배경 문서 §6.1)

---

## 3. 살아 있는 실험 로그 (exp-NNN — 새 실험마다 한 줄 추가)

> 추가 룰
> 새 실험을 시작/완료할 때마다 이 표에 한 줄 추가. 형식 고정.

| Exp ID | 단계 | 날짜 | 실험명 / 노트북 | 결과 한 줄 | 분석 wiki |
|---|---|---|---|---|---|
| exp-001 | 4 | 2026-04 후반 | `data/baseline_faiss_matching.ipynb` (KR-SBERT 단일, 1k×1k) | P0950 보건환경→CS/CX 오매칭. GT 없어 정성만 | `docs/01_experiment_timeline.md` Φ3 |
| exp-002 | 4 | 2026-04~05 초 | `data/gemini_profile_faiss_matching.ipynb` (Gemini structured, Model A/B/C, 100쌍 휴리스틱 Judge) | Model C NDCG@5=0.805 (+0.38p vs Baseline A). Spearman 음→양 부호 회복 | `docs/01_experiment_timeline.md` Φ4 |
| exp-003 | 4·5 | 2026-05-11 | 10 setup × 5관점 = 50셀 평가 (`exp_results_*.csv`) | **S09 평균 NDCG@5=0.925**, 5관점 중 4관점 1위. D 관점만 S07=0.882로 역전 | `docs/01_experiment_timeline.md` Φ5 |
| exp-003.5 | 4·5 | 2026-05-17 | gemini_profile_outputs CSV 직접 분석 (단위·구성·결과 정밀화) | **★ 5관점이 동일 100쌍 재라벨이 아닌 49명 user의 독립 500쌍** 발견. 단일 rel 평균 1.45 vs 5관점 2.1~2.9 비교 불가 | `docs/05_benchmark_100pairs_analysis.md` |
| exp-004 | 5 | 2026-05-17 | `docs/03_perspective_fusion_weight_design.md` v0 설계 (5세트 가중치 A·B·C·D·E) | 설계안만 — 측정 전. 시그니처: A role=0.50, B ach=0.35, C skill=0.45, D ind=0.55 | `docs/03_perspective_fusion_weight_design.md` |
| **exp-005** | **4·5** | **2026-05-17** | **★ Gemini Profile baseline 전체 데이터 재실행** (`modeling/01_baseline_full_data.ipynb`) — user 999명 전체 + JD 235,850 전체. raw 원본 `gemini_profile_faiss_matching.ipynb`를 복사하고 *JD 샘플링만 1k → 235,850으로* 변경 | 노트북 작성 완료, **실행 대기** (Gemini 비용 검토 후 heuristic_fallback으로 우선 실행) |  |
| **exp-006** | **5** | **(예정)** | **25셀 매트릭스 측정** (5세트 가중치 × 5관점 라벨, exp-004 v0 검증) | (대기) | (대기) |
| ~~exp-007~~ | 6 | ❌ 폐기(2026-05-31) | ~~Gemini Judge~~ → LLM 직접 채점(exp-019/020) | — | — |
| exp-008 | 6 | (예정) | N=30 확장 (관점당 300쌍 = 총 1,500쌍) | (대기) | (대기) |
| exp-009 | 7 | (예정) | KURE-v1 / Qwen3-Embedding-0.6B / BGE-M3 추가 (S11·S12·S13) | (대기) | (대기) |
| exp-010 | 7 | (예정) | Stage 2 reranker 도입 (RankZephyr-Gemini or Qwen3-Reranker) | (대기) | (대기) |
| exp-011 | 7 | (예정) | Wilcoxon 부호순위 검정 | (대기) | (대기) |

> 아래는 `docs/10_learnable_fusion_plan.md` (2026-05-31, output/ 노트북 번호 기준). 위 exp-005~011은 구 dual-encoder 로드맵 번호로 일부 미실행·폐기(Gemini 트랙).

| Exp ID | 단계 | 날짜 | 실험명 / 노트북 | 결과 한 줄 | 분석 wiki |
|---|---|---|---|---|---|
| **exp-017** | 5 | 2026-05-31 | 검증셋 500쌍 황금 가중치 그리드 (`output/exp-017-validation-grid-search.ipynb`) | **NDCG@10=1.0 천장** — 임의·황금 동률. 후보 ~10개라 변별력 없음 → 풀 확장 필요 | `docs/11_grid_search.md` |
| **exp-018** | 5 | 2026-05-31 | 학습 fusion head V1 (`output/exp-018-learnable-fusion-head.ipynb`) — 999명×3,000 JD, LLM graded 라벨 | 3,000 풀 de-saturated: 임의 0.936 < 황금 0.998 ≈ 학습 0.996. cosine 5/5≥0.8 | `docs/12_learnable_fusion_head.md` |
| **exp-019** | 5·6 | 2026-05-31 | ★ LLM 독립 라벨 검증 (`output/exp-019-independent-llm-eval.ipynb`) — 60쌍 직접 채점 | **learned 0.906 ≈ arbitrary 0.917**(순환성 상쇄). role_match ρ=0.62 최강 / competency ρ=0.15 최약 | `docs/13_independent_eval.md` |

---

## 5. 다음 마일스톤 (2026-05-31 갱신, 우선순위 순)

> 노선 = `docs/10_learnable_fusion_plan.md`. exp-017~020 완료. 구 dual-encoder 로드맵(exp-005~016)의 Gemini Judge·LLM reranker 트랙은 **폐기**(비용). LLM은 전처리·평가 라벨링에만, 매칭은 자체 임베딩+fusion.

### 5.1 ✅ 현재까지 검증된 것 (한 것)
- 5관점 평가틀(exp-006) · Wilcoxon 방법론(exp-014) · 6요소 ablation(exp-015)
- 황금 가중치 그리드 → **NDCG@10 천장 발견**(exp-017)
- 학습 fusion head V1(exp-018) → 규칙 라벨에선 우세처럼 보임
- **LLM 독립 라벨 + 통계검정(exp-019/020) → 학습 가중치 우위 *미재현*(순환성 확인), role_match 최강·competency 최약**
- ★ 핵심 자산 = **GT부재 평가 방법론**(multi-perspective + saturation·circularity 진단)

### 5.2 ❌ 아직 확인 못한 것 (미입증/Null)
- 학습 가중치 > 임의 가중치: **미재현**(exp-020) — 선형 가중치 재조정의 한계
- 자소서 정성(STAR)의 매칭 추가가치: 약함(star ρ=0.25) · 양방향 매칭(③): 미실험 · 인간 평가자 κ: 미측정 · "진짜 모델 학습"(임베딩 head): 미구현

### 5.3 🎯 할 것 (우선순위)
| 순위 | 액션 | 차별성 | 예상 | 블로커 |
|---|---|---|---|---|
| **1** | **V2: 임베딩 head 학습** (KURE-v1/Qwen3 + Linear, `[user_emb ⊕ jd_emb ⊕ 5comp]`) — 성능의 유일 레버 + 첫 '진짜 모델 학습' | ①②⑤ | 1~2주 | 3,000 JD+999 user 임베딩 사전계산(로컬 캐시 OK) |
| **2** | **인간 라벨 일부 + Cohen's κ** — 순환성 완전 탈출, 평가 신뢰도 | ④ | 1주 | 라벨링 시간 |
| 3 | 하이브리드 검색(dense+sparse, 235k 풀) | retrieval | 2주 | BGE-M3 sparse |
| 4 | 양방향 매칭(개정쌍 18 workspace) — 미입증 ③ | ③ | 1주 | 개정쌍 데이터 위치 |
| 5 | V3: 관점 분기 head(비선형이 도움 되는지) | ⑤ | 1주 | V2 선행 |
| 6 | Q-D1 JD 출처 확정 | 메타 | - | 사용자 입력 |
| 7 | 논문: **(A) 방법론 논문 — 지금 가능**(④ GT부재 평가) / (B) 성능 논문 — V2 후 | 8 | 6월 | A 즉시 / B는 V2 선행 |

---

## 6. 위험 요소 · 블로커

| # | 위험 | 영향 | 대응 |
|---|---|---|---|
| R1 | **순환 편향** — 자체(규칙/LLM) 라벨로 학습·평가 시 가짜 우위 발생 (exp-019/020에서 확인: learned≈arbitrary) | 학습 head 결과 신뢰도 | LLM 독립 라벨로 진단·완화 + 인간 κ(future) |
| R2 | **표본 크기 100쌍/관점** — NDCG@5 0.01~0.03 차이는 표본 변동 안 (PDF §7.1) | 단계 5 결론의 통계적 의미 | exp-007 (N=30 = 1,500쌍 확장) |
| R3 | **JD 출처 불확정** — 사람인/잡코리아 가정 vs 링커리어 추정 (Q-D1) | 단계 2 데이터 정당성 + 논문 §데이터 | 사용자 출처 확정 (단계 8 전) |
| R4 | **User vs JD 도메인 비대칭** — user 측 대기업 157개 vs JD 측 중소기업 52k 중 58.7% 1회성 (Q-D3) | 차별성 ① 중소기업 검증 | exp-008과 묶어 *기업 규모 분리 평가* |
| R5 | **draftContent 길이 부족** — 계획 700~1,200자 vs 실제 평균 573자 (raw-user-data-EDA Q2) | 자소서 신호 부족으로 매칭 약화 | 길이 변수로 통제 / B Resume-Centric 관점 측정 |
| R6 | **KR-SBERT 5년 격차** — 한국어 SOTA(KURE-v1/Qwen3-Embedding/BGE-M3) 미반영 | 단계 7 백본 비교 우선순위 | exp-009 (백본 추가) |
| R7 | **6월 발표 일정 압축** — 단계 6·7·8을 약 5주에 처리 | 일정 리스크 | exp-005~007을 5월 내 완료, exp-009를 5월 말~6월 초 |
| **R8** | **★ 1-stage 노선 차별화 리스크 (2026-05-28 신설)** — 5세대 PJF 표준이 2-stage(retrieval + LLM reranker)인데 본 연구는 *의도적으로* Stage 2 LLM reranker 미채택. 심사·논문 reviewer가 "왜 reranker 안 썼나"로 공격 가능 | 차별성 ⑤ 정당화 강도 / 논문 §방법론 | (a) 연구 배경 문서 §6.1에서 *역방향 contribution*으로 명시 (b) 비교 baseline용 exp-011/012를 *future work*로 명시 (c) 1-stage 시스템이 multi-perspective fusion으로 충분히 성능을 확보한다는 정량 증거(exp-009 결과)로 정당화 |

---

## 7. 단계와 차별성 5축 매핑 (각 실험이 어떤 축을 진전시키는가)

| 단계 | 진전시키는 5축 |
|---|---|
| 1 | 5축 정의 자체 (메타) |
| 2 | ① 자소서 정성, ② 한국어 |
| 3 | ① 자소서 정성, ⑤ End-to-End LLM (Gemini schema) |
| 4 | ③ 양방향 매칭(부분 — 단방향 검증), ⑤ End-to-End |
| **5** | **③ 양방향 + ④ GT 부재** (5관점 분리 = GT 가정 거부) |
| 6 | **④ GT 부재** (LLM 직접 채점 + 순환성 진단 exp-019/020, 인간 κ) |
| 7 | **②·⑤** (백본 다양화 + reranker 도입) |
| 8 | 5축 전체 정리 (논문) |

---

## 관련 페이지

- `docs/01_experiment_timeline.md` — Φ0~Φ5 시간순 종합 (단계 1~4 상세)
- `docs/03_perspective_fusion_weight_design.md` — ★ 단계 5의 최신 결정안
- 연구 배경 문서 — 5축 정의 + 4·5세대 PJF
- 미해결 질문 목록 — Q-001~006 + Q-D1~D10
- raw-user-data-EDA / raw-company-jobdescription-EDA — 단계 2 산출물
- MTEB / BEIR — 평가 메트릭 표준 (단계 6·7)
- KURE-v1 / Qwen3-Embedding / BGE-M3 — 단계 7 백본 후보
- RankZephyr / Mira-Embeddings-V1 / ConFit-v3 — 단계 7 reranker 후보

## 출처

- `raw/experiments/중간_보고서_이상엽.pdf` §2 표 0 (전체 일정 8단계 원본)
- `raw/experiments/중간_보고서_이상엽.pdf` §2.1·§2.2·§2.3 (완료·진행 중·다음 단계)
- `raw/experiments/중간_보고서_이상엽.pdf` §7 한계, §8 다음 액션 — §5·§6에 흡수
- `docs/01_experiment_timeline.md` — 단계 4 상세
- `docs/03_perspective_fusion_weight_design.md` — 단계 5 최신

## 메타

- 작성일: **2026-05-17**
- 마지막 갱신: **2026-05-31** — ★ learnable fusion 트랙 ⑧ 실행 ingest: §3에 exp-017/018/019 추가, §1 현재 위치 갱신(learnable fusion 노선·V2 다음), Gemini Judge/Reranker 트랙 폐기 반영. 다음=V2 임베딩 head.
- 이전 갱신: 2026-05-28 (Stage 2 reranker 보류), 2026-05-17
- ⚠️ §3 exp-005~011 구번호는 dual-encoder 로드맵 잔재 — output/ 실제 노트북(exp-017/018/019)과 별개. 차기 health check에서 정리 후보.
- 다음 갱신 예정 트리거: exp-005 측정 완료 시 / exp-009 임베딩 비교 결과 / 단계 5 → 6 진입 시 / 2주 경과 시 (stale 방지)
- 상태: 🟢 활성 — 살아 있는 페이지 (1-stage embedding 노선)
- 태그: #진행현황 #프로젝트일정 #살아있는로그 #중간보고서ingest #1stage노선