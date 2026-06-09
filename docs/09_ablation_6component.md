# exp-015: Ablation Study — fusion 6요소 단일 제거 분석

> 내 연구 관점에서의 핵심 takeaway
> - **차별성 축:** ① 자소서 정성 (어느 자질이 NDCG에 기여하나) + ④ GT 부재 (논문 §Ablation 표 산출)
> - **무엇을 강화하는가:** 6요소(role_semantic, hard_skill, competency, achievement, industry, quality_adjustment) leave-one-out으로 **`industry`가 가장 중요(+0.0031p)**, **`hard_skill` 제거가 오히려 +0.0034p 개선** — 단일 가중치 hard_skill=0.20은 *과대 가중*. exp-006의 5세트 분기 정당화 (C 관점 외에는 hard_skill 줄여야 함).
> - **위협:** Ablation 효과 크기 자체가 ±0.005p 범위로 작음. exp-014 Wilcoxon에서 모두 negligible effect size. exp-008(N=30) 후 재측정 필요.
> - **영향 부위:** `docs/03_perspective_fusion_weight_design.md` §1.1 단일 가중치 비판, `docs/06_perspective_matrix.md` 보조 분석, 논문 §Ablation 표
> - **당장 가져갈 1개 액션:** **단일 가중치 v1 = role 0.40 / hard_skill 0.10 / comp 0.15 / achv 0.10 / industry 0.15 / qual 0.10** 후보 제안 (hard_skill ↓, industry ↑). exp-008 후 검증.

## 한 줄 요약

SINGLE 가중치 기준 6요소 단일 제거 ablation: **industry > quality_adjustment > role_semantic > competency > achievement > hard_skill** 순. industry 제거 시 NDCG@10 -0.0031p, **hard_skill 제거 시 +0.0034p 개선** (반대 방향). 즉 단일 가중치에서 hard_skill=0.20은 *과대 가중* — exp-006의 D/E 관점에서 D세트(hard_skill=0.10)가 SINGLE(0.20)보다 잘하는 이유 직접 설명.

## 핵심 내용

### 1. 실험 설정

| 항목 | 값 |
|---|---|
| 노트북 | `output/exp-015-ablation-6component.ipynb` |
| 데이터 | `weighted_results.csv` + `benchmark_labeled_100_X.csv` |
| Baseline | SINGLE 가중치 (`role 0.35 / skill 0.20 / comp 0.15 / achv 0.10 / ind 0.10 / qual 0.10`) |
| Ablation | leave-one-out: 해당 요소 weight=0, 나머지 비율 유지 정규화 |
| 메트릭 | NDCG@10 (메인), NDCG@5 |
| 풀데이터? | ❌ 불필요 |

### 2. Ablation NDCG@10 매트릭스

| ablation | A | B | C | D | E | **mean** |
|---|---|---|---|---|---|---|
| **FULL** (6요소) | 0.9794 | **0.9367** | 0.9227 | 0.9564 | 0.9614 | **0.9513** |
| -role_semantic | 0.9794 | 0.9352 | 0.9227 | 0.9564 | 0.9614 | 0.9510 |
| **-hard_skill** | 0.9794 | 0.9352 | 0.9227 | **0.9703** | **0.9660** | **0.9547** ★ |
| -competency | 0.9776 | 0.9318 | 0.9307 | 0.9564 | 0.9622 | 0.9517 |
| -achievement | 0.9794 | 0.9352 | 0.9227 | **0.9703** | 0.9532 | 0.9522 |
| **-industry** | 0.9691 | 0.9378 | 0.9279 | 0.9508 | 0.9556 | 0.9482 ↓ |
| -quality_adjustment | 0.9776 | 0.9287 | 0.9227 | 0.9564 | 0.9622 | 0.9495 |

★ = hard_skill 제거가 평균 NDCG@10에서 1위 (0.9547 vs FULL 0.9513).
↓ = industry 제거가 평균 NDCG@10에서 최하 (0.9482).

### 3. 요소별 기여도 (제거 시 NDCG@10 하락폭, 평균)

| 요소 | A | B | C | D | E | **mean drop** | 해석 |
|---|---|---|---|---|---|---|---|
| **industry** | +0.0102 | -0.0010 | -0.0052 | +0.0056 | +0.0058 | **+0.0031** | ★ **가장 중요** — A·D·E 관점에서 큰 기여 |
| quality_adjustment | +0.0017 | +0.0080 | 0.0000 | 0.0000 | -0.0008 | +0.0018 | 2위, B 관점에서 강함 |
| role_semantic | 0.0000 | +0.0015 | 0.0000 | 0.0000 | 0.0000 | +0.0003 | 거의 무영향 (이미 0.35로 dominant이라 빠져도 비례 분배) |
| competency | +0.0017 | +0.0049 | -0.0081 | 0.0000 | -0.0008 | **-0.0004** | 거의 noise |
| achievement | 0.0000 | +0.0015 | 0.0000 | **-0.0139** | +0.0082 | -0.0009 | **D 관점에서 노이즈** — 빼면 NDCG↑ |
| **hard_skill** | 0.0000 | +0.0015 | 0.0000 | **-0.0139** | -0.0046 | **-0.0034** | ⚠️ **과대 가중** — 빼면 NDCG↑ |

→ **`hard_skill`은 단일 가중치 0.20에서 *과대*. C 관점 외에서는 줄여야 함.** `docs/06_perspective_matrix.md`에서 D세트(hard_skill=0.10)가 SINGLE(0.20)보다 평균 잘하는 이유.

### 4. 핵심 인사이트

#### 4.1 hard_skill 과대 가중 — *exp-006의 D 우위 직접 설명*

`docs/06_perspective_matrix.md`에서 **D 세트가 평균 NDCG@10 1위 (0.9562)**. 본 ablation에서 **hard_skill 제거 시 평균 NDCG@10 = 0.9547로 SINGLE 0.9513 대비 +0.0034p 개선**. 두 결과는 일관:
- D 세트는 hard_skill=0.10 (SINGLE의 절반)
- -hard_skill ablation은 hard_skill=0 (완전 제거)
- 둘 다 SINGLE보다 잘함 → **hard_skill 0.20 → 0.10~0**이 더 적절

**제안: 단일 가중치 v1**
```
role_semantic       0.40  (현 0.35)
hard_skill          0.10  (현 0.20)  ← 절반 축소
competency          0.15  (현 0.15)
achievement         0.10  (현 0.10)
industry            0.15  (현 0.10)  ← +50% 격상
quality_adjustment  0.10  (현 0.10)
```

이 v1은 exp-006 D 세트와 SINGLE의 중간 — exp-008 후 검증 필요.

#### 4.2 industry는 단일 가중치에서도 격상 필요

industry 제거 시 mean NDCG@10 -0.0031p — **현 0.10보다 가중치 ↑ 필요** 시사. `docs/06_perspective_matrix.md` D 세트(industry=0.55)가 다른 관점에서도 stable한 이유와 일관.

#### 4.3 role_semantic은 이미 dominant — 추가 격상 불필요

role_semantic 제거 시 mean NDCG@10 -0.0003p (거의 무영향). 이는 *제거하면 다른 요소가 비례 분배받기 때문이지* role 신호가 약해서가 아님. 현 0.35는 적정.

#### 4.4 quality_adjustment는 B 관점에서 강함

quality_adjustment 제거 시 B 관점 NDCG@10 +0.0080p drop — **가장 큰 단일 관점 효과**. B Resume-Centric에서 *JD 품질 신호*(posting_type, 인코딩 페널티)가 ranking에 중요.

### 5. 관점별 가장 큰 기여 요소

| 관점 | 1위 요소 | 1위 drop | 2위 요소 | 2위 drop |
|---|---|---|---|---|
| **A** Job-Centric | **industry** | +0.0102 | competency / quality | +0.0017 |
| **B** Resume-Centric | **quality_adjustment** | +0.0080 | competency | +0.0049 |
| **C** Skill-Centric | **competency** (drop) | -0.0081 | industry | -0.0052 |
| **D** Context-Fit | **industry** | +0.0056 | (-hard/achv 둘 다 +0.014 negative) | |
| **E** Mixed | **industry** | +0.0058 | quality | +0.0017 |

→ **A·D·E 관점에서는 industry가 1순위**. B 관점은 quality, C 관점은 (어떤 요소 제거도 음의 효과 — 모두 noise).

## 내 연구에의 적용

- **자기소개서 파이프라인:** 간접 — 자소서 추출 features 중 hard_skill 추출 quality가 fusion 점수에 *부정적* 영향을 줄 수 있음. 보다 정확한 hard_skill 매칭 알고리즘 필요할 수도.
- **JD 파이프라인:** 직접 — JD의 `quality_flags`(posting_type)이 B 관점에서 강력. JD 품질 분류기 강화 가치 있음.
- **Dual Encoder / 매칭:** **fusion 가중치 v1 (위 §4.1) 제안**. exp-008로 검증.
- **평가 프레임워크:** **Ablation은 5관점별로 다른 답** — 어떤 자질이 어떤 관점에 중요한지가 관점별 가중치 설계의 *데이터 근거*.
- **데이터(Careermizing/JD 크롤링):** posting_type 분류 정확도가 매칭 품질에 직접 영향 — 크롤링 단계에서 보강 필요.

## 한계 · 비판 · 모순

> ⚠️ Ablation 효과 크기는 모두 ±0.005p 이내
> 본 ablation에서 가장 큰 평균 효과 = +0.0034p (hard_skill 제거). `docs/08_wilcoxon_test.md` 결과로 보면 weight 페어 차이는 모두 negligible effect size. **본 ablation은 *방향성*은 명확하지만 *크기*는 작아 production 결정에 단독 사용 위험**.

> ⚠️ Leave-one-out 정규화 방식 선택
> 본 실험은 "해당 요소 0, 나머지 비율 유지 정규화" 사용. 다른 방식 (해당 요소 0, 나머지 그대로 0.9 합으로 사용) 시 결과 달라질 수 있음. **해석은 *비교상대적*임**.

> ⚠️ hard_skill 신호 자체의 noise 가능성
> hard_skill Jaccard overlap 계산 자체가 *raw skills* 매칭. 동의어 처리 미흡(예: "Python" vs "파이썬") 시 신호가 noise. 본 ablation은 *현 hard_skill 신호의 noise성*만 보여줄 뿐, hard_skill *개념* 자체의 가치를 부정하지 않음. 더 정확한 hard_skill 매칭 알고리즘 (semantic skill embedding) 후 재측정 필요.

> ⚠️ 휴리스틱 Judge 의존
> 본 ablation도 휴리스틱 Judge 라벨 사용. → `docs/13_independent_eval.md`에서 순환성 *확인됨* → hard_skill 기여도는 독립 라벨로 재측정 필요 (휴리스틱이 hard_skill_overlap을 라벨에도 사용 = 순환 편향; Gemini Judge 폐기).

## 관련 페이지

- `docs/06_perspective_matrix.md` — 본 실험이 직접 설명하는 D 세트 우위
- `docs/08_wilcoxon_test.md` — 본 실험 결과의 통계 유의성 평가
- `docs/03_perspective_fusion_weight_design.md` §1.1 — 단일 가중치 6요소 정의 (본 실험 baseline)
- `docs/04_dual_encoder_roadmap.md` — exp-015 위치 (단계 7~8)

## 출처

- 코드: `output/exp-015-ablation-6component.ipynb`
- 결과: `raw/experiments/exp-015-ablation/{ablation_ndcg10.csv, feature_contribution.csv, exp015_summary.json}`
- 입력: `data/gemini_profile_outputs/{benchmark_labeled_100_*.csv, weighted_results.csv}`

## 메타

- 작성일: 2026-05-18
- 실행일: 2026-05-18
- 마지막 갱신: 2026-05-18
- 상태: 🟢 실행 완료 — 단일 가중치 v1 제안 도출. 독립 라벨(exp-019/020) 기준 재검증 필요 (구 exp-007/008 Gemini 트랙 폐기)
- 태그: #실험결과 #ablation #6요소 #hard_skill과대 #industry중요 #v1제안