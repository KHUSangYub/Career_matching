# 합성 유저 데이터 구축 Context

> **작성일:** 2026-03-29
> **담당:** 이상엽
> **목적:** 팀원 공유 가능한 가상 자기소개서 데이터셋 1,000명 규모 구축
> **출력 포맷 기준:** `data/user_data.csv`

---

## 0. 배경 및 목적

실제 Careermizing 사용자 데이터는 개인정보 보호 이슈로 팀원에게 직접 공유할 수 없다. 대신 기존 데이터의 **구조·분포·패턴을 학습하여**, 동일한 45컬럼 스키마를 갖는 **완전 합성 데이터셋**을 생성한다. 이 데이터셋은 팀원이 매칭 시스템 개발 및 실험에 자유롭게 사용할 수 있으며, 실제 데이터와 **통계적으로 유사하되 개인을 특정할 수 없는** 수준으로 설계된다.

---

## 1. 기존 데이터 현황 분석

### 1.1 원본 데이터 기본 통계

> **분석 기준 파일:** `data/03_29_export_user_data.csv`

| 항목                               | 수치                                       |
| ---------------------------------- | ------------------------------------------ |
| 총 행 수                           | 12,838행                                   |
| 고유 사용자 수                     | 2,517명                                    |
| 고유 기업 수(workspaceName)        | 3,247개                                    |
| 고유 직무(companyPosition)         | 2,187개                                    |
| draftContent 평균 길이             | 913자 (중앙값 829자, 최대 7,183자)         |
| 역량 추출 수(ability_count)        | 대부분 3 (12,815행), 일부 5·7·10 등 존재 |
| 1인당 평균 행 수                   | 5.1행                                      |
| 개정쌍(draftNum ≥ 2) workspace 수 | 633개                                      |
| 컬럼 수                            | 72개 (ability 0~9까지 확장)                |

**education 분포 (유저 레벨):**

| 학력                          | 명      | 비율  |
| ----------------------------- | ------- | ----- |
| bachelor_graduate (학사졸업)  | 1,730명 | 68.7% |
| bachelor_attending (학사재학) | 433명   | 17.2% |
| master_graduate (석사졸업)    | 245명   | 9.7%  |
| master_attending (석사재학)   | 60명    | 2.4%  |
| 기타 (other·고졸·박사 등)   | 49명    | 1.9%  |

**개정본(draftNum) 분포:**

| draftNum     | 행 수    |
| ------------ | -------- |
| 1 (초고)     | 11,159행 |
| 2 (1차 수정) | 980행    |
| 3 (2차 수정) | 191행    |
| 4 이상       | 57행     |

### 1.2 1차 필터링 결과: interestedJobs + interestedIndustries 보유 사용자

페르소나 생성의 핵심 축인 `interestedIndustries_1`과 `interestedJobs_1`의 결측 현황:

| 컬럼                       | 결측 행 수                        | 비율           |
| -------------------------- | --------------------------------- | -------------- |
| `interestedIndustries_1` | **0행**                     | **0.0%** |
| `interestedIndustries_2` | 1,896행                           | 14.8%          |
| `interestedIndustries_3` | 3,394행                           | 26.4%          |
| `interestedJobs_1`       | **0행**                     | **0.0%** |
| `interestedJobs_2`       | 2,225행                           | 17.3%          |
| `interestedJobs_3`       | 5,128행                           | 39.9%          |
| **필터 통과 행**     | **12,838행 / 2,517명 전원** | **100%** |

> **03_29 데이터의 특징:** `interestedIndustries_1`과 `interestedJobs_1`이 모든 행에 존재 → 별도 1차 필터링 불필요. 2·3순위는 일부 결측이지만 1순위 데이터만으로 페르소나 방향성 특정 가능. 단, 계열 편향 문제는 여전히 존재.

### 1.3 편향 분석: 계열 불균형 문제

전체 2,517명 유저의 전공 계열 분류:

| 계열                             | 유저 수 | 비율            |
| -------------------------------- | ------- | --------------- |
| 이과 (공학·자연과학·IT)        | 1,363명 | **54.2%** |
| 문과 (인문·사회·경영)          | 615명   | 24.4%           |
| 기타 (의료·예체능·복합전공 등) | 539명   | 21.4%           |

**주요 전공 상위 분포 (유저 레벨):**

| 전공         | 유저 수 |
| ------------ | ------- |
| 경영학과     | 80명    |
| 전자공학과   | 69명    |
| 화학공학과   | 52명    |
| 기계공학과   | 49명    |
| 신소재공학과 | 44명    |
| 전기공학과   | 34명    |
| 간호학과     | 24명    |
| 식품영양학과 | 22명    |
| 행정학과     | 16명    |

**관심 산업 분포 (interestedIndustries_1, 전체 행 기준):**

| 산업군                            | 행 수   | 비율            |
| --------------------------------- | ------- | --------------- |
| semiconductor (반도체)            | 4,208행 | **32.8%** |
| aerospace_defense (항공·방산)    | 836행   | 6.5%            |
| finance_fintech (금융·핀테크)    | 790행   | 6.2%            |
| ai_data (AI·데이터)              | 710행   | 5.5%            |
| beauty_cosmetics (뷰티·화장품)   | 673행   | 5.2%            |
| automotive (자동차)               | 659행   | 5.1%            |
| it_software (IT소프트웨어)        | 614행   | 4.8%            |
| bio_healthcare (바이오·헬스케어) | 609행   | 4.7%            |
| electronics (전자·전기)          | 607행   | 4.7%            |
| logistics (물류)                  | 530행   | 4.1%            |
| battery_energy (배터리·에너지)   | 445행   | 3.5%            |
| machinery_heavy (기계·중공업)    | 429행   | 3.3%            |
| 기타 6개                          | 729행   | 5.7%            |

> **전체 taxonomy (18개):** semiconductor, aerospace_defense, finance_fintech, ai_data, beauty_cosmetics, automotive, it_software, bio_healthcare, electronics, logistics, battery_energy, machinery_heavy, chemical_materials, construction, fashion, medical, retail_ecommerce, robotics

**관심 직무 분포 (interestedJobs_1, 전체 행 기준):**

| 직무                                | 행 수   | 비율            |
| ----------------------------------- | ------- | --------------- |
| rnd (연구개발)                      | 2,176행 | **16.9%** |
| manufacturing (생산·제조)          | 1,847행 | 14.4%           |
| engineering_hw (하드웨어엔지니어링) | 1,746행 | 13.6%           |
| management_support (경영지원)       | 1,215행 | 9.5%            |
| quality (품질관리)                  | 1,165행 | 9.1%            |
| planning_strategy (기획·전략)      | 1,129행 | 8.8%            |
| sales (영업)                        | 612행   | 4.8%            |
| marketing (마케팅)                  | 564행   | 4.4%            |
| software_dev (소프트웨어개발)       | 494행   | 3.8%            |
| data_ai_ml (데이터·AI·ML)         | 415행   | 3.2%            |
| design (디자인)                     | 308행   | 2.4%            |
| cs_cx (고객서비스)                  | 283행   | 2.2%            |
| service_pm (서비스기획·PM)         | 259행   | 2.0%            |
| finance_investment (재무·투자)     | 178행   | 1.4%            |
| 기타 4개                            | 244행   | 1.9%            |

> **전체 taxonomy (18개):** rnd, manufacturing, engineering_hw, management_support, quality, planning_strategy, sales, marketing, software_dev, data_ai_ml, design, cs_cx, service_pm, finance_investment, consulting, education, logistics_scm, procurement

**→ 반도체·이공계·연구개발·제조·하드웨어 중심으로 편향. 이과 54.2% vs 문과 24.4%의 계열 불균형, semiconductor 32.8% 산업 편중, rnd·manufacturing·engineering_hw 합산 44.9%의 직무 편중을 1,000명 합성 시 해소해야 함.**

---

## 2. 편향 해소 전략

### 2.1 목표 분포 설계 (1,000명 기준)

실제 한국 구직 시장의 문/이과 비율과 중소기업 채용 현실을 반영한 **목표 분포**를 설계한다.

**계열별 페르소나 수:**

| 계열                          | 목표 비율 | 페르소나 수 |
| ----------------------------- | --------- | ----------- |
| 이과 (공학·자연과학·IT)     | 45%       | 450명       |
| 문과 (경영·경제·인문·사회) | 40%       | 400명       |
| 기타 (예체능·의료·융합 등)  | 15%       | 150명       |

**관심 직무별 페르소나 수 (18개 taxonomy 균형 조정):**

> 실제 데이터(rnd 16.9%·manufacturing 14.4%·engineering_hw 13.6% 집중)의 편향을 해소하고, 문과 직무(영업·마케팅·기획·서비스PM 등)를 대폭 확대

| 직무 코드          | 직무명             | 실제 비율 | 목표 수           | 조정 방향 |
| ------------------ | ------------------ | --------- | ----------------- | --------- |
| planning_strategy  | 기획·전략         | 8.8%      | 90명              | 유지      |
| management_support | 경영지원·HR       | 9.5%      | 90명              | 유지      |
| software_dev       | 소프트웨어개발     | 3.8%      | 85명              | ↑ 확대   |
| sales              | 영업               | 4.8%      | 85명              | ↑ 확대   |
| marketing          | 마케팅             | 4.4%      | 80명              | ↑ 확대   |
| data_ai_ml         | 데이터·AI·ML     | 3.2%      | 70명              | ↑ 확대   |
| rnd                | 연구개발           | 16.9%     | 65명              | ↓ 축소   |
| manufacturing      | 생산·제조         | 14.4%     | 60명              | ↓ 축소   |
| engineering_hw     | 하드웨어엔지니어링 | 13.6%     | 55명              | ↓ 축소   |
| service_pm         | 서비스기획·PM     | 2.0%      | 50명              | ↑ 확대   |
| quality            | 품질관리           | 9.1%      | 45명              | ↓ 축소   |
| finance_investment | 재무·투자         | 1.4%      | 45명              | ↑ 확대   |
| design             | 디자인             | 2.4%      | 40명              | ↑ 확대   |
| cs_cx              | 고객서비스         | 2.2%      | 40명              | ↑ 확대   |
| consulting         | 컨설팅             | -         | 30명              | 신규      |
| logistics_scm      | 물류·SCM          | -         | 30명              | 신규      |
| procurement        | 구매·조달         | -         | 25명              | 신규      |
| education          | 교육               | -         | 15명              | 신규      |
| **합계**     |                    |           | **1,000명** |           |

**관심 산업별 목표 분포 (18개 taxonomy):**

> semiconductor 32.8% 편중을 8%로 대폭 축소, 문과·서비스 산업 확대

| 산업 코드          | 산업명           | 실제 비율       | 목표 비율      | 조정 방향      |
| ------------------ | ---------------- | --------------- | -------------- | -------------- |
| it_software        | IT소프트웨어     | 4.8%            | 12%            | ↑ 확대        |
| finance_fintech    | 금융·핀테크     | 6.2%            | 10%            | ↑ 확대        |
| ai_data            | AI·데이터       | 5.5%            | 9%             | ↑ 확대        |
| retail_ecommerce   | 유통·이커머스   | -               | 8%             | ↑ 확대        |
| bio_healthcare     | 바이오·헬스케어 | 4.7%            | 7%             | ↑ 확대        |
| semiconductor      | 반도체           | **32.8%** | **7%**   | ↓↓ 대폭 축소 |
| automotive         | 자동차           | 5.1%            | 6%             | 유지           |
| beauty_cosmetics   | 뷰티·화장품     | 5.2%            | 6%             | 유지           |
| electronics        | 전자·전기       | 4.7%            | 6%             | 유지           |
| aerospace_defense  | 항공·방산       | 6.5%            | 5%             | ↓ 소폭 축소   |
| logistics          | 물류             | 4.1%            | 5%             | 유지           |
| battery_energy     | 배터리·에너지   | 3.5%            | 5%             | ↑ 소폭 확대   |
| machinery_heavy    | 기계·중공업     | 3.3%            | 4%             | 유지           |
| chemical_materials | 화학·소재       | -               | 4%             | 신규           |
| construction       | 건설             | -               | 3%             | 신규           |
| fashion            | 패션             | -               | 3%             | 신규           |
| medical            | 의료             | -               | 3%             | 신규           |
| robotics           | 로보틱스         | -               | 2%             | 신규           |
| **합계**     |                  |                 | **100%** |                |

### 2.2 편향 해소 구현 방법

#### 방법 A: 목표 분포 기반 계층 샘플링 (권장)

```python
# 직무별 목표 수를 미리 정의 (18개 taxonomy, 실제 편향 보정 반영)
persona_targets = {
    # 문과 직무 확대
    'planning_strategy': 90, 'management_support': 90,
    'software_dev': 85, 'sales': 85, 'marketing': 80, 'data_ai_ml': 70,
    # 이과 직무 축소
    'rnd': 65, 'manufacturing': 60, 'engineering_hw': 55,
    # 신규·확대 직무
    'service_pm': 50, 'quality': 45, 'finance_investment': 45,
    'design': 40, 'cs_cx': 40, 'consulting': 30,
    'logistics_scm': 30, 'procurement': 25, 'education': 15
}  # 합계 = 1,000명

# 각 직무·계열 조합을 지정하여 LLM에게 해당 유형 페르소나 생성 요청
# → LLM이 "랜덤하게" 생성하는 대신, 미리 정한 분포대로 배치 단위 생성
```

#### 방법 B: 중간 검증용 CSV 추출 → 프롬프트로 재조정

1. 100명 페르소나 생성 후 CSV로 저장
2. 직무/계열/산업 분포 자동 집계
3. 목표 분포와의 차이(KL Divergence 또는 단순 비율 비교)를 계산
4. 부족한 군에 대해 추가 생성하거나, 과다 군을 필터링

> 이 방법은 AI 프롬프트의 내재적 편향(이공계 선호 등)을 런타임에 감지하고 보정할 수 있어 권장.

---

## 3. 2단계 데이터 구축 계획

### 단계 개요

```
[1단계] 페르소나 생성 (1,000명) — Gemini 최신 모델(gemini-3.1-flash-preivew) 사용
    → 목표 분포에 따른 계층 배치 생성
    → 중간 검증 CSV 추출 → 편향 보정
    → 출력: persona_1k.csv

[2단계] 유저 데이터 생성 (자기소개서 행 생성) — gemini-3.1-flash-preview사용
    → 페르소나 기반 경험 생성 (STAR)
    → 역량 추출 (ability_0/1/2)
    → 자기소개서 문항 + 답변 생성 (draftContent, 1인당 1개 고정)
    → draftNum = 1 고정 (개정본 미생성)
    → 출력: synthetic_sample_data.csv (03_29 포맷 동일)
```

---

### 3.1 1단계: 페르소나 생성

#### 페르소나 구성 요소 (컬럼 매핑)

| 페르소나 필드     | 대응 CSV 컬럼                  | 생성 방식                                        |
| ----------------- | ------------------------------ | ------------------------------------------------ |
| 계열 (문/이/기타) | `major` 파생                 | 목표 분포 기반 지정                              |
| 전공명            | `major`                      | LLM 생성 (계열별 전공 pool)                      |
| 학력              | `education`                  | 분포 기반 샘플링 (bachelor 87%, master 4% 등)    |
| 관심 직무 1~3     | `interestedJobs_1/2/3`       | 목표 분포 기반 지정 (1순위) + LLM 생성 (2~3순위) |
| 관심 산업 1~3     | `interestedIndustries_1/2/3` | 직무에 연동하여 LLM 생성                         |
| 커리어 스토리     | 내부 컨텍스트 (CSV 미포함)     | LLM 생성, 경험 생성 시 사용                      |

#### 페르소나 생성 프롬프트 설계

```
[시스템 프롬프트]
당신은 한국의 구직자 프로필을 생성하는 전문가입니다.
아래 조건에 맞는 구직자 페르소나를 JSON 형식으로 생성하세요.

[조건 지정 (배치별로 변경)]
- 계열: {이과 / 문과 / 기타}
- 관심 직무 (1순위): {interestedJobs_1 값}
- 관심 산업 (1순위): {interestedIndustries_1 값}

[출력 JSON 스키마]
{
  "persona_id": "P_{uuid}",
  "major": "전공명 (구체적, 예: 컴퓨터공학과)",
  "education": "bachelor_graduate | bachelor_attending | master_graduate",
  "interestedJobs_1": "{지정값}",
  "interestedJobs_2": "{관련 직무}",
  "interestedJobs_3": "{관련 직무 또는 null}",
  "interestedIndustries_1": "{지정값}",
  "interestedIndustries_2": "{관련 산업}",
  "interestedIndustries_3": "{관련 산업 또는 null}",
  "career_story": "이 사람의 학업·경험 배경을 2~3문장으로 서술 (내부 컨텍스트용)",
  "target_company_type": "중소기업 지원 배경 (왜 중소기업을 지원하는지 1문장)"
}
```

#### 배치 생성 계획

- **사용 모델:** Gemini 최신 모델 (gemini-3.1-flash-preview)
- **배치 단위:** 10명씩 생성 (직무 그룹별로 묶어서 요청)
- **총 배치 수:** 100배치 (= 1,000명)
- **중간 검증:** 100명 단위마다 분포 체크 → 목표 대비 ±5% 이내 유지

---

### ability_keyword taxonomy (기존 데이터 기반 10개)

```
정보수집·분석 역량 / 문제해결 능력 / 전략·기획 역량 / 학습·자기개발 역량 /
창의성·혁신 역량 / 의사소통 역량 / 실행력·업무처리 능력 / 협업·팀워크 /
의사결정 능력 / 고객지향성
```

#### 문항 pool 설계 (152개 고유 문항 → 5개 카테고리로 그룹화)

| questionNum | 카테고리           | 예시 문항                                                 |
| ----------- | ------------------ | --------------------------------------------------------- |
| 1           | 지원동기·기업이해 | "당사에 지원한 동기와 입사 후 목표를 기술하시오."         |
| 2           | 직무역량·경험     | "지원 직무와 관련된 본인의 역량과 경험을 기술하시오."     |
| 3           | 문제해결·도전     | "가장 어려웠던 문제와 해결 과정을 기술하시오."            |
| 4           | 협업·조직적합성   | "팀 프로젝트에서의 역할과 협업 경험을 기술하시오."        |
| 5           | 성장·미래계획     | "본인의 강점과 약점, 그리고 향후 성장 계획을 기술하시오." |

---

## 5. 최종 출력 CSV 스키마 (45컬럼 동일)

```
userId (가상 UUID) 
experienceId  
resume_infoId   
resume_writingId  
workspaceId   
workspaceName   
companyName   
companyPosition   
companyDivision   
season
linkedExperienceIds
questionNum          ← 1~5 (문항별 1행)
draftNum             ← 1 (고정, 개정본 미생성)
draftName
question             ← 문항 pool에서 선택
draftContent         ← 자기소개서 본문 (700~1,200자)
education
university
major
interestedIndustries_1  ← 반드시 존재 (필터 조건)
interestedIndustries_2
interestedIndustries_3
interestedJobs_1        ← 반드시 존재 (필터 조건)
interestedJobs_2
interestedJobs_3
categoryName
Title
Situation
Task
Action
Reason
Result
ability_count        ← 고정값 3
ability_0_keyword
ability_0_name
ability_0_definition
ability_0_reason
ability_1_keyword
ability_1_name
ability_1_definition
ability_1_reason
ability_2_keyword
ability_2_name
ability_2_definition
ability_2_reason
```

> **주의:** `workspaceName`은 실제 기업명이 아닌 가상 중소기업명 사용 (예: "한림소재", "넥스트로직스" 등). 실제 기업 평판·이미지와 무관한 완전 가상 명칭.

---

## 6. 품질 검증 계획

### 6.1 자동 검증 (코드)

```python
# 생성 후 자동 체크 항목
checks = {
    "interestedJobs_1 null 비율": "0% 유지",
    "interestedIndustries_1 null 비율": "0% 유지",
    "draftContent 평균 길이": "700~1,200자",
    "ability_count": "모든 행 = 3",
    "직무별 분포 편차": "목표 대비 ±5% 이내",
    "계열별 분포 편차": "목표 대비 ±5% 이내",
    "draftContent null 비율": "0% (기존 18.3% 개선)",
}
```

### 6.2 수동 검증 (샘플링)

- 직무별 5명씩 무작위 추출 (18직무 × 5 = 90명) → 자기소개서 품질 육안 검토
- 이과/문과 각 20명 → 전공·경험·자소서 일관성 확인
- draftNum=1 고정 확인 (개정본 없음) → 모든 행 draftNum = 1 검증