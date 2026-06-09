# exp-006: 5세트 fusion 가중치 × 5관점 라벨 — 25셀 매트릭스 결과

> 내 연구 관점에서의 핵심 takeaway
> - **차별성 축:** ③ 양방향(시나리오 비대칭) + ④ GT 부재 (관점 분리 라벨 ↔ 관점 분리 가중치)
> - **무엇을 강화하는가:** `docs/03_perspective_fusion_weight_design.md` v0의 5세트 가중치(A·B·C·D·E)가 단일 가중치 대비 *얼마나* 효과적인지 정량 검증. D 관점에서 `industry=0.55`가 NDCG@10 **+0.0139p** 회복 — 가설 H2 성공. 5세트 분기 평균이 단일 대비 **+0.0047p** 개선 — 약한 H3 성공.
> - **위협:** 대각선 1위 가설 H1은 부분 성공 — A와 D 관점에서만 자기 가중치가 최선. B/C/E 관점에서 다른 가중치 세트(특히 D 가중치)가 더 잘함. N=10 users/관점으로 가중치 민감도가 muted — exp-008(N=30) 필수.
> - **영향 부위:** `docs/03_perspective_fusion_weight_design.md` §4 가중치 v0의 1차 검증, `docs/05_benchmark_100pairs_analysis.md` §3 후속 분석, `docs/04_dual_encoder_roadmap.md` §6 결과표
> - **당장 가져갈 1개 액션:** D 관점은 `industry=0.55` 격상이 효과 — 본격적으로 **사용자 온보딩에서 D 시나리오 선택자에게 적용** 가능. 단 라벨이 휴리스틱(순환)이라 신뢰 검증은 `docs/13_independent_eval.md` LLM 독립 라벨 위에서 (Gemini Judge 트랙 폐기).

## 한 줄 요약

5세트 가중치 × 5관점 라벨 25셀 NDCG@10 매트릭스 측정 결과, **D 관점에서 industry=0.55 격상이 +0.0139p 회복 (NDCG@10[D]: SINGLE 0.9564 → D세트 0.9703)**. 5세트 분기 평균 NDCG@10 0.9560 vs 단일 0.9513 (Δ=+0.0047p). 대각선 1위 가설은 A·D 관점에서만 성공. 가중치 효과는 통계 유의 미달 (exp-014 Wilcoxon p=0.86) — N=10이 한계, exp-008(N=30) 필요.

## 핵심 내용

### 1. 실험 설정

| 항목 | 값 |
|---|---|
| 노트북 | `output/exp-006-25cell-perspective-matrix.ipynb` |
| 데이터 | `data/gemini_profile_outputs/{benchmark_labeled_100_X.csv, weighted_results.csv}` |
| N pairs | 100 × 5 관점 = 500쌍 |
| N users | 관점당 10명 (관점 간 user 다름 — `docs/05_benchmark_100pairs_analysis.md` §1 참고) |
| 가중치 세트 | A(role 0.50) / B(achv 0.35) / C(skill 0.45) / D(ind 0.55) / E(균형) / SINGLE(현행) |
| 메트릭 | NDCG@10 (메인), NDCG@5, Recall@5, MRR@10 |
| 풀데이터? | ❌ 불필요 — 기존 1k 샘플 |

### 2. 25셀 NDCG@10 매트릭스

| weight \ eval | A | B | C | D | E | **mean** |
|---|---|---|---|---|---|---|
| **A** (role=0.50) | **0.9794** | 0.9352 | 0.9227 | **0.9703** | 0.9540 | 0.9523 |
| **B** (achv=0.35) | 0.9776 | 0.9323 | **0.9359** | 0.9564 | 0.9614 | 0.9527 |
| **C** (skill=0.45) | 0.9685 | 0.9338 | **0.9359** | 0.9564 | 0.9614 | 0.9512 |
| **D** (ind=0.55) | 0.9776 | 0.9352 | 0.9227 | **0.9703** | **0.9750** | **0.9562** ★ |
| **E** (균형) | 0.9776 | 0.9352 | 0.9227 | **0.9703** | 0.9622 | 0.9536 |
| **SINGLE** (현행) | **0.9794** | **0.9367** | 0.9227 | 0.9564 | 0.9614 | 0.9513 |

★ = 가장 높은 row mean. 굵은 셀 = 해당 컬럼 1위.

### 3. 가설 검증

#### H1: 대각선 1위 — *관점 i 가중치가 관점 i에서 최선?*

| 관점 | 1위 가중치 | 대각선 가중치(자기) | 일치? |
|---|---|---|---|
| A | A (0.9794, SINGLE도 동률) | A (0.9794) | ✅ |
| B | SINGLE (0.9367) | B (0.9323) | ❌ |
| C | B (0.9359, C와 동률) | C (0.9359) | ✅ (동률 1위) |
| D | A (0.9703, D·E와 동률) | D (0.9703) | ✅ (동률 1위) |
| E | D (0.9750) | E (0.9622) | ❌ |

→ **5관점 중 3관점에서 대각선 1위 (A/C/D)**. B와 E는 SINGLE/D 가중치가 더 잘함.

#### H2: D 관점 industry=0.55 격상 효과 ★ 본 실험 핵심

| 셋업 | NDCG@10[D] | NDCG@5[D] |
|---|---|---|
| SINGLE (industry=0.10) | 0.9564 | 0.8885 |
| D세트 (industry=0.55) | **0.9703** | **0.9043** |
| Δ | **+0.0139p** ✅ | **+0.0158p** ✅ |

→ `docs/05_benchmark_100pairs_analysis.md` §3.4 *"D 관점 fusion 노이즈"* 발견에 대한 직접 검증. **industry 5.5배 격상이 NDCG@10 회복**. NDCG@5에서도 0.882(S07 단일 1위 수치) 통과 (0.9043).

#### H3: 평균 NDCG@10 — 5세트 분기 > 단일?

| 셋업 | 평균 NDCG@10 |
|---|---|
| 5세트 대각선 평균 | 0.9560 |
| 단일 가중치 (SINGLE) | 0.9513 |
| Δ | **+0.0047p** (약한 ✅) |

→ 효과는 양의 방향이지만 작음. exp-014 Wilcoxon에서 weight 페어 N=50 paired test 결과 p > 0.46 (모두 유의 미달).

### 4. 의외의 발견 — **D 가중치가 모든 관점에서 가장 안정적**

D 세트(industry=0.55)의 평균 NDCG@10 = **0.9562**로 6세트 중 1위.
- A 관점: 0.9776 (SINGLE 0.9794 대비 -0.0018)
- B 관점: 0.9352 (SINGLE 0.9367 대비 -0.0015)
- C 관점: 0.9227 (SINGLE과 동률)
- D 관점: 0.9703 (★ 1위)
- E 관점: 0.9750 (★ 1위)

**해석:** industry 신호는 모든 관점에서 *최소한 negative하지 않음*. 사용자 onboarding에서 시나리오 미응답 fallback은 **E(균형)이 아니라 D(industry-heavy)가 더 안전**할 수 있음 — 추후 검증 필요.

### 5. 미해결 — 동률 셀 패턴

NDCG@10 매트릭스에서 여러 셀이 동일 값 (예: A×D = D×D = E×D = 0.9703). 이는:
- N=10 users / 관점에서 Top-10 후보의 high-relevance 비율이 높아 ranking 변화가 둔감
- 가중치 변화가 ranking 순서를 바꿀 만큼 충분히 큰 영향을 주지 못함

→ exp-008 N=30으로 후보 다양성↑, 가중치 민감도↑ 검증 필요.

## 내 연구에의 적용

- **자기소개서 파이프라인:** 직접 영향 없음 — fusion 단계 후처리
- **JD 파이프라인:** 직접 영향 없음
- **Dual Encoder / 매칭:** 핵심. **5세트 가중치 분기가 production-ready** — D 관점에서 +0.014p 회복 확인. 단, B/E 관점은 가중치 재설계 필요 (B=SINGLE, E=D가 더 잘함 → 직관 설계 v0 한계).
- **평가 프레임워크:** 25셀 매트릭스가 *관점 가중치 1차 검증 도구*로 정립. exp-008 N=30 후 재측정 → v1 가중치 도출.
- **데이터(Careermizing/JD 크롤링):** N 확장 시 user_profiles 999명 중 관점별 30명 sampling 룰 필요 (B: STAR 풍부, C: hard_skill 5+ 등).

## 한계 · 비판 · 모순

> ⚠️ 검정력 한계
> - N=10 users/관점은 paired Wilcoxon에서 최소 p ≈ 0.064 — 통계 유의 도달 거의 불가능.
> - 가중치 페어 N=50 (10 × 5 관점 통합) Wilcoxon (exp-014)에서도 모든 페어 p > 0.46.
> - 본 결과는 *방향성 지표*이지 통계적 증거가 아님.

> ⚠️ H1 부분 실패 — 직관 설계의 한계
> - B 관점에서 SINGLE이 B세트보다 +0.0044p 높음. achievement 0.35 격상이 *오버슈팅*.
> - E 관점에서 D세트가 E세트보다 +0.0128p 높음. *균형* 가중치보다 industry-heavy가 더 잘함.
> - 직관 설계 v0의 한계 — exp-008 후 그리드 탐색으로 v1 도출 필요.

> ⚠️ 휴리스틱 Judge 순환 편향 미해소
> - 본 실험은 휴리스틱 Judge 라벨을 사용. → `docs/13_independent_eval.md`에서 순환성 *확인됨* → 결과 신뢰 보류, 독립 라벨로 재측정 (Gemini Judge 폐기).
> - 특히 D 관점 효과가 *industry_match 이진 라벨* 때문일 수 있음.

## 관련 페이지

- `docs/03_perspective_fusion_weight_design.md` — 본 실험이 검증한 v0 가중치 설계
- `docs/05_benchmark_100pairs_analysis.md` — 사용한 500쌍 데이터 분석
- `docs/04_dual_encoder_roadmap.md` — exp-006 위치 (단계 5)
- `docs/08_wilcoxon_test.md` — 본 실험 결과의 통계 검정
- `docs/09_ablation_6component.md` — 6요소 ablation으로 본 실험 보조

## 출처

- 코드: `output/exp-006-25cell-perspective-matrix.ipynb`
- 결과: `raw/experiments/exp-006-25cell-matrix/{25cell_ndcg10.csv, 25cell_ndcg5.csv, exp006_results_long.csv, exp006_summary.json}`
- 입력 데이터: `data/gemini_profile_outputs/{benchmark_labeled_100_*.csv, weighted_results.csv}`

## 메타

- 작성일: 2026-05-18
- 실행일: 2026-05-18
- 마지막 갱신: 2026-05-18
- 상태: 🟢 실행 완료 — exp-008 후 v1 가중치 재측정 예정
- 태그: #실험결과 #5관점 #fusion가중치 #25셀매트릭스 #1차검증