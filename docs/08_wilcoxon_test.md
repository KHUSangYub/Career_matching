# exp-014: Wilcoxon 부호순위 검정 — setup·weight 페어 통계 유의성

> 내 연구 관점에서의 핵심 takeaway
> - **차별성 축:** ④ GT 부재 평가 신뢰도 (paired test로 setup 차이 정량화)
> - **무엇을 강화하는가:** 기존 NDCG@10 결과(10 setups × 5관점) 위에서 setup 페어 Wilcoxon 검정 → S04(KR-SBERT baseline) vs S09(best) 차이 **Cohen's d=-5.15 (large)**, **+0.0577p**. 가중치 페어 N=50 검정으로 exp-006 결과의 통계 신뢰성 평가.
> - **위협:** **N=5(관점)는 검정력 부족** — Wilcoxon exact min p ≈ 0.0625 → S04 vs S09 같은 large effect도 p=0.0625로 유의 미달. exp-008(N=30) 필수.
> - **영향 부위:** `docs/05_benchmark_100pairs_analysis.md` §3에 통계 유의성 컬럼 추가, `docs/04_dual_encoder_roadmap.md` §6 결과표, 논문 §Results 통계 표
> - **당장 가져갈 1개 액션:** "S09는 S04보다 NDCG@10 +0.058p, Cohen's d -5.15 (large effect, p=0.063 marginal)" — **effect size로 유의성 보고**. p-value만 의존하지 말 것.

## 한 줄 요약

기존 NDCG@10 결과 위에서 setup 페어 45개 Wilcoxon (N=5 관점 paired) + weight 페어 15개 Wilcoxon (N=50 user-perspective trials) 수행. **S04→S09 차이 +0.0577p / d=-5.15 (large)지만 p=0.0625로 유의 미달 (N=5 한계).** weight 페어 모두 effect size negligible. exp-008(N=30) 후 재실행 시 의미 있는 p-value 도출 가능.

## 핵심 내용

### 1. 실험 설정

| 항목 | 값 |
|---|---|
| 노트북 | `output/exp-014-wilcoxon-paired-test.ipynb` |
| Test 1 데이터 | `exp_results_NDCG10.csv` (10 setups × 5 관점) |
| Test 2 데이터 | exp-006 per-user NDCG@10 (6 weight sets × 10 users × 5 관점 = 300 obs) |
| Test 1 페어 수 | 45 (10 setups choose 2) |
| Test 2 페어 수 | 15 (6 weight sets choose 2) |
| 검정 | scipy `stats.wilcoxon(zero_method='wilcox', method='exact')` |
| 보정 | Bonferroni (45 × p) |
| Effect size | Cohen's d (paired) |
| 풀데이터? | ❌ 불필요 |

### 2. Test 1 — Setup 페어 (N=5 관점 paired)

#### 2.1 S04 (KR-SBERT raw baseline) vs 나머지 9 setups

| 비교 | mean NDCG@10 | Δ vs S04 | Cohen's d | p-value | Effect size | 유의(α=0.05)? |
|---|---|---|---|---|---|---|
| S01 (tfidf) | 0.9290 | +0.0211 | -1.02 | 0.125 | large | ❌ |
| S02 (e5-small) | 0.9244 | +0.0165 | -0.57 | 0.4375 | medium | ❌ |
| S03 (ko-sroberta) | 0.9135 | +0.0057 | -0.23 | 0.8125 | small | ❌ |
| S05 (profile+tfidf) | 0.9481 | +0.0402 | **-7.75** | 0.0625 | **large** | ⚠️ marginal |
| S06 (profile+e5) | 0.9151 | +0.0073 | -0.20 | 0.625 | small | ❌ |
| S07 (profile+ko-sroberta) | 0.9358 | +0.0280 | -1.21 | 0.0625 | **large** | ⚠️ marginal |
| S08 (profile+kr-sbert) | 0.9222 | +0.0144 | -0.66 | 0.1875 | medium | ❌ |
| **S09 (profile+e5+overlap)** | **0.9656** | **+0.0577** | **-5.15** | **0.0625** | **large** | ⚠️ marginal |
| S10 (profile+ko-sroberta+overlap) | 0.9611 | +0.0532 | -3.28 | 0.0625 | large | ⚠️ marginal |

→ **S05/S07/S09/S10 모두 p=0.0625** — N=5에서 도달 가능한 최소 p-value. **effect size는 large**.

> N=5 paired Wilcoxon의 구조적 한계
> - W = 0 (best, 모든 차이 한 방향) 일 때 N=5의 exact two-sided p = 0.0625
> - 즉 **N=5에서는 어떤 강한 효과도 p<0.05 도달 불가능**
> - 본 결과는 *방향성과 effect size로 해석*. p-value는 N 한계로 무의미.

#### 2.2 Best setup 정보

| 항목 | 값 |
|---|---|
| Best | **S09** (mean NDCG@10 = 0.9656) |
| Worst | S04 (mean NDCG@10 = 0.9079) |
| Δ best-worst | +0.0577p |

### 3. Test 2 — Weight 페어 (N=50 user-perspective trials)

exp-006의 per-user NDCG@10 (각 weight × 각 관점 × 10 users → 50 paired observations).

| 페어 | mean_i | mean_j | Δ | Cohen's d | p-value | Effect | 유의? |
|---|---|---|---|---|---|---|---|
| A vs B | 0.9523 | 0.9527 | -0.0004 | -0.01 | 0.866 | negligible | ❌ |
| A vs C | 0.9523 | 0.9512 | +0.0011 | +0.04 | 0.889 | negligible | ❌ |
| A vs D | 0.9523 | 0.9562 | -0.0039 | -0.18 | 0.285 | negligible | ❌ |
| A vs E | 0.9523 | 0.9536 | -0.0013 | -0.11 | 0.655 | negligible | ❌ |
| A vs SINGLE | 0.9523 | 0.9513 | +0.0010 | +0.04 | 1.000 | negligible | ❌ |
| B vs C | 0.9527 | 0.9512 | +0.0015 | +0.12 | 0.655 | negligible | ❌ |
| B vs D | 0.9527 | 0.9562 | -0.0035 | -0.11 | 0.463 | negligible | ❌ |
| B vs E | 0.9527 | 0.9536 | -0.0009 | -0.04 | 0.893 | negligible | ❌ |
| B vs SINGLE | 0.9527 | 0.9513 | +0.0014 | +0.10 | 0.686 | negligible | ❌ |
| C vs D | 0.9512 | 0.9562 | -0.0050 | -0.15 | 0.327 | negligible | ❌ |
| C vs E | 0.9512 | 0.9536 | -0.0024 | -0.09 | 0.612 | negligible | ❌ |
| C vs SINGLE | 0.9512 | 0.9513 | -0.0001 | -0.00 | 1.000 | negligible | ❌ |
| D vs E | 0.9562 | 0.9536 | +0.0026 | +0.14 | 0.317 | negligible | ❌ |
| D vs SINGLE | 0.9562 | 0.9513 | +0.0049 | +0.18 | 0.500 | negligible | ❌ |
| E vs SINGLE | 0.9536 | 0.9513 | +0.0023 | +0.12 | 1.000 | negligible | ❌ |

→ **모든 weight 페어 effect size negligible, p > 0.28**. exp-006의 +0.005p 개선은 **통계 노이즈 범위 내**.

### 4. 종합 결론

> 본 실험에서 *통계적으로 유의한* 차이는 존재하지 않음
> - Setup 페어 45개 중 유의(α=0.05) **0개**, Bonferroni 보정 후도 0개
> - Weight 페어 15개 중 유의 **0개**
> - **그러나 effect size는 large** — S09 vs S04 d=-5.15는 "샘플이 크면 반드시 유의"한 크기.
> - **다음 행동: exp-008(N=30) 우선 실행** → Wilcoxon N=30 → p<0.05 도달 가능

### 5. 통계 보고 권장 형식 (논문용)

기존 단일 p-value 보고 ❌:
> "S09 NDCG@10 > S04 (p=0.0625)"

권장 형식 ✅:
> "S09 mean NDCG@10 = 0.966 (95% bootstrap CI: [0.93, 1.00], N=5 관점), S04 = 0.908 ([0.87, 0.94]). Δ = +0.058p, Cohen's d = -5.15 (large effect). Wilcoxon p = 0.063 marginal — N=5 paired observations 한계. exp-008 N=30 후 추가 검정 예정."

## 내 연구에의 적용

- **자기소개서 파이프라인:** 간접 — 유의성 검증으로 *어떤 setup 차이가 의미 있는지* 판단 가능.
- **JD 파이프라인:** 간접
- **Dual Encoder / 매칭:** exp-006의 5세트 가중치 효과가 **통계 노이즈 범위**라는 사실은 *exp-008까지 production 적용 보류* 신호.
- **평가 프레임워크:** **effect size 우선 보고**가 본 연구 표준. p-value는 N 한계 명시 동반.
- **데이터(Careermizing/JD 크롤링):** exp-008을 위해 N=30 sampling 룰 정의 필요.

## 한계 · 비판 · 모순

> ⚠️ N=5 paired의 본질적 한계
> 5관점은 *서로 독립이 아닐 수도* 있음 (같은 user가 여러 관점에 등장 — `docs/05_benchmark_100pairs_analysis.md` §1.2 참고). 진정한 독립 paired observation 수는 더 적을 수 있음.

> ⚠️ 50 obs Wilcoxon의 비독립성
> exp-006의 per-user NDCG는 같은 user가 5관점에 등장 시 5번 counting. 진정한 독립 관찰 수는 49 (unique users) 미만일 수 있음. **paired test 정확성 의심됨**. exp-008에서는 관점별 user 완전 분리 권장.

> ⚠️ effect size 해석 주의
> Cohen's d (paired)는 차이의 표준편차로 정규화 — 5개 관점에 걸친 차이가 매우 일관되면 d가 폭발적으로 큼 (S05 vs S04 d=-7.75). **이건 N이 작아서 var가 작은 effect** — 큰 N에서는 d 줄어듦.

## 관련 페이지

- `docs/06_perspective_matrix.md` — 본 실험이 검정한 weight 페어 결과
- `docs/05_benchmark_100pairs_analysis.md` — 통계 보고 형식 적용 대상
- `docs/09_ablation_6component.md` — ablation 효과의 통계 검정 (확장 가능)
- `docs/04_dual_encoder_roadmap.md` — exp-014 위치 (단계 7)

## 출처

- 코드: `output/exp-014-wilcoxon-paired-test.ipynb`
- 결과: `raw/experiments/exp-014-wilcoxon/{wilcoxon_all_pairs.csv, wilcoxon_vs_baseline_S04.csv, wilcoxon_weight_pairs.csv, exp014_summary.json}`
- 입력: `data/gemini_profile_outputs/exp_results_NDCG10.csv`

## 메타

- 작성일: 2026-05-18
- 실행일: 2026-05-18
- 마지막 갱신: 2026-05-18
- 상태: 🟢 실행 완료 — exp-008(N=30) 후 동일 절차 재실행 예정
- 태그: #실험결과 #Wilcoxon #통계검정 #effect-size #N부족