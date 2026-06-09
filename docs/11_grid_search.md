# exp-017: 검증셋 500쌍 고정 + 황금 가중치 그리드 서치

> 내 연구 관점에서의 핵심 takeaway
> - **어느 차별성 축에 연결되는가:** ④ GT 부재 (100쌍×5관점=500쌍을 고정 검증셋으로 영구화)
> - **무엇을 강화/위협하는가:** 위협 — 임의 가중치(`role 0.6/skill 0.3/industry 0.1` 류)가 정말 최적인지 그리드로 검증했더니, **임의·황금 가중치 모두 NDCG@10 = 1.0으로 포화**. 즉 이 검증셋은 변별력이 없다.
> - **영향 부위:** 평가 프레임워크 / Fusion 가중치 정의
> - **당장 가져갈 1개 액션:** 500쌍(user당 후보 ~10개)으로는 가중치 우열을 못 가린다 → exp-018에서 **후보 풀을 3,000 JD 전체로 확장**해야 함

## 한 줄 요약

5관점 임의 가중치가 NDCG@10 최적인지 5차원 simplex 그리드(10,626점)로 검증 → **임의·황금 모두 1.0 천장**, 격차 +0.0000p. user당 후보가 ~10개뿐이라 어떤 가중치든 완벽 정렬되는 것이 원인.

## 핵심 내용

- **입력:** `benchmark_labeled_100_{A,B,C,D,E}.csv` (5관점 × 100쌍 = **500쌍 고정 검증셋**, 49 user / 256 job, 5 컴포넌트 score + judge_relevance 0~4)
- **컴포넌트(5):** role_match / hard_skill / industry_match / star_overlap / context
- **절차:** 임의 가중치 5세트 baseline → 5차원 simplex 그리드(step 0.05, 10,626점) → 관점별 NDCG@10 최대 = 황금 가중치 → 임의 vs 황금 비교 + 25셀 cross-perspective 매트릭스

| 관점 | 임의 NDCG@10 | 황금 NDCG@10 | 격차 |
|---|---|---|---|
| A~D | 1.0000 | 1.0000 | 0.0000 |
| E | 0.9999 | 1.0000 | +0.0001 |
| **평균** | **1.0000** | **1.0000** | **+0.0000** |

- **성공 기준(평균 격차 ≥ +0.02p) 미달** — 임의 가중치가 이미 "충분"해 보이지만, 이는 *검증셋이 너무 쉬워서*다.
- **천장의 원인:** user당 후보가 ~10개 → NDCG@10이 사실상 전체 리스트를 보는 것 → graded label과 컴포넌트가 강상관이라 거의 모든 가중치가 완벽 정렬.

## 내 연구에의 적용

- **평가 프레임워크:** "단일 고정 검증셋 NDCG"는 후보 풀이 작으면 천장에 막혀 모델/가중치 우열을 못 가린다. → `docs/12_learnable_fusion_head.md`에서 **각 user를 3,000 JD 전체에 랭킹**하는 de-saturated 평가로 전환.
- **Fusion 가중치:** 황금 가중치 자체는 산출됐으나(관점별 5차원), 천장 때문에 "임의 대비 우월"을 못 보임. exp-018의 큰 풀 평가에서야 비로소 임의 가중치의 결함(특히 C관점)이 드러남.

## 한계 · 비판 · 모순

> ⚠️ 이 실험의 NDCG@10=1.0은 "모델이 완벽"이 아니라 "지표가 포화"다
> 후보 ~10개 + graded label에서는 NDCG@10이 변별력을 잃는다. exp-006의 25셀(평균 ~0.95)과 달리 여기선 거의 모두 1.0 — 동일 데이터의 *대각선*만 보면 천장. 결과를 "임의 가중치가 최적"으로 오독하면 안 된다.

## 관련 페이지
- `docs/10_learnable_fusion_plan.md` §4 exp-017 (이 실험의 설계 출처)
- `docs/12_learnable_fusion_head.md` — 천장 해소(3,000 풀) + 학습 head
- `docs/06_perspective_matrix.md` — 동일 25셀 포맷의 임의 가중치 baseline
- `docs/05_benchmark_100pairs_analysis.md` — 검증셋 500쌍의 원본 단위 분석

## 출처
- 노트북: `output/exp-017-validation-grid-search.ipynb`
- 결과: `raw/experiments/exp-017-validation-grid-search/` (golden_weights / arbitrary_vs_golden / cross_perspective_matrix / multi_metrics / grid_full.csv.gz / meta.json)

## 메타
- 작성일: 2026-05-31
- 마지막 갱신: 2026-05-31
- 태그: #실험 #평가 #황금가중치 #천장 #트랙8 #LLM호출0건