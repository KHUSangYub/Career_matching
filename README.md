# CareerMatching — 한국어 자기소개서 ↔ 채용공고 양방향 정성 매칭

자기소개서(STAR·역량)와 채용공고(JD)를 **5개 관점**(직무 / 역량 / 스킬 / 산업 / 혼합)으로
양방향 매칭하는 시스템. 정답 레이블이 없는(GT 부재) 환경에서 합성 평가셋과 독립 라벨을
설계하여, 임베딩 기반 학습 head가 규칙 기반 baseline 대비 어떤 이득을 주는지 검증한다.

졸업 프로젝트(캡스톤) 제출용 저장소.

## 저장소 구조

```
careermatching/
├── requirements.txt       # 노트북 실행 의존성
├── data/                  # 원천 데이터 (Git LFS) + samples/ (상위 1k행 미리보기)
├── data_generation/       # 합성 데이터 + Gemini 프로필 생성
├── preprocessing/         # JD 전처리 노트북 (01 → 02)
├── modeling/              # 매칭 실험 노트북 (00 → 17, 시간순)
├── output/                # 각 실험이 생성한 결과 CSV/JSON·임베딩
├── demo/                  # 실시간 매칭 데모 (FastAPI + Next.js)
└── docs/                  # 실험 진행 기록·결과 분석 (시간순)
```

## 파이프라인 한눈에

```
data_generation/  ──▶  data/  ──▶  preprocessing/  ──▶  modeling/  ──▶  output/  ──▶  demo/
합성·프로필 생성       원천 데이터    JD 정제·구조화       매칭 실험        결과·지표      서비스 시각화
```

### 1. 데이터 생성 (`data_generation/`)
1. `01_synthetic_user_data_plan.md` — 합성 자기소개서 999명 구축 설계 (개인정보 보호)
2. `02_gemini_profile_generation.ipynb` — Gemini로 user/JD semantic profile 생성

### 2. 데이터 (`data/`)
- `user_data.csv` — 자기소개서 999명, STAR·역량 추출
- `company_jobdescription.csv` — 채용공고 235,850건
- `company_jobdescription_enriched.csv` — 구조화 추출 JD (직무·산업·스킬·역량 분리)

대용량 CSV는 Git LFS로 관리한다. 자세한 컬럼 설명은 `data/README.md` 참조.

### 3. 전처리 (`preprocessing/`)
1. `01_jd_empty_filter.ipynb` — `job_types` 빈 값 행 제거
2. `02_jd_clean_extract_gemini.ipynb` — 텍스트 정제 + 구조화 추출 → enriched JD

### 4. 모델링 (`modeling/`)
baseline부터 임베딩 학습 head까지의 실험을 시간순으로 정리.

| # | 노트북 | 내용 |
| --- | --- | --- |
| 00 | `00_baseline_faiss_kr_sbert` | 최초 KR-SBERT + FAISS baseline (user 병합·EDA 포함) |
| 01 | `01_baseline_full_data` | 전체 데이터 baseline 매칭 (user 999 × JD 235,850) |
| 02 | `02_perspective_matrix` | 5관점 × 5 setup 직교 평가 행렬 |
| 03 | `03_gemini_judge_relabel` | 평가셋 재라벨 |
| 04 | `04_n30_expansion` | 평가 쌍 확장 |
| 05 | `05_backbone_comparison` | 임베딩 백본 비교 |
| 06 | `06_gemini_reranker` | reranker 실험 |
| 07 | `07_qwen3_reranker` | Qwen3 reranker 실험 |
| 08 | `08_wilcoxon_test` | setup 간 유의성 검정 |
| 09 | `09_ablation_6component` | 6개 컴포넌트 ablation |
| 10 | `10_revision_pair_direction` | 수정 쌍 방향성 |
| 11 | `11_grid_search` | 관점별 fusion 가중치 그리드 탐색 |
| 12 | `12_learnable_fusion_head` | 학습 fusion head (V1) |
| 13 | `13_independent_eval` | 독립 라벨 평가 (순환성 검증) |
| 14 | `14_independent_eval_stats` | 독립 평가 통계 확장 |
| 15 | `15_ndcg_root_cause` | NDCG 포화 원인 분석 |
| 16 | `16_saturation_analysis` | 천장 효과 심층 진단 |
| 17 | `17_v2_embedding_fusion` | 임베딩 + 학습 head (V2, Qwen3 / KURE) |

각 노트북은 실행 결과가 포함되어 있으며, 생성한 결과 파일은 동일 번호의 `output/` 폴더에 있다.

### 5. 결과 (`output/`)
실험별 NDCG·MRR·Recall 지표, ablation·검정 결과, 임베딩(`.npz`), 메타(`meta.json`).
`output/benchmark/`에 핵심 벤치마크 지표를 모았다.

### 6. 데모 (`demo/`)
Qwen3-Embedding-0.6B + MLP head를 실시간으로 시연하는 로컬 SPA.
실행법은 `demo/README.md` 참조.

### 7. 문서 (`docs/`)
실험 타임라인부터 V2까지, 무엇을 시도했고 어떤 결과가 나왔는지 시간순으로 정리.

## 재현 방법

```bash
# 1) 저장소 클론 후 대용량 데이터 받기
git lfs install && git lfs pull

# 2) 의존성 설치
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# 3) 노트북 실행 (data_generation → preprocessing → modeling 순서)
#    Gemini 단계는 GEMINI_API_KEY 환경변수 필요 (data_generation/README.md 참조)

# 4) 데모 실행
#    demo/README.md 참조
```

## 기술 스택
- 임베딩: Qwen3-Embedding-0.6B, KURE-v1, e5
- 검색: FAISS (cosine)
- 학습 head: MLP (관점별 분기, MSE)
- 데모: FastAPI + Next.js (TypeScript, Tailwind)
