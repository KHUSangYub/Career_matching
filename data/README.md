# 데이터 (data)

매칭 시스템에 사용되는 원천 데이터셋. 대용량 CSV는 **Git LFS**로 관리된다.
가볍게 구조만 확인하려면 `samples/` 폴더의 상위 1,000행 샘플을 참고하면 된다.

## 파일 목록

| 파일 | 행 수 | 설명 |
| --- | --- | --- |
| `user_data.csv` | 93,389 | 자기소개서(STAR) 및 역량 추출 데이터 (사용자 999명) |
| `company_jobdescription.csv` | 235,850 | 채용공고(JD) 원본 (기업 52,243곳) |
| `company_jobdescription_enriched.csv` | 90,070 | LLM으로 구조화 추출한 enriched JD (직무·산업·스킬·역량·근무형태 분리) |

## 주요 컬럼

### user_data.csv
- `userId`, `companyName`, `companyPosition` — 식별·지원 정보
- `question`, `draftContent` — 자기소개서 문항/본문
- `Situation`, `Task`, `Action`, `Reason`, `Result` — STAR 구조 분해
- `ability_*_keyword`, `ability_*_name`, `ability_*_definition`, `ability_*_reason` — 추출된 역량
- `university`, `major`, `interestedIndustries_*`, `interestedJobs_*` — 사용자 프로필

### company_jobdescription.csv
- `job_id`, `company_name`, `title`, `job_types`
- `duties_clean`, `skills_clean`, `benefits_clean`, `detail_text_clean` — 정제 텍스트

### company_jobdescription_enriched.csv
원본 JD를 구조화 추출한 버전. `jd_job_role`, `jd_required_skills`, `jd_preferred_skills`,
`jd_industry`, `jd_location`, `jd_work_format`, `jd_experience_requirements`, `jd_competencies`,
`jd_matching_text` 등 5관점 매칭에 필요한 컬럼으로 분리.

## 전처리 흐름

```
company_jobdescription.csv
   └─(preprocessing/01_jd_empty_filter.ipynb)→ job_types 빈 값 제거
       └─(preprocessing/02_jd_clean_extract_gemini.ipynb)→ company_jobdescription_enriched.csv
```

## Git LFS 안내

대용량 CSV(`*.csv`, `*.zip`)는 Git LFS로 추적된다. 저장소를 클론한 뒤 실제 파일을 받으려면:

```bash
git lfs install
git lfs pull
```
