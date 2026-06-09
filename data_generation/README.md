# 데이터 생성 (data_generation)

매칭 실험에 쓰인 데이터셋을 만드는 두 단계의 코드.

1. **합성 자기소개서 데이터 구축** — 실제 사용자 데이터는 개인정보 이슈로 공유 불가하므로,
   원본의 구조·분포·패턴을 따르되 개인을 특정할 수 없는 **완전 합성 데이터셋(999명, 45컬럼 스키마)**을 생성.
   설계 문서: `01_synthetic_user_data_plan.md`
2. **Gemini 기반 Semantic Profile 생성** — 자기소개서와 채용공고(JD)를 **동일한 JSON 스키마의 의미 프로필**로
   정규화. 직무·산업·스킬·역량 등 매칭에 필요한 신호를 구조화해 추출한다.
   구현: `02_gemini_profile_generation.ipynb`

## 파일

| 파일 | 내용 |
| --- | --- |
| `01_synthetic_user_data_plan.md` | 합성 자기소개서 1,000명 구축 설계 (스키마·분포·생성 규칙) |
| `02_gemini_profile_generation.ipynb` | Gemini structured output으로 user/JD semantic profile 생성 + 100쌍 벤치마크 검증 |

## 입력 / 출력

- **입력:** `data/user_data.csv`(합성 자소서 999명), `data/company_jobdescription.csv`(JD)
- **출력:** `output/benchmark/user_profiles.csv`, `output/benchmark/jd_profiles_sample1000.csv` (Gemini 프로필)

## 실행

`02_gemini_profile_generation.ipynb`는 Gemini API를 사용한다.

```bash
export GEMINI_API_KEY="<your-key>"   # 또는 GOOGLE_API_KEY
pip install google-genai
```

> API 키는 코드/노트북/CSV에 저장하지 않는다. 환경변수로 주입하거나 Jupyter 실행 시 `getpass`로 입력받는다.
> 키가 없으면 deterministic heuristic profile로 fallback 실행되어 파이프라인 구조 검증이 가능하다.

## 파이프라인 내 위치

```
data_generation/  ──▶  preprocessing/  ──▶  modeling/
합성 데이터·프로필 생성    JD 정제·구조화        매칭 실험
```

이 노트북의 1,000개 JD 샘플 프로필 매칭은 이후 `modeling/01_baseline_full_data.ipynb`에서
전체 데이터(999명 × 235,850 JD)로 확장된다.
