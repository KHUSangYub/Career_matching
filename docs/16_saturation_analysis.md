# exp-022: NDCG 0.998 — *왜 1에 가까운가* 심층 분석

> 내 연구 관점에서의 핵심 takeaway
> - **어느 차별성 축에 연결되는가:** ④ GT 부재 평가 방법론 — *천장 효과(saturation)의 직접 측정*
> - **무엇을 강화하는가:** "NDCG 0.998은 의심해야 한다"는 교수님 지적에 대한 **5겹 답변**. (1) task가 trivial해서가 아님 (random=0.12), (2) **top-10이 label=4로 saturated**(99%), (3) **(role,ind) 단 2변수의 deterministic 분류**, (4) IDCG 작아 정규화 후 천장, (5) 라벨-점수 순환성(exp-021).
> - **위협:** 본 평가 setup은 *분류 task*에 가깝지 *ranking task*가 아님. 0.998은 "ranking 성능"이 아니라 "분류 boundary가 명확함"의 측정치.
> - **영향 부위:** 평가 프레임워크 전반. 논문 §실험 한계·심사 답변에 필수.
> - **당장 가져갈 1개 액션:** 논문 §실험 한계에 "본 평가는 천장 효과(top-10 saturation 99%, role-ind 2변수 분류)와 라벨-점수 순환성의 복합 결과로 NDCG 0.998을 보이며, 독립 라벨 평가(exp-019/020) NDCG=0.920이 실질 추정치"로 명시.

## 한 줄 요약

NDCG 0.998은 ① top-10이 label=4로 saturated(96~99%) + ② (role, industry) 2변수의 deterministic 분류 + ③ 라벨-점수 순환성의 복합 결과. **Random NDCG=0.12이므로 task 자체는 trivial하지 않음.** 하지만 score function이 label function의 결정 boundary와 거의 일치하여 ranking이 perfect로 떨어짐.

## 실험 설계

| 항목 | 내용 |
|---|---|
| 데이터 | user_data.csv (999명 전체) × company_jobdescription_enriched.partial.csv (3,000 JD 전체) = 2,997,000 pair |
| 가중치 | exp-018 golden weights |
| 5가지 가설 | H-Random / H-Sparsity / H-Saturation / H-Deterministic / H-Tie |
| 코드 | `output/exp-022-saturation-deep-analysis.ipynb` |

## H-Random: Random baseline (task의 본질적 난이도)

| 관점 | random | reverse(worst) | **golden** | perfect | golden − random |
|---|---|---|---|---|---|
| A | 0.0908 | 0.0000 | **0.9996** | 1.0 | +0.9089 |
| B | 0.1664 | 0.0000 | **0.9986** | 1.0 | +0.8322 |
| C | 0.1597 | 0.0000 | **0.9964** | 1.0 | +0.8367 |
| D | 0.0928 | 0.0000 | **1.0000** | 1.0 | +0.9072 |
| E | 0.0903 | 0.0000 | **0.9967** | 1.0 | +0.9065 |
| **MEAN** | **0.120** | **0.000** | **0.9983** | **1.000** | **+0.878** |

> H-Random 기각
> - Random NDCG = 0.12 (10% 수준) — task가 trivial하지 않음
> - golden − random = +0.88p — score function이 정말 정보를 잡아내고 있음
> - **결론**: "0.998이 random과 비슷"이 아님. 0.998은 실제로 매우 강한 ranking 성능
> - 그러나 *왜 1에 그렇게 가까운가*의 답은 random에서 못 찾음 → 다음 가설들 봐야 함

## H-Sparsity: 라벨 분포의 극단성

| 관점 | %label=0 | %label=2 | %label=3 | %label=4 | per-user label=4 평균 | per-user label=4 max | label=4 없는 user 수 |
|---|---|---|---|---|---|---|---|
| A | 85.02 | 1.82 | 6.36 | **2.45** | 73.60 | 191 | 0 |
| B | 59.33 | 6.90 | 4.69 | **0.23** | 6.76 | 91 | 171 |
| C | 57.73 | 5.01 | 6.55 | **0.69** | 20.55 | 107 | 3 |
| D | 85.13 | 6.85 | 4.83 | **1.99** | 59.80 | 166 | 0 |
| E | 81.89 | 10.17 | 1.75 | **1.39** | 41.74 | 147 | 1 |

> 부분 확인
> - label=4 비율은 0.23%~2.45%로 매우 sparse (특히 B 관점)
> - 하지만 per-user label=4 평균이 6.76~73.60으로 큰 편차 → 사용자 대부분 label=4를 충분히 가지고 있음
> - K=10 기준 IDCG가 작아져 NDCG 천장에 빠르게 도달함 (B 관점에서는 user당 label=4가 6.76개뿐이라 IDCG 작음 → NDCG=1 도달 쉬움)

## H-Saturation: Top-10이 label=4로 채워지는가 (★ 가장 강력한 증거)

| 관점 | top-10 평균 label | **top-10 %label=4** | top-10 %label≥2 | top-10 random %label=4 |
|---|---|---|---|---|
| A | 3.997 | **99.73%** | 100.0% | 2.33% |
| B | 3.397 | 39.76% | 100.0% | 0.25% |
| C | 3.838 | **83.79%** | 100.0% | 0.81% |
| D | 3.994 | **99.40%** | 100.0% | 1.82% |
| E | 3.960 | **95.99%** | 100.0% | 1.40% |

> ⚠️ ★ H-Saturation 강력 확인
> - golden ranker의 top-10이 96~99%가 label=4로 채워짐 (A·D·E)
> - top-10 평균 label이 3.99 (= 거의 모두 4) — top-10에 4점이 다 들어가면 NDCG=1 정의상 결과
> - 같은 위치에 random은 label=4 비율 1~2% → score function이 sparse label을 정확히 찾아냄
> - **이게 NDCG=0.998의 직접적 산술 원인**

## H-Deterministic: 단일 컴포넌트만으로 ranking 가능한가?

| 관점 | role_only | hard_skill_only | industry_only | star_only | competency_only |
|---|---|---|---|---|---|
| A | **0.7592** | 0.3742 | 0.4326 | 0.4788 | 0.1997 |
| B | 0.6503 | 0.5070 | 0.5191 | 0.6216 | 0.3981 |
| C | 0.6508 | 0.6001 | 0.4749 | 0.5226 | 0.3970 |
| D | 0.5326 | 0.2492 | **0.7878** | 0.4470 | 0.2230 |
| E | 0.5444 | 0.4465 | 0.5731 | 0.5279 | 0.2116 |

> 부분 기각
> - 단일 컴포넌트는 0.53~0.79 — 5컴포넌트 fusion(0.998) 대비 명확히 낮음
> - 단일 신호로 NDCG 0.95+가 나왔다면 "1차원이 다 한다"라고 할 수 있지만 그 정도는 아님
> - **fusion이 진짜로 의미 있음** (단, B와 C 관점에서는 5컴포넌트 합쳐도 그닥 향상폭이 큼 — H-Saturation이 더 강한 원인)

### (role, industry) 6패턴의 결정적 역할 ★

| role | industry | n_pairs | percentage | 평균 label_E | **%label=4_E** |
|---|---|---|---|---|---|
| 0.0 | 0 | 2,551,595 | 85.14% | 0.04 | 0.00% |
| 0.0 | 1 | 152,421 | 5.09% | 1.98 | 0.00% |
| 1.0 | 0 | 228,403 | 7.62% | 1.96 | 0.00% |
| **1.0** | **1** | **64,581** | **2.15%** | **3.57** | **64.56%** |

> ★ 결정적 발견 — Boolean 분류 task에 가까운 본질
> - **label=4는 (role=1 ∧ industry=1) 패턴에만 존재** — 전체 pair의 2.15%
> - 다른 5개 패턴은 label=4 비율 정확히 0%
> - score도 같은 2변수에 가장 강한 가중을 둠 → score 높은 순 = (role=1, ind=1) 순
> - → **ranking이 사실상 \"2변수 boolean 분류\"의 결정 영역을 찾는 일**
> - 이게 NDCG가 1에 가까운 *진짜 본질적 원인*: ranking이 아니라 분류 task

## H-Tie: Score 동률 분포

| 관점 | unique score % | top-10 unique % |
|---|---|---|
| A | 8.65% | 72.58% |
| B | 45.41% | 99.58% |
| C | 7.80% | 72.54% |
| D | 40.11% | 97.19% |
| E | 45.00% | 99.57% |

> 부분 확인
> - 전체에서 unique score 비율 8~45% — 동률 다수 (특히 A, C는 90% 이상이 동률)
> - 하지만 top-10에서는 unique 72~99% → top-10 내에서는 변별 가능
> - tie는 NDCG=0.998의 직접 원인은 아니지만, ranking이 \"분류에 가깝다\"는 H-Deterministic을 뒷받침

## 5겹 답변 (논문 §실험 한계 / 심사 답변 내러티브)

> NDCG 0.998이 1에 가까운 진짜 이유 (요약)
>
> | 원인 | 수치 증거 | 기여 |
> |---|---|---|
> | ① **Top-K saturation** ★ | top-10의 96~99%가 label=4 (A·D·E) | NDCG=1 정의상 결과 |
> | ② **(role, ind) 2변수 분류** ★ | label=4의 100%가 (role=1 ∧ ind=1) 안에만 존재 (2.15% pair) | ranking → 분류 task |
> | ③ **라벨-점수 순환성** (exp-021) | Spearman(score, label) = 0.77 | 두 함수가 같은 5컴포넌트 공유 |
> | ④ IDCG 작음 (sparsity) | label=4 비율 0.23~2.45% | 정규화 분모 작아 NDCG 천장 |
> | ⑤ Random은 trivial하지 않음 | random NDCG = 0.12 | task 자체는 어렵지만 score가 그걸 정확히 풀어낸 게 아님, 같은 boundary를 찍은 것 |

**한 줄로:** *score function이 label function과 동일한 boolean indicator(role match, industry match)에서 파생되어, ranking이 \"분류 boundary를 찾는 일\"로 환원되었기 때문*. 0.998은 "AI 모델의 매칭 성능"이 아니라 "이 평가 setup의 천장 효과"의 측정치.

**대체 추정치:** `docs/13_independent_eval.md` / `docs/14_independent_eval_stats.md` 독립 라벨 평가 NDCG@10 = **0.920**. 이것이 실질 성능 추정치.

## 내 연구에의 적용

- **평가 프레임워크:** 본 setup은 *ranking* 평가가 아니라 *분류 boundary 발견* 평가. 진정한 ranking 능력을 측정하려면 (a) label=4 안에서 graded 차이 필요 (b) (role, ind) 외 신호로 분류된 라벨 필요 (c) 독립 라벨 (LLM 직접 채점, exp-019)
- **자기소개서 파이프라인:** 자소서 서사(STAR)가 ranking에 *실질적으로* 기여하는지는 본 setup으로 검증 불가능. role/ind boolean이 압도적이라 자소서 정보는 marginal로 보임. → V2 임베딩 head로 자소서 텍스트 임베딩 직접 사용해야 의미 있음
- **Dual Encoder / 매칭:** 5컴포넌트는 *결정 boundary를 부드럽게 만드는* 역할만 함. 차별성은 fusion이 아니라 임베딩 자체에서 와야 함 → 차별성 ① ② 강화 필요
- **데이터:** (role=1, ind=1) pair가 2.15%만 차지 → 학습이 \"긍정 sample을 정확히 찾기\" task로 환원되어 ranking 다양성이 부족. JD 풀에 더 다양한 매칭 후보 필요 (현재 unknown role/industry가 압도적)

## 한계 · 비판 · 모순

> ⚠️ 
> - B 관점만 top-10 label=4 비율이 39.76%로 낮은데도 NDCG=0.9986. 이유: per-user label=4 평균이 6.76개뿐이라 IDCG도 작음 → label=4 6개를 top-10에 다 넣어도 IDCG/DCG 비율 = 1
> - 본 실험은 *순환 라벨* 기반 — 독립 라벨(LLM 직접) 환경에서는 패턴이 다를 수 있음
> - role/industry가 \"unknown\"인 JD가 다수 (3000 중 1306개) — enrichment 완성도가 분류 task의 명료성에 직접 영향
> - 5컴포넌트의 score 계산 자체에 정규화 부재 (예: skill score가 0~1 / role score도 0~1이지만 분포 다름) — fusion 시 신호 가중치 왜곡 가능

## 관련 페이지

- `docs/15_ndcg_root_cause.md` — 표면 원인 (순환성 H1, 풀 크기 H2, N H3) — 본 페이지는 그 심층 후속
- `docs/12_learnable_fusion_head.md` — NDCG 0.998이 처음 보고된 실험
- `docs/13_independent_eval.md` — 독립 라벨 N=6 (실질 NDCG=0.917)
- `docs/14_independent_eval_stats.md` — 독립 라벨 N=12 + 통계검정 (실질 NDCG=0.920)
- research-context — 차별성 ④ GT부재 평가

## 출처

- `output/exp-022-saturation-deep-analysis.ipynb` (코드)
- `raw/experiments/exp-022-saturation-deep/` (결과 6개 CSV + meta.json)

## 메타

- 작성일: 2026-06-05
- 마지막 갱신: 2026-06-05
- 태그: #평가 #saturation #천장효과 #NDCG #심사대비 #분류vs랭킹