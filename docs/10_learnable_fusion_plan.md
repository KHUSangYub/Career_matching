# Learnable Fusion 실험 계획 — 교수님 노선(2026-05-29, 갱신 2026-05-31)

> 내 연구 관점에서의 핵심 takeaway
> - **차별성 축:** ② 한국어(KURE-v1/Qwen3-Embedding 백본 위 head), ④ GT 부재(100쌍 = 고정 검증셋), ⑤ End-to-End LLM(재정의 — *매칭 head는 자체 학습*)
> - **무엇을 강화/위협:** 5관점 가중치(A/B/C/D/E)의 `role 0.6 / skill 0.3 / industry 0.1` 류는 **임의값**. 100쌍 = 고정 검증셋 + 학습 가능한 head로 *grid search → 자동 학습* 전환
> - **위협:** 100쌍 검증셋에 head가 과적합 → 학습/검증 split 분리 필수. λ 붕괴(음수/0) 시 simplex/softmax 제약 필요
> - **영향 부위:** Fusion 가중치 정의 / 평가 프레임워크 / 학습 데이터 라벨링 규칙
> - **당장 가져갈 1개 액션:** exp-017(검증셋 + 황금 가중치 그리드) → exp-018(학습 head V1/V2/V3) 2단계로 종료

## 한 줄 요약

지금 5관점 가중치는 직관으로 정한 **임의값**. (1) 기존 100쌍 × 5관점 = **500쌍 검증셋 고정**, (2) `user_data.csv` 11,986 자소서 × `company_jobdescription_enriched.partial.csv` 3,000 JD = **이미 enriched된 학습 페어**를 그대로 사용, (3) 백본 위에 **Linear / LR head**를 얹어 λ 자동 학습. **별도 합성 데이터·LLM 호출 없음**.

---

## 1. 변경 이력 (2026-05-31 갱신)

> ⚠️ 2026-05-31 — 합성 데이터 트랙(구 exp-017/018) 폐기
> - **사용자 결정:** *"데이터는 다 만들어놔서 합성 데이터 안만들어도 됨. 이미 자소서 합성 데이터가 user_data.csv / company_jobdescription_enriched.partial.csv 이렇게 있어."*
> - **결과:** 구 exp-017(Gemini 페르소나 추출) / 구 exp-018(Gemini STAR 자소서 합성) **모두 폐기**. 더 이상 LLM API 호출 없음.
> - **데이터 구성 재정의:** 학습 = `user_data.csv` 11,986 자소서 × `jd_enriched` 3,000 JD 페어. 검증 = 기존 100쌍 × 5관점 = 500쌍.
> - **번호 재정렬:** 구 exp-019 → **exp-017**(검증셋 + 황금 가중치 그리드). 구 exp-020 → **exp-018**(학습 가능한 fusion head). 본 페이지의 모든 후속 exp 번호는 이 정의.
> - 모리: project-final-datasets · feedback-no-llm-reranker 정합.

> 2026-05-31 — exp-017/018/019 실행 완료 (노트북 + 결과)
> - **`docs/11_grid_search.md`**: 500쌍 검증셋에서 임의·황금 가중치 모두 NDCG@10 = **1.0 천장**. user당 후보 ~10개라 변별력 없음 → 풀 확장 필요.
> - **`docs/12_learnable_fusion_head.md`**: 3,000 JD 전체 풀 + LLM graded 라벨. de-saturated 평가에서 임의 0.936 < 황금 0.998 ≈ 학습(V1 선형) 0.996. 학습 λ vs 황금 λ cosine 5/5 ≥ 0.8.
> - **`docs/13_independent_eval.md`**: ★ LLM가 텍스트 직접 읽은 독립 라벨로 재평가 → learned(0.906) ≈ arbitrary(0.917), **순환성으로 exp-018 우위 상쇄**. role_match(ρ=0.62) 최강 / competency(ρ=0.15) 최약. → **선형 V1 한계 확인, V2 임베딩이 다음 1순위.**
> - **`docs/14_independent_eval_stats.md`**: N=12·120쌍 + Wilcoxon/부트스트랩/Cohen's d → **우위 미재현 통계 확정**(p≈0.95, d≈0, 95%CI 0포함). "학습 가중치 > 임의 가중치"는 논문에 못 씀.

## 2. 문제 의식 — 지금의 5관점 가중치는 *임의값*이다

`docs/03_perspective_fusion_weight_design.md` §5세트 분기에서 우리는 5관점에 다음 가중치를 *직관*으로 부여했다:

| 코드 | 이름 | 한 줄 시나리오 | 채점 가중치 (현재 — 임의) |
|---|---|---|---|
| A | Job-Centric | 희망 직무가 맞는 공고가 좋다 | `role 0.6 / skill 0.3 / industry 0.1` |
| B | Resume-Centric | 자기소개서 경험과 가까운 공고가 좋다 | `star 0.5 / skill 0.3 / role 0.2` |
| C | Skill-Centric | 기술 스택이 정확히 맞는 공고가 좋다 | `skill 0.7 / role 0.2 / industry 0.1` |
| D | Context-Fit | 산업·근무지가 맞는 것이 우선 | `industry 0.5 / role 0.2 / context 0.3` |
| E | Mixed/Default | 균형 추천 | 모든 필드 균등 |

**문제 3가지:**
1. `0.6 / 0.3 / 0.1` 같은 값은 *도메인 직관* 기반일 뿐, NDCG@10 최대화 보장 없음.
2. `docs/06_perspective_matrix.md` 결과 — 분기 평균 NDCG@10 = 0.9560 vs SINGLE = 0.9513 (**+0.0047p**). 효과가 작아 *현재 가중치가 진짜 최적인지* 의심.
3. 5관점 × 6요소 = **30차원 hyperparameter**. 사람이 손으로 튜닝할 영역이 아님.

→ **임의 가중치를 데이터 기반 최적화로 대체한다.**

---

## 3. 교수님 노선 (2026-05-29) — 3가지 변화

### 3.1 데이터셋 구조 재정의 — 100쌍 = 고정 검증셋

> 검증셋 정의 (2026-05-29 사용자 결정)
> `docs/05_benchmark_100pairs_analysis.md` = **validation set으로 영구 고정**. 학습은 user_data×JD 페어, 가중치 선택·early stopping·hyperparameter 결정은 모두 이 500쌍의 NDCG@10 기준.

- "황금 가중치(Golden Weights)" = **검증셋에서 NDCG@10을 최대화하는 가중치**.
- 임의 가중치 vs 황금 가중치의 NDCG@10 차이 = *임의 가중치의 한계량*.
- exp-017에서 이 격차를 정량화.

### 3.2 학습 데이터 = 이미 있는 두 파일 (★ 2026-05-31 노선 확정)

> 합성 불필요 — 기존 데이터가 곧 학습 데이터
> - `user_data.csv`: 11,986 자소서 행(999 unique userId), STAR(Situation/Task/Action/Reason/Result) + ability_0~2_keyword/name/definition/reason + interestedJobs/Industries 정형 컬럼이 **이미 enriched** 상태.
> - `company_jobdescription_enriched.partial.csv`: 3,000 JD, `jd_job_role/jd_required_skills/jd_competencies` 등 17개 jd_* 컬럼이 **이미 Gemini enriched** 완료.
> - → **추가 LLM 호출 없음.** 두 파일 페어를 그대로 학습 데이터로 사용.

**학습 페어 라벨링 규칙 (LLM 불사용, 자동 규칙):**
- `Positive`: `user.interestedJobs_{1,2,3}` ∩ `JD.jd_job_role / jd_job_role_secondary` 교집합 ≥ 1
- `Hard-negative`: 동일 산업이나 직무는 다른 JD (interestedIndustries는 일치, interestedJobs는 불일치)
- `Easy-negative`: 직무·산업 모두 불일치 JD (랜덤 샘플)
- 페어 규모: 자소서당 positive 5 + hard-neg 5 + easy-neg 5 = 15페어 → 약 **180k 학습 페어** (11,986 × 15)
- *옵션 B (pseudo-supervision)*: 6 컴포넌트 score(Model C 산출값) 자체를 정답 점수로 두고 회귀 — LLM 라벨 없이 가중치만 학습

### 3.3 가중치 = 학습 가능한 파라미터

> 노선 전환 (hyperparameter → learnable)
> λ₁, λ₂ … 를 **그리드 탐색이 아니라 모델 출력**으로. 백본(KURE-v1 / Qwen3-Embedding-0.6B / BGE-M3) 위에 **Linear Layer / Logistic Regression head**를 얹어 자동 밸런싱.

feedback-no-llm-reranker §"임베딩 모델 자체 fine-tuning ✅ 사용 가능"과 정합. 매칭 단계에 LLM 안 끼움 → 임베딩 + 작은 학습 head. research-context §7 F6(LLM reranker로 회귀) 함정 회피.

---

## 4. 실험 2건 (exp-017, exp-018) — 본 노선 핵심

각 실험은 실험-결과-기록-템플릿을 따른다. 메인 메트릭 = **NDCG@10** (검증셋 500쌍 기준), 보조 = NDCG@5 / Recall@5 / MRR@10.

### exp-017 — 검증셋 고정 + 황금 가중치 그리드 서치 (baseline)

| 항목 | 내용 |
|---|---|
| **트랙** | ⑤ 평가 신뢰도 + ⑧ 학습 fusion (신설) |
| **노트북** | `output/exp-017-validation-grid-search.ipynb` (예정) |
| **입력** | exp-006의 `benchmark_labeled_100_{A,B,C,D,E}` (5관점 × 100쌍 = **500쌍 검증셋**) |
| **모델** | 가중치 학습 X, 그리드 서치만. 6 컴포넌트 score(`role_semantic`, `hard_skill`, `competency`, `achievement`, `industry`, `quality_adjustment`)는 Model C 산출값 재사용 |
| **절차** | (1) 6차원 simplex 가중치 그리드 (해상도 0.05, sum=1 → 약 1.5k point) (2) 관점별 NDCG@10 최대 가중치 = **황금 가중치** (3) 임의 가중치(A/B/C/D/E 표) vs 황금 가중치 NDCG@10 비교 (4) 가중치 5세트의 *상호 일반화* 매트릭스(25셀)를 exp-006과 동일 포맷으로 재산출 |
| **가설** | 황금 가중치는 현재 임의 가중치 대비 NDCG@10 평균 +0.02p ↑. 가장 큰 격차는 **C(Skill-Centric)**·**D(Context-Fit)** 관점에서 발생 (현재 0.7·0.5 같은 극단값이 데이터와 정합하지 않을 가능성) |
| **메트릭** | 관점별 NDCG@10 / NDCG@5 / Recall@5 / MRR@10 + 황금 가중치 5개의 6차원 분포 시각화 (heatmap) |
| **성공 기준** | (a) 황금 가중치가 임의 가중치보다 평균 NDCG@10 ≥ +0.02p (b) 5관점 중 ≥3관점에서 황금 가중치 ≠ 임의 가중치 |
| **위험** | grid 해상도(0.05) 한계 / 검증셋이 황금 가중치를 결정하면 *test == val*이 됨 → exp-018에서는 별도 dev split 필요 |
| **LLM 호출** | ❌ 없음 |

### exp-018 — 학습 가능한 fusion head (V1: LR, V2: BERT+Linear, V3: 5관점 분기)

| 항목 | 내용 |
|---|---|
| **트랙** | ⑧ 학습 fusion |
| **노트북** | `output/exp-018-learnable-fusion-head.ipynb` (예정) |
| **입력** | **학습**: §3.2 자동 규칙 라벨링 학습 페어 약 180k (train 80% / dev 20%, userId 기준 split). **검증**: exp-017 500쌍 (final test, 학습 중 미접근) |
| **모델 V1 — Logistic Regression** | 입력: 6 컴포넌트 score + 관점 one-hot(5) = 11차원 → LR → 적합 확률. 학습 가능 weight = λ₁…λ₁₁. 빠르고 해석 가능 |
| **모델 V2 — BERT + Linear head** | 백본: KURE-v1 또는 Qwen3-Embedding-0.6B (frozen 또는 마지막 2 layer만 unfreeze). 입력: `[user_emb ⊕ jd_emb ⊕ 6 컴포넌트 score]` → Linear(2×dim+6 → 1) → score |
| **모델 V3 — 5관점 분기 head** | V2 + 관점 ID one-hot 추가 OR 관점별 head 5개(공통 백본). 관점 자동 라우팅 가능성 검토 |
| **학습 objective** | (a) Pairwise margin loss (positive > hard-negative + margin) (b) MSE on pseudo-relevance(Model C score) — LLM 라벨 없이 회귀 (c) Cross-entropy on binary positive/negative |
| **절차** | (1) V1 LR baseline 확보(빠른 sanity check) (2) V2 학습 (3 epoch, AdamW, lr=1e-5 백본 / 1e-3 head) (3) V3 분기 → 관점별 head 비교 (4) early stopping = dev split NDCG@10 (5) **최종 평가만** 500쌍 검증셋에서 |
| **가설** | V2 NDCG@10 ≥ exp-017 황금 가중치 NDCG@10 (= grid search를 학습 head가 따라잡거나 능가) |
| **메트릭** | 관점별 NDCG@10 + 학습된 λ 분포(임의 가중치·황금 가중치와 비교) + 학습 시간·VRAM |
| **성공 기준** | V2 또는 V3 평균 NDCG@10 ≥ exp-017 황금 가중치 + 학습된 λ가 황금 가중치와 cosine ≥ 0.8 (해석 가능성) |
| **위험** | (a) 자동 규칙 라벨링이 정성 매칭 신호를 못 잡음 → exp-006 휴리스틱 라벨 추가 검토 (b) λ 붕괴(0/음수) → softmax 또는 simplex projection (c) 백본 unfreeze 시 catastrophic forgetting → frozen 우선 |
| **LLM 호출** | ❌ 없음 |

---

## 5. 데이터 흐름 다이어그램

```
[원본 데이터 — 이미 enriched, LLM 호출 X]
─────────────────────────────────────
user_data.csv  (11,986 행 · 999 uid · STAR + ability + interested)
jd_enriched.csv (3,000 JD · jd_job_role/skills/competencies/...)
       │
       │  §3.2 자동 라벨링 규칙
       │   - Positive: interestedJobs ∩ jd_job_role ≥ 1
       │   - Hard-neg: 산업 일치 + 직무 불일치
       │   - Easy-neg: 산업·직무 모두 불일치
       ▼
학습 페어 ~180k (user×JD)  ─┐
       │                      │
       ▼                      │
exp-018 V1(LR) / V2(BERT+Linear) / V3(5분기 head)
       │                                                  
       │ early stopping = dev split (userId 분리)        
       ▼                                                  
학습된 λ ──────┐                                          
                                                          
[고정 검증셋 — exp-006 라벨]                              
─────────────                                             
500쌍 (100쌍 × 5관점)                                     
       │                                                  
       ├──> exp-017 황금 가중치 그리드 ──> 황금 λ        
       │                                                  
       └──> (final test) ──────────────────> NDCG@10 비교
                                              임의 λ vs 황금 λ vs 학습 λ
```

---

## 6. 차별성 5축과의 매핑

| 실험 | ① 자소서 정성 | ② 한국어 | ③ 양방향 | ④ GT 부재 | ⑤ End-to-End LLM(재정의) |
|---|---|---|---|---|---|
| exp-017 (황금 가중치) |  |  |  | ✓ |  |
| exp-018 (학습 head) | ✓ | ✓ | ✓ | ✓ | ✓ (LLM 합성 없이 자체 학습 head) |

→ ⑤번 축의 **재정의 일관성**: *LLM은 전처리(JD enriched에 이미 적용)·평가 라벨링*까지만, *매칭 head는 자체 학습*. feedback-no-llm-reranker · research-context §4.2 노선과 정합.

---

## 7. 핵심 위험과 open question

> ⚠️ 위험 1 — 자동 규칙 라벨링의 신호 한계
> `interestedJobs ↔ jd_job_role` 일치만으로는 *정성 매칭(STAR 경험의 적합도)*을 못 잡음. → exp-018 학습 head가 6 컴포넌트 score를 입력으로 받으니, 컴포넌트가 정성 신호를 내포함으로 우회. 그래도 dev NDCG가 낮으면 exp-006 휴리스틱 라벨을 train 보강 데이터로 추가.

> ⚠️ 위험 2 — 검증셋 leakage
> exp-017에서 황금 가중치를 정하면 그 500쌍은 *암묵적 학습셋*. exp-018에서는 (a) 학습은 user×JD 페어 / dev split (b) 500쌍은 **최종 1회만** 점수. 절대 fine-tune 루프에 넣지 않음.

> ⚠️ 위험 3 — λ 붕괴
> Linear head의 가중치가 음수·0으로 수렴할 수 있음. 대응: (a) softmax constraint (λ를 simplex에 사영) (b) 가중치에 L1 정규화 (c) sigmoid 후 normalize.

> ⚠️ 위험 4 — userId leakage
> 학습/dev split은 *userId 기준*. 같은 사용자의 자소서가 train과 dev에 동시에 있으면 일반화 평가가 무력화. 999 uid → train 800 / dev 199 정도 권장.

> ⚠️ Q-LF1
> 학습 라벨 방식 (a) 자동 규칙 vs (b) Model C 6 컴포넌트 pseudo-supervision 중 무엇이 검증셋 NDCG@10을 더 끌어올리는가? exp-018 ablation으로 결정.

> ⚠️ Q-LF2
> exp-018 V3(5관점 분기 head)에서 관점 라벨은 학습 시점에 *주어지는가, 추론되는가*? 본 연구 데이터셋의 5관점은 의도된 분기라 *입력으로 주는* 게 합당. 자동 라우팅은 future work.

---

## 8. 일정 (초안 — 합성 트랙 제거로 단축)

| 주차 | 마일스톤 |
|---|---|
| W1 (2026-06-01 ~ 06-05) | exp-017 그리드 서치 + 황금 가중치 보고 |
| W2 (06-06 ~ 06-12) | exp-018 학습 페어 라벨링 + V1(LR) 학습·평가 |
| W3 (06-13 ~ 06-19) | exp-018 V2(BERT+Linear) → V3(5분기) 학습·평가 |
| W4 (06-20 ~ 06-26) | 결과 통합 → `docs/04_dual_encoder_roadmap.md` 결과 누적표에 한 줄 추가, 위키 페이지 작성 |

---

## 9. 기존 실험 계획과의 관계

`docs/04_dual_encoder_roadmap.md` 트랙 ① ~ ⑤에 다음 트랙 신설:

- **트랙 ⑧ 학습 fusion** — exp-017(황금 가중치 그리드), exp-018(학습 head V1/V2/V3)

기존 exp-006(25셀)은 *임의 가중치*의 baseline으로 위치 재조정. exp-017이 exp-006의 *학습 기반 확장*에 해당.

**구 exp-017(페르소나 추출) / 구 exp-018(STAR 자소서 합성)는 2026-05-31 폐기.** 합성 데이터 트랙(트랙 ⑦)도 동시 폐기. 이유: 사용자 명시 *"이미 데이터가 두 파일에 다 들어있음, LLM API 안 쓰는 방향"*.

---

## 관련 페이지

- `docs/04_dual_encoder_roadmap.md` — 본 계획이 트랙 ⑧을 신설하며 합류하는 상위 로드맵
- `docs/03_perspective_fusion_weight_design.md` — 임의 가중치 5세트의 원안 (이번 계획이 학습 기반으로 대체)
- `docs/06_perspective_matrix.md` — 임의 가중치 25셀 baseline
- `docs/05_benchmark_100pairs_analysis.md` — 검증셋 500쌍의 원본 분석
- research-context §4.2 — 1-stage embedding + multi-perspective fusion 노선
- raw-user-data-EDA — user_data.csv 컬럼·분포
- raw-company-jobdescription-EDA — JD enriched 스키마

## 출처

- 사용자 보고(2026-05-29) — 교수님 피드백: *"데이터셋 구조 재정의 / 가중치를 학습 가능한 파라미터로 / BERT 위 Linear Layer·Logistic Regression head"*
- 사용자 결정(2026-05-31) — *"합성 데이터 안 만들어도 됨. 이미 user_data.csv + jd_enriched.csv에 다 있음. API 안 쓰는 방향으로."*
- `data/user_data.csv` — 999 unique userId × 11,986 행, draftNum=1 고정
- `data/company_jobdescription_enriched.partial.csv` — 3,000 JD enriched 스키마(jd_*)
- 메모리: feedback-no-llm-reranker (LLM은 전처리·평가만), project-final-datasets (최종 데이터 2개 고정)

## 메타

- 작성일: 2026-05-29
- 마지막 갱신: **2026-05-31** — ★ 합성 데이터 트랙(구 exp-017/018) 폐기, 실험 2건(exp-017 그리드 + exp-018 학습 head)으로 축소. LLM API 호출 0건 노선 확정.
- 상태: **exp-017/018/019 실행 완료 (V1). V2(임베딩)·V3(분기) 미구현**
- 다음 갱신 트리거: V2(KURE-v1/Qwen3 임베딩 head) 결과 / 독립 라벨 N 확장 / 교수님 피드백 라운드 2
- 태그: #실험계획 #learnable-fusion #검증셋고정 #lambda학습 #트랙8 #LLM호출0건