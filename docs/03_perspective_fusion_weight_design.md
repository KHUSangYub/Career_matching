# 관점별 Fusion 가중치 설계 — 사용자 시나리오 분기

> 내 연구 관점에서의 핵심 takeaway
> - **어느 차별성 축에 연결되는가:** ③ 양방향 매칭(의 시나리오 비대칭), ④ GT 부재 평가 (관점 분리 라벨링과 정확히 짝)
> - **무엇을 강화/위협하는가:** `docs/01_experiment_timeline.md` Φ5의 핵심 발견("단일 평가셋 1위가 모든 관점에서 1위가 아니다 — D Context-Fit 관점에서 S09→S07 역전")을 **Model C fusion 가중치 자체를 관점별로 분기**하는 설계로 흡수. *모든 관점에 동일한 6요소 가중치를 쓰면 D 관점이 구조적으로 손해*라는 PDF §6.5 진단의 해결책.
> - **위협:** 분기 가중치 설계는 본 페이지 §4의 *직관 매핑*에서 출발 — 그리드 탐색·사용자 설문 없이 채택 시 페르소나 직관이 모델에 박힘. PDF §7.3 "채점 가중치 임의" 한계의 재현.
> - **영향 부위:** Model C `WEIGHTS` dict, 사용자 온보딩 UX, 평가 프레임(관점별 가중치 × 관점별 라벨 = 5×5 매트릭스)
> - **당장 가져갈 1개 액션:** 본 페이지 §4의 5세트(A·B·C·D·E) 가중치를 `gemini_profile_faiss_matching.ipynb` `WEIGHTS_BY_PERSPECTIVE`로 코드화하고, 기존 500쌍 라벨에 대해 *관점 i 가중치 × 관점 j 라벨* 25셀 NDCG@5를 다시 측정 → D 관점에서 1위가 회복되는지 확인. 이게 본 설계의 첫 검증.

## 한 줄 요약

현재 Model C는 단일 6요소 가중치(`role_semantic 0.35 / hard_skill 0.20 / competency 0.15 / achievement 0.10 / industry 0.10 / quality_adjustment 0.10`)를 모든 사용자에게 적용한다. 그러나 사용자는 "희망 직무가 맞는 공고가 좋다 / 자소서 경험과 가까운 공고가 좋다 / 기술스택이 정확히 맞는 공고가 좋다 / 산업·근무지가 맞는 게 우선이다" 식으로 *우선순위가 다르다*. 본 페이지는 이를 5세트 가중치(A·B·C·D·E)로 분기하는 설계와 검증 절차를 정의한다. **이 페이지가 현재 가장 최신 결정이며, 이후 확장은 모두 여기서 출발한다.**

---

## 1. 출발점 — 현재 상태 (2026-05-11 기준)

### 1.1 Model C 가중치 (단일, 모든 사용자 공통)

`gemini_profile_faiss_matching.ipynb` Cell #29 코드 그대로:

```python
WEIGHTS = {
  'role_semantic':       0.35,
  'hard_skill':          0.20,
  'competency':          0.15,
  'achievement':         0.10,
  'industry':            0.10,
  'quality_adjustment':  0.10,
}
```

| 요소 | 계산 | 의미 |
|---|---|---|
| `role_semantic` | Model B(Gemini profile SBERT) cosine | 직무 의미 유사도 |
| `hard_skill` | Jaccard(user `hard_skills`+`tools`, JD `required`+`preferred_skills`) | 하드스킬 교집합 |
| `competency` | Jaccard(user `competencies`, JD `soft_competencies`) | 소프트 역량 교집합 |
| `achievement` | user `achievement_evidence` 풍부도 보너스 | 자소서 STAR 성과 근거 |
| `industry` | user `interestedIndustries_{1,2,3}` ↔ JD `industry` 1.0/0.6/0.0 | 산업 일치 |
| `quality_adjustment` | JD `posting_type` × 인코딩 페널티 | JD 품질 보정 (모든 관점 공통) |

### 1.2 5관점 라벨링 가중치 (이미 적용된 평가 프레임)

`docs/01_experiment_timeline.md` Φ5에서 *라벨링 시* 사용한 가중치(5자질 기반):

| 코드 | 시나리오 | 라벨링 가중치 |
|---|---|---|
| A. Job-Centric | 희망 직무가 맞는 공고가 좋다 | role 0.6 / skill 0.3 / industry 0.1 |
| B. Resume-Centric | 자소서 경험과 가까운 공고가 좋다 | star 0.5 / skill 0.3 / role 0.2 |
| C. Skill-Centric | 기술 스택이 정확히 맞는 공고가 좋다 | skill 0.7 / role 0.2 / industry 0.1 |
| D. Context-Fit | 산업·근무지가 맞는 것이 우선이다 | industry 0.5 / role 0.2 / context 0.3 |
| E. Mixed/Default | 균형 잡힌 추천 | 모든 필드 균등 |

> ⚠️ 라벨링 가중치와 fusion 가중치는 **별개**
> - **라벨링 가중치**(5자질: role/skill/industry/star/context): "이 (user, JD) 쌍을 라벨러가 어떤 기준으로 0~4점으로 채점할 것인가" → *정답을 만드는 자*
> - **fusion 가중치**(6요소: role_semantic/hard_skill/competency/achievement/industry/quality_adjustment): "Model C가 어떤 시그널을 얼마나 합산할 것인가" → *모델이 점수 매기는 자*
> - 둘이 일치해야 *해당 관점에서 모델이 1위*가 된다. 현재 fusion은 단일이므로 *라벨링이 어떤 관점이든 같은 가중치로 채점* → D 관점에서 fusion이 노이즈로 작용 (PDF §6.5).

### 1.3 현재 단일 가중치의 한계 정량 (인용)

`docs/01_experiment_timeline.md` Φ5.4 결과 재인용:

| 관점                 | 1위 setup | NDCG@5    | S09 순위 | S09 NDCG@5 |
| ------------------ | -------- | --------- | ------ | ---------- |
| A. Job-Centric     | S09      | 0.998     | 1      | 0.998      |
| B. Resume-Centric  | S09      | 0.893     | 1      | 0.893      |
| C. Skill-Centric   | S09      | 0.908     | 1      | 0.908      |
| **D. Context-Fit** | **S07**  | **0.882** | **4**  | **0.843**  |
| E. Mixed/Default   | S09      | 0.985     | 1      | 0.985      |

→ D 관점에서 S09(`profile + e5-small + cosine+overlap`, fusion 사용)가 S07(`profile + ko-sroberta + cosine`, fusion 미사용)에 0.039p 뒤짐. **fusion이 D 관점에서는 노이즈로 작용**. 원인: industry_match(이진 1/0)에 라벨링 가중치 0.5가 쏠려 있으나 fusion에서 `industry` 가중치는 0.10에 불과 → 산업 일치 신호가 과소 반영.

---

## 2. 핵심 아이디어 — 사용자 시나리오별 가중치 분기

### 2.1 작동 방식

```
사용자 온보딩 (1회)
    │ "당신에게 가장 중요한 것은?"
    │   ① 희망 직무가 맞는 공고
    │   ② 내 자소서 경험과 가까운 공고
    │   ③ 보유 기술 스택이 정확히 맞는 공고
    │   ④ 산업·근무지(컨텍스트)가 맞는 공고
    │   ⑤ 균형
    ▼
선택 결과 → perspective_code ∈ {A, B, C, D, E}
    │
    ▼
Model C 점수 계산 시
WEIGHTS = WEIGHTS_BY_PERSPECTIVE[perspective_code]
    │
    ▼
weighted_score = Σ WEIGHTS[k] * signal_k
```

### 2.2 설계 원칙 — 라벨링 자질 ↔ fusion 요소 매핑

라벨링 가중치(5자질)와 Model C fusion 가중치(6요소)는 어휘가 다르므로 매핑 규칙이 필요하다:

| 라벨링 자질 | → fusion 요소 | 매핑 근거 |
|---|---|---|
| `role` (희망직무 일치) | `role_semantic` | 둘 다 직무 적합도, 의미적 + enum 일치 모두 포함 |
| `skill` (스킬 일치) | `hard_skill` + `competency` | 라벨링의 skill은 하드+소프트를 합친 개념, fusion에서는 분리 |
| `industry` (산업 일치) | `industry` | 동일 |
| `star` (자소서 경험 유사) | `achievement` | 둘 다 자소서 STAR/성과 근거 |
| `context` (현재 industry로 폴백) | `industry`에 가중 합산 또는 별도 구현 | PDF §7.4 — `context` 자질이 placeholder인 한계 그대로 |
| (해당 없음) | `quality_adjustment` | JD 품질 보정, 모든 관점 공통 (=0.10 고정) |

> quality_adjustment는 분기 대상 아님
> JD 품질(`posting_type`=`job_posting` vs `training_program`, 인코딩 깨짐 페널티 등)은 사용자 시나리오와 무관한 *데이터 측 보정*이므로 5관점 모두 0.10 고정. 이는 raw-company-jobdescription-EDA의 *채용 외 콘텐츠 36.5% 혼입* 문제를 보정하는 장치이기도 함.

---

## 3. 한계 진단을 가중치 설계로 흡수 (PDF §7 항목별)

| PDF 한계 | 본 설계가 해결하는 방식 | 잔여 |
|---|---|---|
| **7.4** `context` placeholder | 매핑에서 `context` → `industry` 가중치 흡수 (단기), `context` 별도 시그널 구현 (중기) | `근무지/지역` 자질 구현은 별도 작업 |
| **7.5** 후보 풀 self-advantage (own 6 + other 2 + random 2) | 본 설계와 별개. 단, 분기 가중치를 *공통 후보 풀*에 적용해 평가하면 advantage 효과 제거 가능 | 액션 #3(공통 후보 풀) 의존 |
| **6.5** D 관점 fusion 노이즈 | **D 가중치에서 `industry` = 0.55로 격상** → D 라벨과 정합 | 검증 §6에서 확인 필요 |
| **7.2** 휴리스틱 Judge 순환 편향 | 본 설계와 별개. fusion 가중치를 어떻게 분기하든 Judge가 같은 휴리스틱이면 *profile 계열 일반 우위*는 유지 | → exp-019/020 LLM 독립 라벨로 확인·완화 (Gemini Judge 폐기) |
| **7.3** 채점 가중치 임시 | **본 설계 자체가 임시값**. §4의 숫자도 직관 매핑 → §6 그리드 탐색으로 갱신 필요 | 본 페이지 §6 |

---

## 4. 분기 가중치 5세트 — 직관 설계 초기값 (v0)

각 세트 합 = 1.000. **각 관점의 라벨링 가중치와 매핑 규칙에 따라 직관 설계**한 v0. 검증 후 §6 그리드로 갱신.

### A. Job-Centric (희망 직무 일치 최우선)

라벨링: `role 0.6 / skill 0.3 / industry 0.1`

| 요소 | 가중치 | 이유 |
|---|---|---|
| `role_semantic` | **0.50** | role 0.6에 정합. 직무 enum + 의미 일치 둘 다 강조 |
| `hard_skill` | 0.15 | skill 0.3 중 하드 절반 |
| `competency` | 0.10 | skill 0.3 중 소프트 절반 |
| `achievement` | 0.05 | STAR는 부차 |
| `industry` | 0.10 | 라벨링 그대로 |
| `quality_adjustment` | 0.10 | 공통 |
| **합** | **1.00** | |

### B. Resume-Centric (자소서 경험과의 유사도 최우선)

라벨링: `star 0.5 / skill 0.3 / role 0.2`

| 요소 | 가중치 | 이유 |
|---|---|---|
| `role_semantic` | 0.20 | role 0.2 그대로 |
| `hard_skill` | 0.15 | skill 0.3 중 하드 절반 |
| `competency` | 0.10 | skill 0.3 중 소프트 |
| `achievement` | **0.35** | **★ star 0.5에 정합** — STAR/성과 근거 강조 |
| `industry` | 0.10 | 부차 |
| `quality_adjustment` | 0.10 | 공통 |
| **합** | **1.00** | |

### C. Skill-Centric (기술 스택 정확 일치 최우선)

라벨링: `skill 0.7 / role 0.2 / industry 0.1`

| 요소 | 가중치 | 이유 |
|---|---|---|
| `role_semantic` | 0.15 | role 0.2 |
| `hard_skill` | **0.45** | **★ skill 0.7 중 하드** 비중 ↑ (정확 일치 강조) |
| `competency` | 0.15 | skill 0.7 중 소프트 |
| `achievement` | 0.05 | 부차 |
| `industry` | 0.10 | 라벨링 그대로 |
| `quality_adjustment` | 0.10 | 공통 |
| **합** | **1.00** | |

### D. Context-Fit (산업·근무지가 우선) — **D 관점 역전 해소 목표**

라벨링: `industry 0.5 / role 0.2 / context 0.3`. context placeholder → industry로 흡수.

| 요소 | 가중치 | 이유 |
|---|---|---|
| `role_semantic` | 0.15 | role 0.2 |
| `hard_skill` | 0.10 | 부차 |
| `competency` | 0.05 | 부차 |
| `achievement` | 0.05 | 부차 |
| `industry` | **0.55** | **★ industry 0.5 + context 0.3 흡수** — 현재 0.10 → 5.5배 격상 |
| `quality_adjustment` | 0.10 | 공통 |
| **합** | **1.00** | |

> D 가중치는 본 설계의 *검증 가능한 핵심 가설*
> S09가 D 관점에서 0.843(4위)인 이유 = `industry` 가중치 0.10 부족. 이 가중치를 0.55로 격상하면 D 관점 NDCG@5가 회복되는가? 본 페이지 §6 검증의 1순위 질문.

### E. Mixed/Default (균형)

라벨링: 모든 필드 균등.

| 요소 | 가중치 |
|---|---|
| `role_semantic` | 0.20 |
| `hard_skill` | 0.20 |
| `competency` | 0.15 |
| `achievement` | 0.15 |
| `industry` | 0.20 |
| `quality_adjustment` | 0.10 |
| **합** | **1.00** |

### 4.1 요약 표 (한눈에)

| 요소 | A Job | B Resume | C Skill | D Context | E Mixed | 현행 단일 |
|---|---|---|---|---|---|---|
| role_semantic | **0.50** | 0.20 | 0.15 | 0.15 | 0.20 | 0.35 |
| hard_skill | 0.15 | 0.15 | **0.45** | 0.10 | 0.20 | 0.20 |
| competency | 0.10 | 0.10 | 0.15 | 0.05 | 0.15 | 0.15 |
| achievement | 0.05 | **0.35** | 0.05 | 0.05 | 0.15 | 0.10 |
| industry | 0.10 | 0.10 | 0.10 | **0.55** | 0.20 | 0.10 |
| quality_adjustment | 0.10 | 0.10 | 0.10 | 0.10 | 0.10 | 0.10 |
| **합** | **1.00** | **1.00** | **1.00** | **1.00** | **1.00** | **1.00** |

→ 굵게 표시한 셀이 *각 관점의 시그니처 요소*.

---

## 5. 구현 계획

### 5.1 코드 변경 위치

`gemini_profile_faiss_matching.ipynb` Cell #29 (`WEIGHTS = {...}` 정의)을 다음으로 교체:

```python
WEIGHTS_BY_PERSPECTIVE = {
  'A': {'role_semantic': 0.50, 'hard_skill': 0.15, 'competency': 0.10,
        'achievement': 0.05, 'industry': 0.10, 'quality_adjustment': 0.10},
  'B': {'role_semantic': 0.20, 'hard_skill': 0.15, 'competency': 0.10,
        'achievement': 0.35, 'industry': 0.10, 'quality_adjustment': 0.10},
  'C': {'role_semantic': 0.15, 'hard_skill': 0.45, 'competency': 0.15,
        'achievement': 0.05, 'industry': 0.10, 'quality_adjustment': 0.10},
  'D': {'role_semantic': 0.15, 'hard_skill': 0.10, 'competency': 0.05,
        'achievement': 0.05, 'industry': 0.55, 'quality_adjustment': 0.10},
  'E': {'role_semantic': 0.20, 'hard_skill': 0.20, 'competency': 0.15,
        'achievement': 0.15, 'industry': 0.20, 'quality_adjustment': 0.10},
}
DEFAULT_PERSPECTIVE = 'E'   # 온보딩 미응답자 fallback

def weighted_pair_score(user_idx, jd_idx, role_score, perspective='E'):
    W = WEIGHTS_BY_PERSPECTIVE.get(perspective, WEIGHTS_BY_PERSPECTIVE[DEFAULT_PERSPECTIVE])
    # ... (기존 계산 로직 유지, WEIGHTS → W)
```

→ `weighted_pair_score`와 호출부 `add_unique_candidate` / `make_search_results` 시그니처에 `perspective` 파라미터 추가.

### 5.2 사용자 온보딩 UX (운영 단계, Φ6)

PDF 다음 액션 #6 *"운영 적용 — S09를 기본값으로 하고, 온보딩에서 사용자 우선순위(직무/자기소개서/스킬/환경)를 받아 fusion 가중치와 백본을 분기"*의 구체화.

| 단계 | UI 문구 (안) | 매핑 |
|---|---|---|
| 1 | "추천을 받을 때 가장 중요한 기준을 골라주세요." | (5択) |
| 2-A | "희망 직무가 정확히 맞는 공고를 우선합니다." | → A |
| 2-B | "제 자기소개서 경험과 비슷한 공고를 우선합니다." | → B |
| 2-C | "제가 가진 기술 스택이 정확히 맞는 공고를 우선합니다." | → C |
| 2-D | "원하는 산업·근무지에 속한 공고를 우선합니다." | → D |
| 2-E | "특별한 우선순위 없이 균형 있게 추천받겠습니다." | → E (기본) |

### 5.3 데이터 변경 없음

- `data/user_data.csv`, `data/company_jobdescription.csv` 변경 없음
- `data/gemini_cache/{user_profile,jd_profile,judge}` 변경 없음 (Judge는 가중치와 독립)
- 변경 산출물: `data/gemini_profile_outputs/exp_results_by_perspective_weight.csv` (신규)

---

## 6. 검증 절차 — 25셀 매트릭스

### 6.1 핵심 가설

> *관점 i의 라벨로 평가했을 때, 관점 i의 가중치를 쓴 모델이 1위여야 한다.*

이를 확인하려면 동일 500쌍 라벨(`benchmark_labeled_100_{A..E}.csv`)에 대해 **5세트 가중치를 각각 적용**해 NDCG@5 25셀 매트릭스를 만든다.

> ⚠️ ★ 2026-05-17 정정 — *동일 500쌍* 가정 폐기
> 본 §6 초안은 *"동일 500쌍 라벨에 5세트 가중치 적용 → 25셀 매트릭스"*로 작성됐으나, raw CSV 분석 결과 **5관점 500쌍이 *동일 쌍의 5중 라벨*이 아니라 *서로 다른 49명에서 뽑은 독립 500쌍*** (`docs/05_benchmark_100pairs_analysis.md` §1·§4).
> **재해석:** 25셀은 *각 관점의 100쌍 데이터셋*에 *5세트 가중치를 각각 적용*해 NDCG@K 측정. 즉 *행=가중치 / 열=평가 데이터셋*. 대각선 i,i가 *해당 데이터셋 내에서* 다른 가중치 대비 1위가 합격 조건. (자세한 25셀 의미는 `docs/05_benchmark_100pairs_analysis.md` §4 참조)
> **paired test 불가**: 동일 쌍이 5번 라벨된 게 아니므로 paired Wilcoxon은 불가. independent samples 비교 또는 *공통 후보 풀 트랙 신설* 필요 (PDF §7.5).

### 6.2 측정 표 (목표 — 대각선이 1위가 되어야 한다)

|  | 평가 라벨 A | 평가 라벨 B | 평가 라벨 C | 평가 라벨 D | 평가 라벨 E |
|---|---|---|---|---|---|
| **가중치 A** | **목표 1위** | … | … | … | … |
| **가중치 B** | … | **목표 1위** | … | … | … |
| **가중치 C** | … | … | **목표 1위** | … | … |
| **가중치 D** | … | … | … | **목표 1위** | … |
| **가중치 E** | … | … | … | … | **목표 1위** |
| 단일(현행) | 0.998 | 0.893 | 0.908 | 0.843 | 0.985 |

→ 대각선이 단일보다 높으면 분기가 효과적. 대각선이 단일과 같거나 낮으면 *그 관점에서 분기는 무효* (그리드 탐색 필요).

### 6.3 합격 기준 (제안)

- **필수:** 모든 관점에서 *분기 가중치* NDCG@5 ≥ *단일 가중치* NDCG@5 + 0.01 (PDF §7.1 표본 변동 0.01~0.03 고려, 보수적으로 0.01)
- **D 관점 특별 조건:** D 라벨 × D 가중치 NDCG@5 ≥ 0.882 (S07이 단일 가중치로 도달한 D 1위)
- **불합격 시:** 해당 관점만 §6.4 그리드 탐색

### 6.4 가중치 그리드 탐색 (불합격 시)

각 요소를 [0.05, 0.10, 0.15, 0.20, 0.30, 0.40, 0.50, 0.55] 격자로 검색. 6요소 × 8값 = 너무 큼 → 합 1.0 제약 + quality_adjustment 0.10 고정 + 5요소 simplex grid (해당 관점 시그니처 요소를 0.30~0.60 범위, 나머지는 보조 격자).

단순화 옵션: *해당 관점 시그니처 요소만 0.30~0.60에서 5단계 탐색*하고 나머지는 §4 v0 비율 유지 → 25 trials per perspective.

---

## 7. 평가 프레임 확장 — 50셀 → 75셀(?)

`docs/01_experiment_timeline.md` Φ5의 50셀(10 setup × 5 관점)에서 본 설계는 다음 두 트랙을 추가:

- **트랙 X (관점별 가중치 검증):** 5세트 가중치 × 5관점 라벨 = 25셀 (위 §6.2 대각선)
- **트랙 Y (단일 vs 분기 비교):** 단일 가중치(S09) × 5관점 라벨 vs 분기 가중치 × 같은 라벨 = 10셀

총 50 + 25 + 10 = **85셀**로 평가 프레임이 확장됨.

> ⚠️ 표본 크기 제약
> PDF §7.1: 관점당 100쌍에서 NDCG@5 차이 0.01~0.03은 표본 변동 안. 분기 가중치 효과를 *통계적으로* 인정하려면 **PDF 액션 #2(N=30 → 1,500쌍)** 또는 *Wilcoxon 부호순위 검정*을 본 페이지 검증에도 적용해야 함.

---

## 8. 이 설계의 한계 · 비판 · 모순

| # | 한계 | 영향 |
|---|---|---|
| L1 | §4 가중치는 *직관 매핑*. 학습/사용자 설문 미반영 | PDF §7.3 한계 그대로 재현. v1에서 그리드 탐색 필수 |
| L2 | 라벨링 가중치(5자질) ↔ fusion(6요소) 매핑이 *1:1이 아니다* (skill → hard_skill + competency / context → industry) | 매핑 모호성. 다른 매핑(예: skill → hard_skill만)으로도 합리적일 수 있어 ablation 필요 |
| L3 | 본 설계는 *Model C에만* 적용. S05·S07 같은 fusion 미사용 setup은 분기 대상 아님 | D 관점이 *fusion 없는 setup이 1위*인 한, 분기만으로는 부족할 수 있음 — *D 관점은 fusion off*가 답일 가능성 잔존 |
| L4 | 관점 *선택* 자체가 새로운 UX 비용 | 운영 단계에서 관점 미선택자 비율 추적 필요 (E fallback) |
| L5 | 순환 편향 — Judge가 휴리스틱(profile overlap)인 한, 어떤 가중치 분기도 *profile 계열 일반 우위*에서 자유롭지 않다 | → exp-019/020에서 *확인·완화*(Gemini Judge 폐기) |
| L6 | `context` 자질이 여전히 미구현 — D 가중치 0.55는 `industry`에 흡수해 둔 임시 봉합 | 별도 작업: 근무지/지역 텍스트 정규화 + JD `location` 필드 추가 |

---

## 9. 다음 단계 (Φ7 — 이 페이지 이후의 실험들)

| 우선순위 | 작업 | 입력 | 출력 |
|---|---|---|---|
| **1** | `WEIGHTS_BY_PERSPECTIVE` 코드화 + 25셀 매트릭스 측정 (기존 500쌍 라벨 재활용) | `benchmark_labeled_100_{A..E}.csv` | `exp_results_by_perspective_weight.csv` |
| 2 | 단일 vs 분기 NDCG@5 차이의 Wilcoxon 부호순위 검정 (per-query 페어) | 위 결과 | p-value 표 |
| 3 | D 관점 합격 실패 시 — D 가중치만 grid (industry 0.30~0.60 × 5) | 25셀 결과 | D-only grid 결과 |
| 4 | ~~Gemini Judge 활성화~~ 폐기 → LLM 직접 채점 + 인간 κ로 순환 편향 진단·완화 (exp-019/020) | LLM 독립 라벨 | 신뢰 평가 |
| 5 | PDF 액션 #2(N=30 확장) 후 25셀 재측정 — 통계적 유의성 확보 | 1,500쌍 새 라벨 | 새 25셀 |
| 6 | 온보딩 UX 프로토타입 + 사용자 관점 선택 분포 측정 (운영 단계) | 실사용자 N명 | 관점별 선택 빈도 |
| 7 | `context` 자질 별도 구현 — 근무지/지역 매칭 — D 가중치 *재분리* | JD `location` 필드 추가 | context 신호 적용 D |

→ 1~3번이 본 설계의 *직접 검증*. 4~7번은 본 설계가 향하는 *완성 형태*.

---

## 10. 차별성 5축과의 연결

| 축 | 본 설계가 강화하는 것 |
|---|---|
| ① 자기소개서 정성 | B 관점 가중치에서 `achievement` 0.35 — STAR 성과 근거 활용 명시화 |
| ② 한국어 | (백본 무관 — fusion 가중치는 임베딩 모델 위에서 작동) |
| ③ 양방향 매칭 | 본 설계는 *user→JD* 방향에 한정. JD→user 방향에는 *기업이 어떤 인재를 원하는가*의 관점 분기가 필요 (별도 작업) |
| ④ GT 부재 | **본 페이지의 본질** — *어떤 GT인지*를 사용자가 선택. 단일 평균 GT가 정답이라는 가정 자체를 거부 |
| ⑤ End-to-End LLM | 본 설계는 *분리 구조*(LLM profile + SBERT embed + 휴리스틱 fusion)에 머무름 — LLM이 가중치 자체를 추론하는 형태는 미구현 |

---

## 관련 페이지

- `docs/01_experiment_timeline.md` — 본 설계의 출발점 (Φ5의 D 관점 역전 발견)
- raw-user-data-EDA — interestedJobs/Industries 분포 (관점 분포 가설의 데이터 근거)
- raw-company-jobdescription-EDA — JD posting_type / quality_flags가 `quality_adjustment` 가중치의 입력
- 합성-GT-구성 — 5관점 라벨링이 곧 합성 GT의 *관점 분리 버전*
- Ablation-Study-설계 — 본 페이지 §6 그리드 탐색이 곧 ablation 케이스
- LLM-as-a-Judge — Φ7 4번에서 활성화 필요
- Dual-Encoder-구조 — Model C가 사용하는 인코더 구조 (분기는 fusion 층에서만 일어남)
- 6차원-역량벡터 — `competency` 자질의 어휘 정의 (Q-D2 미해결)
- 개정쌍-방향성-검증 — 차별성 ③(양방향) 보완

## 출처

- `raw/experiments/중간_보고서_이상엽.pdf` §6.5 (D 관점 fusion 노이즈 해석), §7.3 (가중치 임의성 한계), §8 액션 #4·#6 (관점별 grid + 운영 분기)
- `data/gemini_profile_faiss_matching.ipynb` Cell #29 (`WEIGHTS` dict 정의), Cell #30 (`weighted_pair_score` 호출)
- `data/gemini_profile_outputs/exp_results_NDCG5.csv` (D 관점 S09=0.843 / S07=0.882 수치)
- `data/gemini_profile_outputs/benchmark_labeled_100_{A..E}.csv` (검증용 500쌍 라벨)
- 사용자 결정 (2026-05-17 대화): *"이게 가장 최신이야. 여기 이후로 확장해야함"*

## 메타

- 작성일: 2026-05-17
- 마지막 갱신: 2026-05-17
- 상태: **설계안 v0 — 검증 전**
- 다음 갱신 트리거: §6 25셀 매트릭스 측정 완료 시
- 태그: #실험설계 #fusion가중치 #관점분기 #평가프레임 #최신결정