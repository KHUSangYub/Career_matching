# 실험 타임라인 — Baseline FAISS → Gemini Profile → 5관점 평가

> 내 연구 관점에서의 핵심 takeaway
> - **어느 차별성 축에 연결되는가:** ① 자기소개서 정성, ③ 양방향 매칭, ④ GT 부재, ⑤ End-to-End LLM
> - **무엇을 강화/위협하는가:** 두 차례의 노트북(`baseline_faiss_matching.ipynb` → `gemini_profile_faiss_matching.ipynb`)을 통해 *원문 단순 concat 임베딩*에서 *Gemini structured profile + 도메인 시그널 fusion*까지 진화. **fusion(profile overlap 30% 결합) 추가가 raw→profile 전처리보다 효과 크기가 2배 이상**(+0.054~+0.096 vs +0.004~+0.041, NDCG@5). 동시에 **5관점 분리 평가**가 "단일 평가셋 1위가 모든 관점에서 1위가 아니다"(D 관점에서 S09→S07로 역전)는 신호를 잡아내 *합성 GT 설계*가 차별성 ④의 본질임을 실증.
> - **위협:** Φ4~5의 Judge가 *휴리스틱*(profile overlap 기반)이라 profile 계열 setup이 구조적으로 유리한 **순환 편향(circularity bias)** 존재. → `docs/13_independent_eval.md`에서 **LLM 독립 라벨로 진단·완화** 확인. *(구 'Gemini Judge 교체' 트랙은 2026-05-31 폐기 — 라벨링은 LLM 직접 채점.)*
> - **영향 부위:** Dual Encoder 구조, 합성 GT 구성, fusion 가중치 설계, 인코더 모델 선택
> - **당장 가져갈 1개 액션:** S09(`profile + e5-small + cosine+overlap`)를 기본값으로 두되, D 관점 예외에 대응하기 위해 *관점별 fusion 가중치 그리드 탐색*을 Ablation-Study-설계에 우선 등재.

## 한 줄 요약

2026-03 합성 데이터 완성 후, **5월 11일까지 두 번의 매칭 실험 노트북**으로 다음 진화를 달성: (1) **baseline** = `userText concat + jdText concat → KR-SBERT → FAISS cosine`, GT 없이 정성 검증만 가능 → (2) **gemini_profile** = Gemini로 user/JD를 동일 JSON schema profile로 정규화 → 3개 모델(Baseline A / Model B / Model C) × 100쌍 벤치마크 → (3) **5관점 확장 실험** = 동일 100쌍을 5관점(Job/Resume/Skill/Context/Mixed)으로 재라벨, 10개 setup × 5관점 직교 평가. 최종 1위 = **S09(profile + e5-small + cosine+overlap)** NDCG@5 평균 **0.925**.

---

## 0. 전체 타임라인 (한눈에)

| Phase | 기간 | 핵심 산출물 | 위치 |
|---|---|---|---|
| Φ0. 문헌·연구공백 | 2026-03 | PJF 4세대(CNN→BERT+그래프→대조학습→LLM) 정리, 국내 R&D 보고서 검토 | research-context |
| Φ1. 데이터 EDA + 합성 생성 | 2026-03 | Careermizing 실데이터 ≈300행 EDA → 합성 1k 페르소나 → user_data.csv 11,986행; JD 크롤링 235,850행 | raw-user-data-EDA, raw-company-jobdescription-EDA, `data/data_build_plan.md` |
| Φ2. 역량 추출 파이프라인 | 2026-04 | 자소서→STAR 분해 + 다차원 역량 (user_data에 동봉), JD 역량 추출 병행, 일관성 측정(BGE-M3 5회 cos), LLM-as-a-Judge 1차 | (user_data 컬럼 `Situation/Task/Action/Reason/Result/ability_*`) |
| **Φ3. Baseline FAISS** | **2026-04 후반** | `baseline_faiss_matching.ipynb` — KR-SBERT 단일, 1k user × 1k JD, GT 부재, 정성 정량 평가만 | `data/baseline_faiss_matching.ipynb`, `raw/experiments/baseline_evaluation_report.md` |
| **Φ4. Gemini Profile + 3모델** | **2026-04~05 초** | `gemini_profile_faiss_matching.ipynb` — Gemini JSON schema profile, Baseline A / Model B / Model C, 100쌍 벤치마크, heuristic Judge | `data/gemini_profile_faiss_matching.ipynb`, `data/gemini_cache/{user_profile,jd_profile,judge}`, `data/gemini_profile_outputs/` |
| **Φ5. 5관점 확장 평가 (중간보고)** | **2026-05-11** | 10 setup × 5 관점 = 50셀, NDCG@5 평균 1위 S09=0.925, D 관점만 S07 역전 | `raw/experiments/중간_보고서_이상엽.pdf`, `data/gemini_profile_outputs/exp_results_*.csv` |
| Φ6 (진행) | 2026-05~06 | learnable fusion 트랙 ⑧ — 황금/학습 가중치(exp-017/018), LLM 독립 라벨 검증(exp-019/020). 다음=V2 임베딩 head | (Gemini Judge·reranker 트랙 폐기) |

---

## Φ0. 문헌 조사 — 연구 공백 확립 (2026-03)

PDF §2.1: Person-Job Fit **4세대 흐름** 정리.

| 세대 | 기법 | 본 연구의 입장 |
|---|---|---|
| 1세대 | CNN/RNN (PJFNN-APJFNN) | 정량 스펙 중심 — 본 연구 자소서 정성에 부적합 |
| 2세대 | BERT + 그래프 (MV-CoN-DPGNN-InEXIT) | 다중관계 그래프, 클릭로그 GT 의존 |
| 3세대 | 대조학습 (ConFit-ConFitV2) | 비대칭 처리 노하우 흡수 가능 |
| 4세대 | LLM (LANTERN-Skill-LLM-HRGraph) | **현재 본 연구 위치** — 영어권 중심 / GT 가정 / 단방향 → 한국어·중소기업·양방향·GT부재로 변형 |

**국내 채용 매칭 연구 (KISTI-매칭코디네이터, ETRI-Insight-2019, 워크넷-AI매칭)**: 정량 매칭/단방향/한국어 자소서 미사용 → 본 연구 공백 확립.

---

## Φ1. 데이터 EDA + 합성 데이터 생성 (2026-03)

### 1.1 Careermizing 실데이터 EDA → 합성 데이터로 대체

PDF §2.1: *"Careermizing 사용자 데이터(약 300행) EDA"* 수행 후, **개인정보 보호 이슈로 팀 공유 불가** → `data/data_build_plan.md`(2026-03-29)에 따라 **GPT-4.1로 합성 1,000명 페르소나 + 자기소개서**를 새로 생성.

**최종 합성 산출물:** `data/user_data.csv` — 999명·11,986행·45컬럼. 상세 분석: raw-user-data-EDA.

핵심 컬럼(이후 모든 실험에서 사용):
- 기본: `userId`, `education`, `university`, `major`, `interestedIndustries_1/2/3`, `interestedJobs_1/2/3`
- 자소서: `question`, `draftContent`(평균 573자)
- STAR: `Title`, `Situation`, `Task`, `Action`, `Reason`, `Result`
- 역량(이미 추출 완료): `ability_count=3`, `ability_{0,1,2}_{keyword,name,definition,reason}`

### 1.2 JD 크롤링

PDF §2.1: *"공개 채용 플랫폼 기반 중소기업 JD 크롤링"*. 산출물 = `data/company_jobdescription.csv` — **235,850건·52,243 기업**. 상세 분석: raw-company-jobdescription-EDA.

> ⚠️ EDA에서 발견된 불일치
> EDA 결과(상위 company_name 패턴, skills/benefits 값 분포)는 *링커리어 계열 종합 취업 플랫폼* 추정 — 사람인/잡코리아 가정과 불일치. *채용 외 콘텐츠(공모전·교육·서포터즈)가 36.5%*. open-questions Q-D1 확인 필요.

---

## Φ2. 역량 추출 파이프라인 (2026-04)

PDF §2.1:
- **자기소개서 → STAR 분해 + 다차원 역량 벡터** — 합성 데이터 생성 시 동봉되어, user_data.csv의 STAR 5컬럼·ability_{0,1,2} 슬롯에 이미 결과가 들어 있음.
- **JD 측 병행 추출** — Φ4 노트북에서 `JD_PROFILE_SCHEMA`로 실제 구현됨.
- **역량 추출 일관성 측정** — *동일 입력 5회 반복 BGE-M3 코사인 유사도*. (코드 미공개, PDF §2.1 문장만 존재)
- **LLM-as-a-Judge 1차 추출 품질 평가** — Φ4 노트북 `judge_prompt` 함수에서 v1 구현.

---

## Φ3. Baseline FAISS 노트북 (2026-04 후반)

📁 `data/baseline_faiss_matching.ipynb` (12 셀)

### 3.1 파이프라인

```
user_data.csv (11,986행) ──[groupby userId]──> 999명 집계
                                  │ first(major, university, interestedIndustries_1, interestedJobs_1)
                                  │ join all draftContent + set(ability_0_keyword)
                                  ▼
                        df_user_sample (n=999, random_state=42)
                                  │
                        user_text = ability_0_keyword + " " + draftContent
                                  ▼
                        KR-SBERT (snunlp/KR-SBERT-V40K-klueNLI-augSTS)
                                  │ normalize_embeddings=True
                                  ▼
                        user_embeddings (999, 768) 

company_jobdescription.csv (235,850행) ──[sample 1000, random_state=42]──> df_jd_sample
                                  │
                        jd_text = duties_clean + " " + detail_text_clean
                                  ▼
                        KR-SBERT → jd_embeddings (1000, 768)
                                  ▼
                        faiss.IndexFlatIP(768).add(jd_embeddings)
                                  ▼
                        index.search(user_embeddings, k=5)
```

### 3.2 입력 텍스트 정의 (이 시점의 *전처리 = 단순 concat*)

| 측 | 텍스트 = | 비고 |
|---|---|---|
| User | `ability_0_keyword + " " + draftContent` | **ability_0만** 사용 (1·2 슬롯 누락), draftContent는 6개 작성본 join — 같은 자소서 중복 가중치 발생 가능 |
| JD | `duties_clean + " " + detail_text_clean` | duties_clean이 83.8% 결측이므로 사실상 detail_text_clean 단독 |

### 3.3 결과 (정성 검증만)

`raw/experiments/baseline_evaluation_report.md` 기록:

- **속도:** 1k×1k CPU에서 빠름. 10만 건 단위 확장 시에도 실시간 가능.
- **품질:** GT 없어 NDCG/Precision **측정 불가**.
- **정성 사례 (P0950, `보건환경융합과학` 전공 / `정보수집·분석·리더십·실행력`):**

| Rank | 매칭된 공고 | Score |
|---|---|---|
| 1 | 업라이즈 — cx/운영 헤이비트(HEYBIT) CS/CX 인턴 | 0.7205 |
| 2 | 카카오엔터프라이즈 — 2021년 정보보안 인증 인턴 | 0.7089 |
| 3 | 그린코드 — AI x ESG 실전 프로젝트 동아리 모집 | 0.6965 |
| 4 | 하이퍼리즘 — 사업개발 인턴 | … |
| 5 | … | … |

→ 전공·희망직무와 무관한 CS/CX·동아리 모집이 Top-5에 들어감.

**원인 진단(보고서 §3):**
1. **역량 추출 부재** — 합성 데이터에 STAR/ability가 이미 있는데도 노트북은 활용하지 않음(`draftContent`만 concat).
2. **지원자(서술형)와 JD(명사형) 비대칭** — 임베딩 공간 정합 불가.
3. **필터링 부재** — 신입↔10년차, 지역 불일치 무시.
4. **객관 평가 프레임 부재** — 수치 비교 불가.
5. **JD 노이즈** — 공고 본문에 회사 연혁/템플릿 텍스트 다수.

→ Φ4 노트북의 설계 동기가 됨.

---

## Φ4. Gemini Profile 노트북 — 3 모델 비교 + 100쌍 벤치마크 (2026-04~05 초)

📁 `data/gemini_profile_faiss_matching.ipynb` (44 셀)

### 4.1 핵심 변경점 vs Baseline

| 항목 | Baseline (Φ3) | Gemini Profile (Φ4) |
|---|---|---|
| User 집계 | `groupby + join all draftContent` | `drop_duplicates(['resume_writingId','draftContent'])` 후 join — **중복 가중치 제거** |
| User 텍스트 | `ability_0_keyword + draftContent` | STAR + ability 3슬롯 + question + categoryName 전부 + Gemini로 정형화한 `embedding_summary` |
| JD 입력 | `duties_clean + detail_text_clean` 단순 concat | `회사명/공고명/태그/주요업무/스킬/상세공고`로 라벨링한 후 Gemini로 정형화 |
| 임베딩 | KR-SBERT 단일 | KR-SBERT (기본), e5-small/ko-sroberta/KR-SBERT/TF-IDF로 확장 가능 |
| GT | 없음 | **휴리스틱 Judge로 0~4점 라벨 (100쌍)** |
| 평가 | 정성만 | NDCG@K, Precision@K, MRR@K, Spearman |

### 4.2 Gemini Structured Output 스키마

#### USER_PROFILE_SCHEMA (필수 9키)

```json
{
  "target_jobs": ["...", "...max 5"],
  "target_industries": ["...max 5"],
  "hard_skills": ["...max 12"],
  "tools": ["...max 12"],
  "achievement_evidence": ["...max 8"],
  "competencies": ["...max 10"],
  "job_relevance_summary": "string",
  "embedding_summary": "string",      ← Model B의 임베딩 입력
  "quality_flags": ["...max 8"]
}
```

#### JD_PROFILE_SCHEMA (enum 강제)

```json
{
  "posting_type": ["job_posting" | "training_program" | "internship_program" |
                   "company_promotion" | "low_quality" | "unknown"],
  "job_role": <JOB_TAXONOMY 19개 중 1개>,
  "industry": <INDUSTRY_TAXONOMY 19개 중 1개>,
  "experience_level": ["new" | "experienced" | "both" | "intern" | "unknown"],
  "core_duties": [...max 8],
  "required_skills": [...],
  "preferred_skills": [...],
  "soft_competencies": [...],
  "culture_fit": [...],
  "jd_summary": "string",
  "embedding_summary": "string",      ← Model B의 임베딩 입력
  "quality_flags": [...]
}
```

#### 관련성 라벨 (0~4) — 휴리스틱 생성 → 현행 LLM 직접 채점

Φ4~5의 0~4 relevance 라벨은 **휴리스틱**(profile overlap 기반, 캐시 `_model: heuristic_fallback`)으로 생성됨 → profile 계열 setup이 구조적으로 유리한 **순환 편향** 내재(§7.2). **현행(2026-05-31): 라벨링은 LLM가 자소서·JD 원문을 직접 읽고 채점**(`docs/13_independent_eval.md`, API 0건). *구 'Gemini Judge(0~4) 프롬프트' 트랙은 비용으로 폐기.*

### 4.3 캐시 구조 (재현성·API 비용 절감)

```
data/gemini_cache/
├── user_profile/  ── 1,998 JSON (999명 × 2 버전: heuristic + gemini 분리 캐시)
├── jd_profile/    ── 2,000 JSON (1000건 × 2)
└── judge/         ──   200 JSON (100쌍 × 2)
```

캐시 키 = `sha256(kind | record_id | raw_text | PROFILE_ENGINE)[:24]`. 같은 입력은 API 재호출 없이 반환.

**현재 캐시 상태:** `_model` 필드가 모두 `heuristic_fallback` — **Gemini API 실호출 없이 휴리스틱 fallback으로 실행됨**. (`gemini-3-flash-preview` 모델명 + `GEMINI_API_KEY` 환경변수가 설정되면 실호출로 전환)

샘플 user_profile (P0001, `_model=heuristic_fallback`):
```json
{
  "target_jobs": ["rnd", "manufacturing", "quality"],
  "target_industries": ["semiconductor", "chemical_material", "automotive"],
  "hard_skills": ["VBA", "품질관리", "DOE"],
  "tools": ["VBA"],
  "achievement_evidence": ["분산성을 20% 개선", "전도도 18% 초과 달성", "데이터 정리 시간 75% 단축", ...],
  "competencies": ["문제해결","분석","협업","커뮤니케이션","리더십","실행력","기획","전략","성장","자동화"],
  "embedding_summary": "희망직무: rnd, manufacturing, quality / 희망산업: semiconductor, ... / 하드스킬: VBA, 품질관리, DOE / 성과근거: ..."
}
```

### 4.4 3개 모델 정의

| 모델 | 텍스트 | 임베딩 | 점수 |
|---|---|---|---|
| **Baseline A** | raw concat (회사명/공고명/태그/주요업무/스킬/상세공고) | KR-SBERT | cosine |
| **Model B** | Gemini `embedding_summary` (User·JD 양쪽) | KR-SBERT | cosine |
| **Model C** | Model B와 동일 텍스트·임베딩 | KR-SBERT | **profile-weighted score** (6요소 가중합) |

#### Model C 가중치 (`WEIGHTS` 초기값)

| 요소                 | 가중치  | 정의                                                                            |
| ------------------ | ---- | ----------------------------------------------------------------------------- |
| role_semantic      | 0.35 | Model B의 cosine 점수                                                            |
| hard_skill         | 0.20 | user `hard_skills+tools` ↔ JD `required+preferred_skills` Jaccard             |
| competency         | 0.15 | user `competencies` ↔ JD `soft_competencies` Jaccard                          |
| achievement        | 0.10 | user `achievement_evidence` 풍부도 보너스                                           |
| industry           | 0.10 | user `interestedIndustries_1/2/3` ↔ JD `industry` 1.0/0.6/0.0                 |
| quality_adjustment | 0.10 | JD `posting_type` (`job_posting`=1.0, `training_program`=0.35 …) + 인코딩 깨짐 페널티 |

### 4.5 100쌍 벤치마크 설계

- **유저 10명** = `interestedJobs_1` 별로 1명씩 + 부족분 랜덤 보충 (직무 다양성 보장)
- **유저당 후보 JD 10개** = Model B Top + Baseline A Top union → 중복 제거
- **총 100쌍** → 휴리스틱 Judge가 0~4점 라벨
- **저장:** `data/gemini_profile_outputs/benchmark_pairs_100.csv`, `benchmark_labeled_100.csv`, `search_results_top100.csv`, `weighted_results.csv`

### 4.6 100쌍 결과 (`benchmark_metrics.csv`)

| 모델 | NDCG@5 | NDCG@10 | Precision@5 | Precision@10 | MRR@10 | Spearman |
|---|---|---|---|---|---|---|
| Baseline A: raw SBERT | 0.422 | 0.716 | 0.02 | 0.07 | 0.148 | **−0.300** |
| Model B: Gemini profile SBERT | 0.421 | 0.700 | 0.04 | 0.07 | 0.113 | −0.204 |
| **Model C: profile weighted** | **0.805** | **0.907** | **0.10** | 0.07 | **0.342** | **+0.511** |

**관찰:**
- Baseline A와 Model B는 NDCG@5에서 **거의 차이 없음** (0.422 vs 0.421) — *전처리만으로는 효과 미미*
- **Model C(fusion)가 NDCG@5에서 +0.38p 점프** — *구조화 시그널 결합이 본질*
- Spearman 부호 역전 (−0.300 → +0.511): Baseline/Model B는 *judge 점수와 음의 상관* (즉 모델 점수가 높을수록 적합도 낮음, **랜덤보다 나쁨**), Model C에 와서야 양의 상관 회복

> Φ4 → Φ5 진화 동기
> 100쌍 평가에서 *"평균값만 봐선 어디가 좋은지 모른다"*는 신호 — 어떤 사용자는 직무, 어떤 사용자는 자소서 경험, 어떤 사용자는 산업·지역을 우선. *단일 GT 평균*은 이 차이를 가림 → Φ5의 **5관점 분리 라벨링**.

---

## Φ5. 5관점 확장 평가 — 중간보고서 (2026-05-11)

📁 `raw/experiments/중간_보고서_이상엽.pdf` + `data/gemini_profile_outputs/exp_results_{NDCG5,NDCG10,MRR10,Recall5,Recall10}.csv`

> ⚠️ ★ 2026-05-17 정정 — *"동일 100쌍 재라벨"* 표현은 사실과 다름
> 본 §5 작성 시 *"동일 100쌍을 5관점(A~E)으로 재라벨, 총 500쌍"*이라고 기재했으나, raw CSV(`benchmark_labeled_100_{A..E}.csv`) 직접 분석 결과 **5관점이 각각 다른 user 풀에서 뽑은 독립 100쌍**임이 확인됨.
> - 5관점 user 합집합 = **49명** (B와 C만 P0557 공유, 다른 모든 관점쌍 교집합 = 0)
> - 단일 100쌍의 10명 ∩ 5관점 49명 = **0명** (완전 분리)
> - 즉 **500쌍은 500개 *독립* 쌍**이지 *동일 100쌍의 5중 라벨*이 아님
> - 단일 100쌍 적합도 평균 1.45 vs 5관점 평균 2.1~2.9 — 환경 자체가 다름 → 단일 NDCG@5=0.805 vs 5관점=0.925 **직접 비교 금지**
> - 상세 정밀 분석: `docs/05_benchmark_100pairs_analysis.md` §1·§3

### 5.1 5관점 정의 (라벨링 기준 자체를 5가지로 분리)

| 코드 | 이름 | 시나리오 | 채점 가중치 |
|---|---|---|---|
| **A** | Job-Centric | 희망 직무가 맞는 공고가 좋다 | role 0.6 / skill 0.3 / industry 0.1 |
| **B** | Resume-Centric | 자소서 경험과 가까운 공고가 좋다 | star 0.5 / skill 0.3 / role 0.2 |
| **C** | Skill-Centric | 기술 스택이 정확히 맞는 공고가 좋다 | skill 0.7 / role 0.2 / industry 0.1 |
| **D** | Context-Fit | 산업·근무지가 맞는 것이 우선이다 | industry 0.5 / role 0.2 / context 0.3 |
| **E** | Mixed/Default | 균형 잡힌 추천 | 모든 필드 균등 |

**총 500쌍 라벨**(100쌍 × 5관점). `data/gemini_profile_outputs/benchmark_labeled_100_{A,B,C,D,E}.csv`로 저장 (각 100행 × 13컬럼, 10 user).

### 5.2 5개 도메인 시그널 (점수 근거 자질)

| 자질 | 비교 | 출력 |
|---|---|---|
| `role_match` | user `interestedJobs_1` ↔ JD `profile_job_role` (enum) | 0/1 |
| `industry_match` | user `interestedIndustries_*` ↔ JD `profile_industry` | 0/1 |
| `hard_skill` | user 스킬 집합 ↔ JD 요구 스킬 집합 | Jaccard [0,1] |
| `star_overlap` | user STAR 텍스트 ↔ JD 요약 텍스트 | 토큰 교집합 [0,1] |
| `context` | (현재 `industry_match`로 폴백, **미구현**) | placeholder |

### 5.3 10 setup × 5 관점 = 50셀 (`exp_setups.csv`)

| ID | 텍스트 | 임베딩 | 점수 결합 | 비교 의도 |
|---|---|---|---|---|
| S01 | raw | TF-IDF | cosine | 단순 baseline |
| S02 | raw | e5-small | cosine | |
| S03 | raw | ko-sroberta | cosine | |
| S04 | raw | KR-SBERT | cosine | |
| S05 | profile | TF-IDF | cosine | **전처리 효과** |
| S06 | profile | e5-small | cosine | |
| S07 | profile | ko-sroberta | cosine | |
| S08 | profile | KR-SBERT | cosine | |
| **S09** | **profile** | **e5-small** | **cosine + overlap** | **fusion 효과** |
| **S10** | **profile** | **ko-sroberta** | **cosine + overlap** | |

fusion = cosine 70% + 도메인 시그널 30%.

### 5.4 NDCG@5 결과 (메인 지표, `exp_results_NDCG5.csv`)

| Setup | 구성 | A | B | C | **D** | E | **평균** |
|---|---|---|---|---|---|---|---|
| S01 | raw + TF-IDF | 0.904 | 0.862 | 0.814 | 0.807 | 0.842 | 0.846 |
| S02 | raw + e5-small | 0.829 | 0.819 | 0.764 | 0.859 | 0.853 | 0.825 |
| S03 | raw + ko-sroberta | 0.843 | 0.787 | 0.812 | 0.832 | 0.801 | 0.815 |
| S04 | raw + KR-SBERT | 0.827 | 0.826 | 0.776 | 0.731 | 0.849 | 0.802 |
| S05 | profile + TF-IDF | 0.915 | 0.887 | 0.877 | 0.812 | 0.928 | 0.884 |
| S06 | profile + e5-small | 0.842 | 0.806 | 0.807 | 0.874 | 0.815 | 0.829 |
| S07 | profile + ko-sroberta | 0.854 | 0.847 | 0.835 | **0.882** | 0.863 | 0.856 |
| S08 | profile + KR-SBERT | 0.848 | 0.814 | 0.767 | 0.800 | 0.861 | 0.818 |
| **S09** | **profile + e5 + overlap** | **0.998** | **0.893** | **0.908** | 0.843 | **0.985** | **0.925** |
| S10 | profile + ko-sroberta + overlap | 0.975 | 0.873 | 0.869 | 0.857 | 0.978 | 0.910 |

→ **S09가 평균 1위(0.925), 5관점 중 4관점(A·B·C·E) 1위. D 관점에서만 S07이 0.882로 역전(S09는 0.843, 4위).**

### 5.5 보조 지표 (4지표 모두 S09 평균 1위)

| 지표 | S09 평균 | D 관점 1위 |
|---|---|---|
| NDCG@10 | 0.966 | S10(0.946) |
| MRR@10 | 0.900 | S10(0.833) / S05·S07 동률 |
| Recall@5 | 0.657 | S06(0.623) |
| Recall@10 | 1.000 (모든 setup) | — (후보 풀 10) |

→ NDCG@5에만 의존한 결론이 아님이 확인됨.

### 5.6 변경 요인별 효과 크기

| 변경 요인 | NDCG@5 변화량 |
|---|---|
| raw → profile (전처리만) | +0.004 ~ +0.041 |
| 임베딩 모델 교체 | ≈ 0.04 ~ 0.07 |
| **cosine → cosine+overlap (fusion 추가)** | **+0.054 ~ +0.096 (가장 큼)** |

**대표 사례:** S06 → S09 (`profile + e5-small` 동일, fusion 추가만) = 0.829 → 0.925 (**+0.096**).

### 5.7 D 관점 예외 해석 (PDF §6.5)

- D 관점 가중치 0.5가 `industry_match`(이진 1/0) 시그널에 쏠림 → 임베딩 코사인이 잡기 어려운 신호.
- fusion에서 도메인 시그널은 30% 가중치 → 산업 일치가 충분히 반영되지 않음.
- 결과: fusion이 D 관점에서는 *노이즈*로 작용, cosine 단독 S07이 1위.
- **함의:** *모든 관점에 동일 fusion 공식*은 부적절 → **관점별 fusion 가중치 그리드 탐색** 필요 (PDF 다음 액션 #4).

---

## 6. 종합 1위 / 관점별 1위 (PDF §6.3)

### 6.1 평균 NDCG@5 종합 순위 (Top 5 + Bottom 1)

| 순위 | Setup | 구성 | 평균 NDCG@5 |
|---|---|---|---|
| **1** | **S09** | profile + e5-small + overlap | **0.925** |
| 2 | S10 | profile + ko-sroberta + overlap | 0.910 |
| 3 | S05 | profile + TF-IDF | 0.884 |
| 4 | S07 | profile + ko-sroberta | 0.856 |
| 5 | S01 | raw + TF-IDF | 0.846 |
| … | … | … | … |
| 10 | S04 | raw + KR-SBERT | 0.802 |

### 6.2 관점별 1위 모델

| 관점 | 1위 Setup | S09 순위 |
|---|---|---|
| A. Job-Centric | S09 | 1위 |
| B. Resume-Centric | S09 | 1위 |
| C. Skill-Centric | S09 | 1위 |
| **D. Context-Fit** | **S07** (profile + ko-sroberta) | **4위** |
| E. Mixed/Default | S09 | 1위 |

---

## 7. 한계 (PDF §7) — 다음 실험을 결정한 6개

| # | 한계 | 영향 | 다음 액션과의 연결 |
|---|---|---|---|
| 7.1 | **표본 크기** 관점당 100쌍 → NDCG 0.01~0.03 차이는 표본 변동 안 | 미세 우열 판정 불가 | 액션 #2 (N=30 확장) |
| 7.2 | **휴리스틱 Judge 순환 편향** — Judge가 profile overlap 기반이라 S05~S10이 구조적 우위 | profile 계열 평균 우세가 과대평가 | → exp-019/020 LLM 독립 라벨로 진단·완화 (Gemini Judge 트랙 폐기) |
| 7.3 | **채점 가중치 임의** (0.6/0.3/0.1) | 5관점 라벨이 페르소나 직관 | 가중치 민감도 분석 필요 |
| 7.4 | **`context` 미구현** — `industry_match`로 폴백 | D 관점의 명목 0.8(industry+context)이 실제 industry 한 축 | context 자질 구현 |
| 7.5 | **후보 풀 self-advantage** — own 6 + other 2 + random 2, own이 해당 관점 가중치로 생성 | 같은 관점 setup이 advantage | 액션 #3 (공통 후보 풀 트랙) |
| 7.6 | **KR-SBERT 일관 하위** | 한국어 백본 격차 미정확 | 액션 #5 (KURE-v1, BGE-M3 추가) |

---

## 8. 다음 액션 — PDF §8 + 본 위키 시점에서의 우선순위

| 우선순위  | 작업                                           | 위키 연결                            |
| ----- | -------------------------------------------- | -------------------------------- |
| **1** | **V2 임베딩 head 학습** (KURE-v1/Qwen3) — 선형 가중치 한계가 exp-020에서 확인됨. 라벨링은 LLM 직접 채점 | `docs/10_learnable_fusion_plan.md` |
| 2     | 관점당 N=30 확장 (총 1,500쌍)                       | 합성-GT-구성                     |
| 3     | 공통 후보 풀 트랙 추가                                | 합성-GT-구성                     |
| 4     | 관점별 fusion 가중치 그리드 탐색 — D 관점 해소 확인           | Ablation-Study-설계            |
| 5     | KURE-v1, BGE-M3 추가 비교                        | BGE-M3, KoE5             |
| 6     | 운영 적용 — S09 기본값 + 온보딩 우선순위로 fusion 가중치/백본 분기 | (Φ6)                             |

추가 (본 위키 자체 시점):
- **L1.** 본 매칭 시스템의 *user 측은 합성 1k 페르소나(대기업 157개 지원)*인데 *JD 측은 52k 기업(58.7%가 1회성 게시 = 중소기업)* — user EDA §3.10 vs JD EDA §5.2의 *도메인 비대칭* (Q-D3)이 결과 일반화의 제약. 5관점 평가의 *D Context-Fit*이 정확히 이 비대칭을 잡는 신호.
- **L2.** JD가 *복합 플랫폼 크롤*이라 채용 외 콘텐츠 36.5% 포함 (Q-D1) — `posting_type` 필드(`job_posting` / `training_program` / `internship_program` / `low_quality`)가 이미 Model C `quality_adjustment` 가중치에 반영되어 있으나, 본 데이터 출처 자체를 다시 정의해야 함.
- **L3.** 차별성 ⑤ End-to-End LLM 관점에서, 현재 파이프라인은 *Gemini(profile) → SBERT(embedding) → Cosine + Fusion*으로 **여전히 분리 구조**. 진정한 End-to-End(LLM이 추출·매칭·설명까지)는 미구현.

---

## 9. 차별성 5축과의 연결 (이 실험 묶음 한 줄 정리)

| 축 | 본 실험 묶음이 검증한 것 | 미해결 |
|---|---|---|
| ① 자기소개서 정성 | Gemini로 STAR/ability 정형화 → embedding_summary가 raw concat보다 fusion 결합 시 +0.096 효과 | 자소서 *길이 부족*(평균 573자) — 신호 충분성 의문 |
| ② 한국어 | KR-SBERT/e5-small/ko-sroberta/TF-IDF/KR-SBERT 5종 비교 | KURE-v1, BGE-M3 (한국어 SOTA) 미포함 |
| ③ 양방향 매칭 | **단방향(user→JD)만 측정.** JD→user는 미구현 | 개정쌍-방향성-검증 필요 |
| ④ GT 부재 (★ 핵심 기여) | 5관점 분리 라벨 500쌍 → *단일 평균이 가린 차이* 검출 + **순환성 진단·완화**(exp-019/020 LLM 독립 라벨) | 인간 평가자 κ (future) |
| ⑤ LLM 역할 한정 | LLM=전처리(profile·enrich)·평가 라벨링만, 매칭=임베딩+fusion. End-to-End·LLM reranker *의도적 미채택* | 자체 학습 head(V2)는 미입증 future work |

---

## 관련 페이지

- raw-user-data-EDA — 본 실험의 user 측 데이터
- raw-company-jobdescription-EDA — JD 측 데이터 + 출처 불일치 경고
- Dual-Encoder-구조 — Φ4 Model B·C가 구현한 형태
- BGE-M3 / KoE5 — 다음 액션 #5의 비교 대상
- `docs/13_independent_eval.md` — 현행 평가 라벨링(LLM 직접 채점) · 구 'Gemini Judge 교체' 폐기
- `docs/10_learnable_fusion_plan.md` — 본 타임라인(Φ5) 이후의 노선 (Φ6 learnable fusion)
- 합성-GT-구성 — Φ5 5관점 라벨링이 실제 구현 사례
- STAR-프롬프트설계 — Gemini USER_PROFILE_SCHEMA의 `achievement_evidence`가 결국 STAR 추출
- 6차원-역량벡터 — Gemini `competencies` 필드가 매핑 대상 (Q-D2)
- Ablation-Study-설계 — 다음 액션 #4
- 개정쌍-방향성-검증 — 차별성 ③ 양방향 매칭 미구현 부분
- 프롬프트-일관성-측정 — Φ2의 BGE-M3 5회 반복 일관성 측정
- FAISS — Φ3·Φ4에서 `IndexFlatIP` 사용

## 출처

- `raw/experiments/중간_보고서_이상엽.pdf` (2026-05-11, PDF 7페이지)
- `raw/experiments/baseline_evaluation_report.md` (Φ3 정성 평가 보고서)
- `data/baseline_faiss_matching.ipynb` (12 셀, Φ3)
- `data/gemini_profile_faiss_matching.ipynb` (44 셀, Φ4·Φ5)
- `data/gemini_cache/{user_profile, jd_profile, judge}` — 1,998 / 2,000 / 200 캐시 JSON
- `data/gemini_profile_outputs/`:
  - `user_profiles.csv` (32 MB), `jd_profiles_sample1000.csv` (7.5 MB)
  - `search_results_top100.csv` (29 MB), `weighted_results.csv` (24 MB)
  - `benchmark_pairs_100.csv`, `benchmark_labeled_100.csv`, `benchmark_labeled_100_{A..E}.csv` (각 100행)
  - `benchmark_metrics.csv` (100쌍 v1 결과)
  - `exp_setups.csv`, `exp_results_{NDCG5, NDCG10, MRR10, Recall5, Recall10}.csv`, `exp_results_long.csv`

## 메타

- 작성일: 2026-05-17
- 마지막 갱신: **2026-05-31** — Gemini Judge(0~4) 트랙 흔적 삭제(전처리 profile은 유지), 순환편향→LLM 독립라벨(exp-019/020) 정정, §8 다음액션 #1을 V2로 교체, 차별성 ④⑤ 재서술.
- ⚠️ 페이지명 'baseline-to-gemini'는 Φ0~Φ5 시점 기준 — 이후 노선은 Gemini가 아니라 `docs/10_learnable_fusion_plan.md`으로 이어짐(Φ6).
- 태그: #실험 #타임라인 #FAISS #매칭 #EDA #평가