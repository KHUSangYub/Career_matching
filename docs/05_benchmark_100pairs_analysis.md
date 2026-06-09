# 100쌍 벤치마크 결과 — 단위·구성·결과 정밀 분석

> 2026-05-18 후속 실험 결과 추가
> - `docs/06_perspective_matrix.md` — 본 데이터(500쌍) 위에서 5세트 가중치 × 5관점 25셀 NDCG@10 측정. D 관점 industry=0.55가 +0.0139p 회복. D세트가 모든 관점에서 안정 (평균 0.9562 ★ 1위).
> - `docs/08_wilcoxon_test.md` — 본 결과의 setup·weight 페어 Wilcoxon 검정. S04→S09 Cohen's d=-5.15 (large), p=0.063 (N=5 한계).
> - `docs/09_ablation_6component.md` — fusion 6요소 ablation. **hard_skill 0.20 과대 가중** 발견. 단일 가중치 v1 제안.

> 내 연구 관점에서의 핵심 takeaway
> - **차별성 축:** ④ GT 부재 (합성 GT 구조의 정확한 이해), ⑤ End-to-End (Model B/C 비교 결과)
> - **무엇을 강화하는가:** Φ4·Φ5 벤치마크의 *실제 단위와 구성*을 raw CSV 직접 분석으로 확정. **단일 100쌍 ≠ 5관점 × 100쌍 = 500쌍**이며, *5관점은 같은 100쌍의 재라벨이 아니라 서로 다른 50명 user에서 뽑은 독립 500쌍*. 기존 wiki(타임라인·관점별-가중치)에 *"동일 100쌍 재라벨"*로 적힌 부분은 **정정 대상**
> - **위협:** 단일 100쌍은 *적합도 평균 1.45 / rel≥3=7%*로 매우 박한 환경. 5관점 100쌍은 *적합도 평균 2.1~2.9 / rel≥3=53~77%*로 후한 환경. 두 벤치마크의 NDCG@5는 *직접 비교 불가*
> - **영향 부위:** `docs/03_perspective_fusion_weight_design.md` §6 25셀 매트릭스 해석 재정의 필요
> - **당장 가져갈 1개 액션:** `docs/01_experiment_timeline.md` §5.1과 `docs/03_perspective_fusion_weight_design.md` §6.2의 *"동일 500쌍 라벨"* 서술 정정. exp-005 25셀 매트릭스 측정 *전에* 단위 정의 명확화 (관점 i 가중치를 *관점 j의 100쌍에 적용*)

## 한 줄 요약

`data/gemini_profile_outputs/`의 CSV 직접 분석 결과 — **100쌍 = 10명 user × 10개 후보 JD**. 단일 100쌍과 5관점 × 100쌍은 *user 풀이 완전히 다른 독립 데이터*(교집합 0). 단일 100쌍은 휴리스틱 Judge가 박하게 라벨(평균 1.45/4), 5관점은 후하게 라벨(평균 2.1~2.9/4). Model C가 단일 100쌍에서 NDCG@5 0.422 → 0.805 (+0.383p) 개선, P0384(데이터/AI)에서 +0.725p로 가장 강함.

---

## 1. 100쌍의 *정확한 단위* (★ 사용자 질문 직접 답)

### 1.1 단일 100쌍 (Φ4 — `benchmark_labeled_100.csv`)

| 항목 | 값 |
|---|---|
| **총 행 수** | 100행 |
| **고유 user** | **10명** (P0006, P0384, P0438, P0492, P0494, P0620, P0821, P0853, P0897, P0946) |
| **user당 후보 수** | **10개** (모든 user 동일) |
| **고유 JD (job_id)** | 61개 (user 간 *중복 노출* — 한 JD가 여러 user에 후보로 등장) |
| **단위 공식** | **100쌍 = 10명 user × 10 후보 JD** = 행 단위 = (user, jd) 쌍 단위 |

> *"사용자 단위인지, 행 단위인지"* 명확화
> - **user 수 = 10명** (사용자 단위)
> - **(user, jd) 쌍 수 = 100** (행 단위)
> - **고유 JD 수 = 61** (한 JD가 여러 user 후보로 중복)
> → "100쌍"이라는 표현은 *행 단위(=100 (user, jd) 쌍)*. 사용자는 10명만.

### 1.2 5관점 × 100쌍 (Φ5 — `benchmark_labeled_100_{A,B,C,D,E}.csv`)

| 관점                | 총 행     | 고유 user     | user당 후보 |
| ----------------- | ------- | ----------- | -------- |
| A. Job-Centric    | 100     | 10명         | 10개      |
| B. Resume-Centric | 100     | 10명         | 10개      |
| C. Skill-Centric  | 100     | 10명         | 10개      |
| D. Context-Fit    | 100     | 10명         | 10개      |
| E. Mixed          | 100     | 10명         | 10개      |
| **합계**            | **500** | **49명** (★) | —        |

> ⚠️ **★ 기존 wiki의 잘못된 서술 정정**
> `docs/01_experiment_timeline.md` §5.1과 `docs/03_perspective_fusion_weight_design.md` §6.2의 *"동일 100쌍을 5관점으로 재라벨링"* 서술은 **사실과 다름**. raw CSV 분석 결과:
> - 5관점 user 합집합 = **49명** (10 × 5 = 50에서 *P0557이 B·C 양쪽에 등장*해 49명)
> - 관점 간 교집합: A∩B = A∩C = A∩D = A∩E = 0, B∩C = {P0557}만 공유, 나머지 모두 0
> - 단일 100쌍의 10명 ∩ 5관점 49명 = **0명** (완전히 분리)
>
> 즉 **500쌍은 *500개 독립 쌍*** 이지 *100쌍의 5중 라벨*이 아님. 통계 검정 시 표본 독립성 가정이 다르게 적용됨.

### 1.3 후보 풀 구성 (어떻게 10개를 뽑았나)

**단일 100쌍 (Φ4):**

| candidate_source | 행 수 | 설명 |
|---|---|---|
| `baseline_top` | 30 | Baseline A (raw SBERT) Top-K에서 |
| `profile_top` | 28 | Model B (Gemini profile SBERT) Top-K에서 |
| `weighted_top` | 28 | Model C (weighted) Top-K에서 |
| `taxonomy_weak_positive` | 14 | 직무·산업 taxonomy 기반 약한 양성 |
| **합계** | **100** (10 user × 10) | |

→ *세 모델의 Top + taxonomy 약 양성*을 union → **모델 비교에 모든 모델이 자기 Top 후보를 포함**하는 공정 구성.

**5관점 100쌍 (Φ5):**

| candidate_source | 행 수 |
|---|---|
| `own` | 60 (6/user) |
| `random` | 20 (2/user) |
| `other:{X}` (다른 관점에서) | 20 (2/user, 4관점에서 분배) |
| **합계** | **100** (10 user × 10) |

→ *해당 관점 가중치로 만든 Top 6 + 다른 관점 Top 2 + 무작위 2*. **PDF §7.5 한계** *"own이 해당 관점 가중치로 만들어졌으므로 같은 관점 setup이 advantage"*의 정확한 근거.

---

## 2. 단일 100쌍 결과 — Model A/B/C 비교 (Φ4)

### 2.1 적합도(judge_relevance) 분포

| relevance | 의미 | 행 수 | 비율 |
|---|---|---|---|
| 0 | 부적합 | 7 | 7% |
| 1 | 약한 관련 | 48 | 48% |
| 2 | 일부 관련 | 38 | 38% |
| 3 | 대체로 적합 | 7 | 7% |
| 4 | 매우 적합 | **0** | 0% |
| **평균** | **1.450** | | rel≥3 = **7%** |

> ⚠️ 단일 100쌍은 *매우 박한 라벨 환경*
> - rel=4가 **0개**, rel≥3이 7%만. 휴리스틱 Judge가 보수적으로 채점
> - *Recall@5 메인 finding* — Recall이 1.0 되기 어려워 변별력 큼 (5관점에서는 적합 많아 Recall@5가 빠르게 포화)

### 2.2 모델별 평균 성능

| 모델 | NDCG@5 | NDCG@10 | Precision@5 | MRR@10 | Spearman |
|---|---|---|---|---|---|
| **Baseline A** (raw SBERT) | 0.422 | 0.716 | 0.02 | 0.148 | **−0.300** |
| **Model B** (Gemini profile SBERT) | 0.421 | 0.700 | 0.04 | 0.113 | −0.204 |
| **Model C** (profile + weighted fusion) | **0.805** | **0.907** | 0.10 | **0.342** | **+0.511** |

→ Baseline A vs Model B는 *거의 차이 없음* (NDCG@5 0.422 vs 0.421) — **전처리만으로는 효과 미미**. Model C에서 **+0.38p 점프** + Spearman 부호 회복 (−0.30 → +0.51).

### 2.3 Per-user NDCG@5 (10명 각각)

| userId | major / interestedJobs_1 | Baseline A | Model B | **Model C** | rel_max |
|---|---|---|---|---|---|
| P0006 | 기계공학 / manufacturing | 0.475 | 0.475 | 0.475 | 2 |
| **P0384** | 컴퓨터공학 / **data_ai_ml** | 0.202 | 0.261 | **0.927** | 3 |
| P0438 | 경영학 / management_support | **0.689** | 0.493 | 0.576 | 3 |
| P0492 | 스포츠재활학 / cs_cx | 0.403 | 0.334 | **0.815** | 2 |
| P0494 | 시각디자인학 / design | 0.357 | 0.708 | 0.762 | 3 |
| **P0620** | 전자공학 / engineering_hw | 0.534 | 0.405 | **1.000** | 2 |
| P0821 | 보건행정학 / education | 0.511 | 0.308 | **0.913** | 2 |
| P0853 | 건축공학 / consulting | 0.333 | 0.563 | **0.887** | 2 |
| P0897 | 건축공학+경영 / finance_investment | 0.432 | 0.437 | **0.741** | 3 |
| **P0946** | 항공우주공학 / logistics_scm | 0.289 | 0.227 | **0.952** | 3 |

### 2.4 Model C가 가장 강한·약한 user — *어디서 fusion이 효과 큰가*

| 순위 | userId | 직무 | NDCG@5 차이 (C − A) |
|---|---|---|---|
| 1 | **P0384** | data_ai_ml | **+0.725** |
| 2 | **P0946** | logistics_scm | **+0.663** |
| 3 | P0853 | consulting | +0.554 |
| 4 | P0620 | engineering_hw | +0.466 |
| 5 | P0492 | cs_cx | +0.412 |
| 6 | P0494 | design | +0.406 |
| 7 | P0821 | education | +0.402 |
| 8 | P0897 | finance_investment | +0.310 |
| 9 | P0006 | manufacturing | 0.000 |
| **10** | **P0438** | **management_support** | **−0.113** (유일하게 음수) |

> Model C가 효과적인 직무 vs 무효한 직무
> - **강함:** *기술·이공계 직무*(data_ai_ml, engineering_hw, logistics_scm) — fusion 6요소 중 `role_semantic` + `hard_skill` 신호가 정확
> - **무효 / 약함:** *일반 사무·경영*(manufacturing 변화 없음, management_support −0.113p) — 직무 enum이 광범위해 hard_skill·role 신호 약함
> → `docs/03_perspective_fusion_weight_design.md` D Context-Fit 관점(`industry` 가중치 0.55)이 *경영·사무* 직무에서 효과 클 수 있음을 시사

---

## 3. 5관점 × 100쌍 결과 (Φ5) — 단일과의 *비교 불가* 환경

### 3.1 5관점별 적합도 분포 — 단일과 *완전히 다른* 환경

| 관점 | rel 평균 | rel=0 | rel=1 | rel=2 | rel=3 | rel=4 | rel≥3 |
|---|---|---|---|---|---|---|---|
| **단일 100쌍** | **1.45** | 7 | 48 | 38 | 7 | **0** | **7%** |
| A. Job-Centric | **2.90** | 18 | 1 | 4 | 27 | 50 | **77%** |
| B. Resume-Centric | **2.11** | 16 | 10 | 21 | 53 | 0 | **53%** |
| C. Skill-Centric | **2.91** | 16 | 7 | 2 | 20 | 55 | **75%** |
| D. Context-Fit | **2.77** | 15 | 21 | 0 | 0 | 64 | **64%** (★ 이진 분포 0/1/4) |
| E. Mixed | **2.67** | 8 | 8 | 26 | 25 | 33 | **58%** |

> ⚠️ D 관점의 *이진 분포 0/1/4*
> D Context-Fit은 rel=2·3이 0개. 0(불일치) / 1(약 관련) / 4(완전 일치)만 나옴.
> 이유: D는 `industry_match`(이진 1/0)에 가중치 0.5 쏠림 → *산업 일치하면 4, 아니면 0/1* — 휴리스틱 Judge가 이진 신호를 그대로 라벨에 반영.
> → D 관점이 `docs/03_perspective_fusion_weight_design.md` = *임베딩 cosine으론 산업 enum 매칭을 못 잡음*. fusion `industry` 가중치 0.10이 부족.

### 3.2 5관점 user 49명 = 10관점 × 10명 − 1(P0557 중복)

| 관점 | userId 10명 |
|---|---|
| A. Job-Centric | P0114, P0196, P0296, P0493, P0556, P0604, P0674, P0698, P0819, P0994 |
| B. Resume-Centric | P0012, P0084, P0181, P0369, P0474, **P0557**, P0678, P0808, P0880, P0882 |
| C. Skill-Centric | P0053, P0240, P0258, P0390, P0460, **P0557**, P0560, P0849, P0952, P1001 |
| D. Context-Fit | P0017, P0059, P0126, P0210, P0392, P0437, P0679, P0697, P0801, P0852 |
| E. Mixed | P0245, P0310, P0331, P0338, P0522, P0527, P0608, P0670, P0818, P0921 |

→ **49명 unique** (P0557이 B·C 모두). 단일 100쌍 10명과 *완전히 분리*.

### 3.3 NDCG@5 메인 결과 (`docs/01_experiment_timeline.md` §5.4 참조)

| Setup | A | B | C | D | E | 평균 |
|---|---|---|---|---|---|---|
| S09 (profile + e5 + overlap) | **0.998** | **0.893** | **0.908** | 0.843 | **0.985** | **0.925** |
| S07 (profile + ko-sroberta) | 0.854 | 0.847 | 0.835 | **0.882** | 0.863 | 0.856 |
| 단일 100쌍 Model C (참고) | — | — | — | — | — | **0.805** |

> ⚠️ *단일 0.805 vs 5관점 0.925 직접 비교 금지*
> - 단일 100쌍은 *적합도 평균 1.45*, 5관점은 *평균 2.1~2.9* → 평가 환경이 다름
> - 단일은 후보가 *세 모델 Top union*, 5관점은 *해당 관점 own 6 + other 2 + random 2*
> - **NDCG@5 차이 0.12p는 모델 우위가 아니라 *환경 우위*** — 두 벤치마크는 *독립 결론*만 가능

---

## 4. ★ 각 user × 5관점 → 실제로 어떤 기업이 추천됐나 (코드 + 데이터 예시)

### 4.1 코드 출처

5관점 분리 평가의 *실제 구현 코드*: **`raw/code-snippets/gemini_profile_faiss_matching_v2_usecases.ipynb`** (26셀, retrieval_experiment_plan.md §17~§23 구현).

핵심 함수:

| 셀 | 함수 | 역할 |
|---|---|---|
| §17 CODE #3 | `USE_CASES = {A:..., B:..., C:..., D:..., E:...}` | 5관점 가중치·judge_addendum 정의 |
| §18 CODE #7 | `compute_features(user_row, jd_row)` | (user, jd) 쌍의 5자질(role_match·industry_match·hard_skill·star_overlap·context) 계산 |
| §18.2 CODE #9 | `pick_users(category_code)` + `build_candidates(category_code)` | deterministic seed로 카테고리별 10명 user 샘플링 + own 6 + other 2 + random 2 후보 |
| §19 CODE #11 | `relevance_from_score(score)` | weighted_score → rel 0/1/2/3/4 (휴리스틱 Judge: ≥0.75=4, ≥0.55=3, ≥0.35=2, ≥0.15=1, else=0) |
| §23 CODE #24 | **`show_top3(setup_id, category_code)`** | **각 카테고리 Top-1 셋업으로 첫 번째 user의 Top-3 추천 출력** (사용자가 묻는 정확한 함수) |

### 4.2 USE_CASES 정의 (코드 그대로 인용)

```python
USE_CASES = {
    'A': {'name': 'Job-Centric',     'weights': {'role_match': 0.6, 'hard_skill': 0.3, 'industry_match': 0.1}},
    'B': {'name': 'Resume-Centric',  'weights': {'star_overlap': 0.5, 'hard_skill': 0.3, 'role_match': 0.2}},
    'C': {'name': 'Skill-Centric',   'weights': {'hard_skill': 0.7, 'role_match': 0.2, 'industry_match': 0.1}},
    'D': {'name': 'Context-Fit',     'weights': {'industry_match': 0.5, 'role_match': 0.2, 'context': 0.3}},
    'E': {'name': 'Mixed/Default',   'weights': {'role_match': 0.25, 'industry_match': 0.25, 'hard_skill': 0.25, 'star_overlap': 0.25}},
}
```

> *라벨링 가중치*(라벨러 채점 기준)와 *fusion 가중치*(`docs/03_perspective_fusion_weight_design.md`)는 다른 개념
> 위 weights는 **라벨러가 후보를 채점하는 기준**(휴리스틱 Judge의 weighted_score 계산식). `docs/03_perspective_fusion_weight_design.md`는 *모델이 점수 매기는 가중치*. 본 페이지 §4의 데이터는 *라벨링 결과*.

### 4.3 ★ 실제 예시 — 5관점 각 첫 user의 10개 후보 (weighted_score 정렬)

각 관점의 첫 번째 user를 코드(`show_top3`)로 추출. JD 정보(company_name·title·profile_job_role·profile_industry)는 `jd_profiles_sample1000.csv`와 join.

#### 관점 A — Job-Centric · user P0493
- **user:** 경제금융학 / `interestedJobs_1=finance_investment` / `interestedIndustries_1=finance_fintech`

| 순위 | rel | source | 기업 | 공고 | role | industry |
|---|---|---|---|---|---|---|
| 1 | **4** | own | 네이버제트 | 크리에이터 커뮤니티 운영 체험형 인턴 | data_ai_ml | it_software |
| 2 | **4** | own | 데이원컴퍼니 | 패스트캠퍼스 교육사업 PM | planning_strategy | it_software |
| 3 | **4** | own | 네오위즈 | PC/콘솔 게임 사업 PM (신입) | planning_strategy | it_software |
| 4 | **4** | own | NHR커뮤니케이션즈 | 채용마케팅AE 모집 | data_ai_ml | it_software |
| 5 | **4** | own | 미래에셋자산운용 | 각 부문별 인턴 및 경력직 채용 | planning_strategy | finance_fintech |
| 6 | **4** | own | 서울지역연합역사동아리겨레랑 | "우리는 일제 과거사 000을 모른다" 봄모임 모집 | finance_investment | it_software |
| 7 | 4 | other:D | 한국해양과학기술원 | 2025년 상반기 극지연구소 정규직 채용 | planning_strategy | finance_fintech |
| 8 | 4 | other:D | 한국씨티은행 | Finance Reporting Analyst | finance_investment | finance_fintech |
| 9 | 1 | random | 스터닝 | 노트폴리오 커뮤니티팀 교육 콘텐츠 코디네이터 | marketing | unknown |
| 10 | 0 | random | 하나캐피탈 | 오토금융 사무계약직 채용 | management_support | finance_fintech |

> ⚠️ *finance_investment 희망인데 IT 직무가 rel=4*
> 1~4위가 모두 *IT 소프트웨어 산업의 PM/마케팅·data_ai_ml 직무*. 6위는 *대학생 동아리(봄모임)*. 휴리스틱 Judge가 weighted_score 기반이라 *role_match·industry_match 둘 다 0인데도* hard_skill 부분점수만으로 rel=4 받음.
> → **휴리스틱 Judge 신뢰도 문제의 구체 증거** (→ `docs/13_independent_eval.md` LLM 독립 라벨로 진단; Gemini Judge 트랙 폐기)

#### 관점 B — Resume-Centric · user P0369
- **user:** 경영학 / `interestedJobs_1=planning_strategy` / `interestedIndustries_1=it_software`

| 순위 | rel | source | 기업 | 공고 | role | industry |
|---|---|---|---|---|---|---|
| 1 | 3 | own | 미래에셋자산운용 | 각 부문별 인턴 및 경력직 채용 | planning_strategy | finance_fintech |
| 2 | 3 | own | 넥스트챕터 | Global Marketing Intern | planning_strategy | unknown |
| 3 | 3 | own | PTKOREA | 디지털 마케팅 캠페인 업무 지원 인턴 | marketing | unknown |
| 4 | 3 | own | 한국원전수출산업협회 | 채용연계형 인턴 모집공고 | planning_strategy | unknown |
| 5 | 3 | own | 부스터스 | 글로벌팀 글로벌 인플루언서 마케팅 | marketing | unknown |
| 6 | 3 | own | 네오위즈 | PC/콘솔 게임 사업 PM (신입) | planning_strategy | it_software |
| 7 | 3 | other:A | 데이원컴퍼니 | 패스트캠퍼스 교육사업 PM | planning_strategy | it_software |
| 8 | 3 | other:A | (주)월세드림 | (주)월세드림 공모전 | planning_strategy | unknown |
| 9 | 2 | random | 매드업 | 퍼포먼스 마케터(AE) | marketing | ai_data |
| 10 | 0 | random | 시아스 | 각 분야별 신입 및 경력사원 채용 | unknown | unknown |

→ B 관점은 *STAR 경험 유사도(`star_overlap`) 0.5 가중치*가 핵심이지만 industry 미지원 공고가 다수(`unknown` 5개). B 관점에 rel=4가 0개인 이유와 일치.

#### 관점 C — Skill-Centric · user P1001
- **user:** 통계학 / `interestedJobs_1=data_ai_ml` / `interestedIndustries_1=ai_data`

| 순위 | rel | source | 기업 | 공고 | role | industry |
|---|---|---|---|---|---|---|
| 1 | 4 | own | 엔지닉 | **BI 무료 온라인 스터디 4기** | data_ai_ml | ai_data |
| 2 | 4 | own | 아이티윌 | **데이터 분석 부트캠프 54기** | data_ai_ml | ai_data |
| 3 | 4 | own | 주식회사 비피 | **공공데이터 활용 해커톤** | data_ai_ml | ai_data |
| 4 | 4 | own | 네이버제트 | 크리에이터 커뮤니티 운영 인턴 | data_ai_ml | it_software |
| 5 | 4 | own | 힐스펫 뉴트리션 코리아 | **공모전** | software_dev | ai_data |
| 6 | 4 | own | 패스트캠퍼스 국비지원 | **커널 아카데미 부트캠프 수강생 모집** | design | ai_data |
| 7 | 1 | other:D | 헨켈코리아 | Human Resource Intern 채용 | data_ai_ml | it_software |
| 8 | 1 | other:D | 코레일테크 | 코레일테크 서포터즈 6기 모집 | data_ai_ml | ai_data |
| 9 | 0 | random | 멀티캠퍼스 | 한국휴렛팩커드 프론트엔드 개발자 아카데미 | software_dev | it_software |
| 10 | 0 | random | 서천예총 | 2025 서천시낭송전국대회 | manufacturing | unknown |

> ⚠️ *Top 6 중 5개가 부트캠프·해커톤·공모전·스터디·아카데미* (= 채용 외 콘텐츠)
> JD EDA §3.2 finding (*채용 외 콘텐츠 36.5% 혼입*)의 직접 영향. **C Skill-Centric 관점이 *교육·공모전*에 강하게 끌림** — hard_skill 자질이 데이터 분석 키워드만 매칭하기 때문.
> → **`posting_type=job_posting` 필터링 없이는 C 관점이 실질적 채용 추천이 아닌 *교육 추천*으로 작동.** (Mira-Embeddings-V1의 `quality_adjustment` 가중치 적용 필요)

#### 관점 D — Context-Fit · user P0679
- **user:** 경영학 / `interestedJobs_1=sales` / `interestedIndustries_1=automotive`

| 순위 | rel | source | 기업 | 공고 | role | industry |
|---|---|---|---|---|---|---|
| 1 | **4** | own | 수원시청소년청년재단 | **무대기획 동아리 「하플」모집** | marketing | machinery_heavy |
| 2 | **4** | own | **대창솔루션** | **제조업 영업팀 해외영업 담당자 모집** | **sales** | **automotive** |
| 3 | **4** | own | 장안평 자동차산업 종합정보센터 | 서포터즈 1기 모집 | marketing | automotive |
| 4 | **4** | own | 용마로지스 | 2023년 상반기 신입 및 경력 채용 | planning_strategy | logistics |
| 5 | **4** | own | Ecoplastic America | 미국인턴/조지아 북미법인 채용 | planning_strategy | automotive |
| 6 | **4** | own | **한화에어로스페이스** | 2024년 하반기 신입사원 채용 | planning_strategy | logistics |
| 7 | 1 | other:C | 하림지주 | 마케팅 인턴 채용 | marketing | unknown |
| 8 | 1 | other:C | 전북특별자치도 | 2024 관광기념품 100선 공모전 | marketing | chemical_materials |
| 9 | 1 | random | 한국교육학술정보원 | 2026년 제1차 직원 채용 | planning_strategy | it_software |
| 10 | 0 | random | (주)모아프렌즈 | SNS 서포터즈 2기 모집 | design | unknown |

> D 관점은 *실제 채용공고 + 산업 일치*가 잘 작동
> 2위 **대창솔루션 (sales / automotive)** = *희망 직무·산업 모두 일치 + 실제 채용*. 5위 Ecoplastic America(automotive), 6위 한화에어로스페이스도 *대기업 실채용*.
> → **D 관점의 `industry_match=0.5` 가중치가 산업 일치를 강제**해서 *교육·공모전 잡음을 줄이는* 데 효과. 다만 1위 무대기획 동아리는 산업이 machinery_heavy로 잘못 매핑 (Gemini schema 라벨링 오류 가능)

#### 관점 E — Mixed/Default · user P0522
- **user:** 국어국문학 / `interestedJobs_1=service_pm` / `interestedIndustries_1=retail_ecommerce`

| 순위 | rel | source | 기업 | 공고 | role | industry |
|---|---|---|---|---|---|---|
| 1 | 3 | own | (주)히즈 | 마케팅 리드 기획자(5년차 이상) | marketing | it_software |
| 2 | 3 | own | (주)에코마케팅 | 글로벌(일본) 퍼포먼스 마케터 채용 | marketing | it_software |
| 3 | 2 | own | 리디주식회사 | 리디주식회사 만화 MD | marketing | it_software |
| 4 | 2 | own | 비나우 | 글로벌 콘텐츠 웹디자이너 채용 | marketing | fashion |
| 5 | 2 | own | CJ프레시웨이 | 고객상담(CS) 신입/경력사원 모집 | cs_cx | it_software |
| 6 | 2 | own | 링커리어 채널 | 스펙업 마케팅 신입 정규직 | marketing | it_software |
| 7 | 2 | random | 함께걷는아이들 | 함께기자단 6기 모집 | marketing | it_software |
| 8 | 2 | other:D | 한국관광공사 | 관광인 서포터즈 5기 모집 | marketing | it_software |
| 9 | 2 | other:D | TOPGIRL | TOPGIRL 서포터즈 9기 모집 | marketing | fashion |
| 10 | 1 | random | 부스터스 | 크리에이터/인플루언서 AMD | marketing | unknown |

→ E 관점은 *균등 가중치*인데 결과 직무가 *거의 모두 marketing* — *service_pm 희망*과 mismatch. 그러나 마케팅이 *국어국문 + retail* 양쪽에 약한 신호로 걸려 균등 평균에서 우위 차지.

### 4.4 5관점별 *추천 기업 패턴* 비교 — 정성 요약

| 관점 | 추천 패턴 | 흥미로운 점 |
|---|---|---|
| **A** Job-Centric | 직무 match 비중 0.6인데도 rel=4 후한 라벨 다수 | 휴리스틱 Judge 노이즈 — *희망 직무 mismatch에도 rel=4 7개* |
| **B** Resume-Centric | unknown 산업 다수, planning_strategy·marketing 직무 | star_overlap 가중치가 *경험 텍스트 일치*만 봄. rel=4 0개 |
| **C** Skill-Centric | **부트캠프·해커톤·공모전이 Top** | 채용 외 콘텐츠 36.5%(raw-company-jobdescription-EDA)의 *직접 피해* |
| **D** Context-Fit | **실제 채용공고 + 산업 일치 비율 높음** | 산업 가중치 0.5가 *교육·공모전 잡음을 줄이는* 효과 |
| **E** Mixed | 균등이지만 *marketing 직무 편중* | 균등 가중치가 *직무 다양성* 보장 안 함 |

### 4.5 핵심 함의 — Φ7 다음 액션 우선순위 재확인

이 *user별 실제 추천 결과*에서 도출되는 액션:

1. **🔴 라벨링 = LLM 직접 채점 (Gemini Judge 폐기)** — A 관점 P0493 사례가 휴리스틱 Judge의 *희망 mismatch에도 rel=4* 노이즈를 직접 증명. 순환성은 `docs/13_independent_eval.md`에서 확인·완화
2. **🔴 `posting_type=job_posting` 필터링 — 즉시 적용 가능** — C 관점 P1001 사례가 *교육·공모전이 Top 6 중 5개*를 점유. Mira-Embeddings-V1 `quality_adjustment` 가중치 격상 또는 사전 필터
3. **🟡 D 관점의 산업 매핑 오류 검토** — D Top 1 (무대기획 동아리)이 `machinery_heavy` 산업으로 매핑됨 — Gemini JD profile schema의 industry 라벨링 정확도 추가 측정 필요
4. **🟡 E 관점이 *직무 다양성을 보장하지 못함*** — 균등 가중치가 *marketing 한 직무에 편중* — fusion 6요소가 *동일 차원 단위*로 비교되는지 정규화 검토

---

## 5. 25셀 매트릭스 *재해석* (★ `docs/03_perspective_fusion_weight_design.md` §6.2 수정)

기존 §6.2 서술은 "동일 500쌍에 5세트 가중치 적용" — 사실과 다름. 정확한 해석:

```
5관점 × 100쌍 = 500쌍 = 5개 독립 데이터셋
가중치 5세트 = A_w, B_w, C_w, D_w, E_w

25셀 매트릭스 (i = 가중치, j = 평가 데이터셋):
                평가 A (P0114~)   평가 B (P0012~)   …   평가 E (P0245~)
가중치 A         가중치_A → ranked_A의 100쌍 재정렬 → NDCG@K 측정
가중치 B         가중치_B → ranked_A의 100쌍 재정렬 → NDCG@K 측정
…

핵심:
- *행(가중치)*: 같은 가중치를 5개 평가 데이터셋에 적용
- *열(평가)*: 같은 데이터셋을 5개 가중치로 재정렬
- *대각선*: 관점 i의 가중치를 관점 i의 데이터셋에 적용 → 1위 기대
```

**합격 기준 재정의:**
- 대각선 i,i가 *해당 데이터셋 내에서* 다른 가중치(i,j∀j≠i) 대비 1위
- 단일 가중치(현행 Model C) 적용 시보다 *대각선 i,i가 NDCG@10 ≥ +0.01* 개선

**D 관점 특별 조건:** D 가중치(`industry=0.55`)를 D 데이터셋(P0017~)에 적용 시 NDCG@5 ≥ 0.882 (S07 단일 가중치 D 1위 수치) 통과.

---

## 6. 한계 · 함의

| # | 한계 | 영향 |
|---|---|---|
| L1 | **휴리스틱 Judge** (`_model: heuristic_fallback`) — *role/industry/skill/quality overlap 점수* 기반 휴리스틱 | 모든 결과의 *순환 편향* — profile 계열·Model C가 구조적 우위 (→ `docs/13_independent_eval.md` LLM 독립 라벨로 진단·완화; Gemini Judge 트랙 폐기) |
| L2 | **표본 10 user/관점** | NDCG@5 차이 0.01~0.03은 표본 변동 안 (PDF §7.1). Wilcoxon 검정 필요 |
| L3 | **5관점이 *동일 쌍 재라벨* 아닌 *독립 500쌍*** | 통계적 비교가 *paired test* 아닌 *independent samples test*로 바뀜 |
| L4 | **단일 vs 5관점 적합도 환경 차이** (평균 1.45 vs 2.1~2.9) | 두 벤치마크 직접 비교 불가, 각자 *독립 결론* |
| L5 | **단일 100쌍에 rel=4가 0개** | NDCG 상한이 이론값보다 낮음. graded relevance의 진가 일부 못 봄 |
| L6 | **D 관점의 *이진 분포 0/1/4*** | industry_match 이진 신호 때문. context 자질 미구현(PDF §7.4)의 직접 결과 |
| L7 | **own/other 후보 풀이 *해당 관점에 advantage*** | BEIR 같은 *공통 후보 풀* 트랙 필요 (PDF §7.5) |

---

## 6. 다음 액션 (2026-05-31 갱신)

> 이 페이지의 500쌍 휴리스틱 벤치마크는 `docs/11_grid_search.md`에서 NDCG 천장(포화) 확인 → exp-018/019/020에서 **3,000 JD 풀 + LLM 직접 채점**으로 이행. 구 'Gemini Judge 활성화' 액션은 폐기.

1. **라벨링 = LLM 직접 채점** (Gemini Judge 폐기). 순환 편향은 `docs/13_independent_eval.md`에서 확인·완화
2. **인간 라벨 일부 + Cohen's κ** — 순환성 완전 탈출
3. **V2 임베딩 head 학습** — 성능 레버 (`docs/10_learnable_fusion_plan.md`)

---

## 관련 페이지

- `docs/01_experiment_timeline.md` — Φ4·Φ5 종합 (§5.1 정정 대상)
- `docs/03_perspective_fusion_weight_design.md` — §6.2 25셀 매트릭스 (본 페이지 §5로 재해석)
- `docs/02_project_status.md` — exp-005가 다음 1순위
- embedding-model-evaluation-skill — NDCG·Recall·MRR 메트릭 정의
- BEIR — 공통 후보 풀 트랙의 학술 근거
- JobRec-Dual-Perspective — 관점 분리의 학술 토대
- open-questions Q-D9 (RankZephyr vs Mira 비교)

## 출처

- `data/gemini_profile_outputs/benchmark_pairs_100.csv` (단일 100쌍 후보 풀)
- `data/gemini_profile_outputs/benchmark_labeled_100.csv` (단일 라벨)
- `data/gemini_profile_outputs/benchmark_labeled_100_{A,B,C,D,E}.csv` (5관점 × 100쌍 = 500쌍)
- `data/gemini_profile_outputs/user_profiles.csv` (10명 user 정체)
- `data/gemini_profile_outputs/jd_profiles_sample1000.csv` (§4 회사·공고·role·industry join)
- `data/gemini_profile_outputs/benchmark_metrics.csv` (Φ4 모델별 평균)
- `data/gemini_profile_outputs/exp_results_NDCG5.csv` (Φ5 5관점 결과)
- **`raw/code-snippets/gemini_profile_faiss_matching_v2_usecases.ipynb`** (§4 USE_CASES·build_candidates·show_top3 원본 코드)
- 직접 분석 코드 환경: Python 3.12, pandas 3.0.2

## 메타

- 작성일: 2026-05-17
- 마지막 갱신: 2026-05-17
- 다음 갱신 트리거: V2 임베딩 결과 / 인간 κ 측정 (구 'exp-006 Gemini Judge' 폐기)
- 태그: #100쌍벤치마크 #결과분석 #단위정확화 #500쌍독립