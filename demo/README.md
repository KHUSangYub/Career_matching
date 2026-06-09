# 캡스톤 V2 매칭 데모

자기소개서 → 채용공고(JD) 매칭 시스템 — Qwen3-Embedding-0.6B + MLP-128 학습 head를 실시간으로 시연하는 Next.js + FastAPI 데모.

## 1. 프로젝트 개요

본 데모는 **이상엽 캡스톤 졸업 프로젝트**의 V2 매칭 모델(exp-023-v2-embedding-fusion-head)을 *서비스 형태로 시각화*하기 위해 만들어진 로컬 실행 SPA입니다. 사용자가 999명 user 중 한 명을 고르고 5가지 매칭 관점(Job / Resume / Skill / Industry / Mixed) 중 하나를 선택하면, 3,000개 JD 중 Top-K 매칭 결과를 V2 모델로 즉시 계산하여 점수 + 5컴포넌트 분해와 함께 표시합니다.

research-context의 차별성 5축 중 **① 자소서 정성** 및 **④ GT 부재 평가 방법론**의 첫 정량 입증 결과(독립 라벨 NDCG=0.9390)를 *눈으로 확인할 수 있는 형태*로 제공합니다.

## 2. 기술 스택

`careermizing-web`의 디자인 시스템·프레임워크를 그대로 채택하여 일관성을 유지합니다.

| 구분 | 기술 | 버전 |
| --- | --- | --- |
| 프론트 프레임워크 | Next.js (App Router) + Turbopack | `15.x` |
| 언어 | TypeScript | `5.x` |
| 스타일링 | Tailwind CSS | `4.x` (`@theme inline` + CSS variables) |
| 디자인 토큰 | careermizing `colors.css`·`typography.css` 그대로 복사 | — |
| UI 컴포넌트 | shadcn/ui (new-york, neutral, cssVariables) | — |
| 데이터 페칭 | TanStack Query | `5.x` |
| 차트 | Recharts | `2.x` |
| 아이콘 | lucide-react | — |
| 폰트 | Pretendard Variable | — |
| 백엔드 프레임워크 | FastAPI | `0.118.x` |
| 모델 inference | torch + transformers (MPS) | `2.12 / 5.8` |
| 임베딩 백본 | Qwen3-Embedding-0.6B (HuggingFace 캐시) | — |
| 학습 head | MLP-128 (관점별 분기 5개, MSE loss, wd=1e-3) | — |

## 3. 프로젝트 구조

```
demo/
├── README.md                          # 본 파일 (전체 구현 범위·실행법)
├── api/                               # FastAPI 백엔드 (:8000)
│   ├── README.md                      # API 명세
│   ├── requirements.txt               # fastapi, uvicorn, torch, transformers, pandas, numpy
│   ├── main.py                        # 엔트리 (CORS, lifespan = 모델 학습)
│   ├── matcher.py                     # V2 inference 로직 (exp-023 발췌)
│   ├── data_loader.py                 # user/JD 메타·임베딩·5컴포넌트 로드
│   └── schemas.py                     # Pydantic 요청/응답 모델
└── web/                               # Next.js 프론트 (:3000)
    ├── README.md
    ├── package.json
    ├── tsconfig.json
    ├── next.config.ts                 # rewrites: /api/* → :8000/*
    ├── postcss.config.mjs
    ├── components.json                # shadcn (new-york, neutral)
    ├── app/
    │   ├── layout.tsx                 # Pretendard + Providers
    │   ├── page.tsx                   # 메인 SPA (좌 sidebar + 우 result)
    │   ├── globals.css                # @import tailwindcss + colors + typography
    │   ├── colors.css                 # careermizing 복사
    │   ├── typography.css             # careermizing 복사
    │   └── PretendardVariable.woff2
    ├── components/
    │   ├── providers.tsx              # TanStack Query Provider
    │   ├── ui/                        # shadcn — npx shadcn add 로 설치
    │   └── demo/
    │       ├── UserSelector.tsx
    │       ├── PerspectiveSelector.tsx
    │       ├── UserProfileCard.tsx
    │       ├── MatchResultList.tsx
    │       ├── MatchCard.tsx
    │       ├── ComponentScoreChart.tsx
    │       └── SystemInfoBadge.tsx
    ├── lib/
    │   ├── api.ts                     # typed fetch
    │   ├── types.ts                   # User, JD, MatchResult, Perspective
    │   └── utils.ts                   # cn() (shadcn helper)
    └── hooks/
        ├── useUsers.ts                # GET /users
        ├── usePerspectives.ts         # GET /perspectives
        └── useMatch.ts                # POST /match
```

## 4. 구현 범위

### 4.1 V1 (MVP — 6/8 미팅 마감)

| 기능 | 내용 |
| --- | --- |
| 사용자 선택 | 999명 user drop-down (`P0247` 등 ID 기반) |
| 사용자 정보 카드 | 관심 직무·산업·역량 키워드·자소서 일부 미리보기 |
| 관점 선택 | A/B/C/D/E (radio cards, 클릭 시 즉시 재매칭) |
| Top-K 슬라이더 | 5~30, 기본 10 |
| 매칭 결과 리스트 | rank, 회사명, 직무·산업, V2 점수, 라벨(0~4) |
| 결과 상세 (Accordion) | jd_summary, 주요업무, 인재상, 필수 스킬 |
| 5컴포넌트 차트 (Recharts) | role/skill/industry/star/competency 막대그래프 — *왜 추천했는지* 설명 |
| 시스템 정보 뱃지 | NDCG 0.9984(순환) / 0.9390(독립) tooltip |
| 첫 시작 시 동작 | FastAPI lifespan에서 임베딩 로드 + 5컴포넌트 행렬 계산 + head 5개 학습 (~1분) |

### 4.2 V2 (졸업 심사 전까지 — 시간 되면)

- Dark mode (`.dark` variant — careermizing 토큰 그대로 활용)
- 관점 A vs D 결과 *동시 비교* 모드 (2-pane)
- 결과 정렬 옵션 (점수 / 라벨 / 회사명)

### 4.3 V3 (Future Work)

- 자기소개서 직접 입력 → Qwen3 라이브 인코딩 → 매칭 (5~10초)
- 로그인·즐겨찾기·세션 보존

### 4.4 Out-of-Scope (영구)

- Firebase·Toss Payments·OpenAI API (careermizing의 제품 기능)
- 자소서 편집기 / 면접 콘텐츠 / 강의 모듈
- 모바일 전용 PWA 최적화 (데모는 데스크탑 기준)

## 5. 사전 준비

### 5.1 사전 산출물 확인

다음 파일들이 이미 존재해야 합니다 (없으면 V2 노트북부터 실행):

- `data/user_data.csv` (999명)
- `data/company_jobdescription_enriched.partial.csv` (3,000 JD)
- `output/17_v2_embedding_fusion/embeddings/user_qwen3.npz`
- `output/17_v2_embedding_fusion/embeddings/jd_qwen3.npz`

없을 경우 `modeling/17_v2_embedding_fusion.ipynb` 실행 (약 30분).

### 5.2 실행 환경

| 항목 | 권장 버전 |
| --- | --- |
| Python | 3.12 |
| torch / transformers | 2.12 / 5.8 (Apple Silicon은 MPS 사용) |
| fastapi / uvicorn / pydantic | 0.118+ / 0.30+ / 2.x |
| Node.js | v20+ |

### 5.3 백엔드 의존성

가상환경 생성 후 의존성을 설치합니다.

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r demo/api/requirements.txt
```

### 5.4 프론트 의존성

```bash
cd demo/web
npm install
```

> 현 코드는 shadcn UI primitive를 *직접 임포트하지 않고* 데모 전용 컴포넌트만 사용합니다 (Tailwind + Radix UI + lucide만). 따라서 `npx shadcn add` 없이도 그대로 동작합니다.

## 6. 실행 방법

### 6.1 두 터미널 동시 실행

**터미널 A — 백엔드 (먼저 띄움)**

```bash
source .venv/bin/activate
cd demo/api
uvicorn main:app --reload --port 8000
```

또는 한 줄로:
```bash
source .venv/bin/activate && cd demo/api && uvicorn main:app --reload --port 8000
```

→ 첫 시작 시 `lifespan`에서 임베딩 로드 + 5컴포넌트 계산 + head 5개 학습 (약 1~2분). `INFO: Model ready ✅` 로그 확인.

> 프롬프트 앞에 `(.venv)` 표시가 뜨면 venv 활성화 성공.

**터미널 B — 프론트** (venv 활성화 불필요)

```bash
cd demo/web
npm run dev
```

→ `http://localhost:3000` 자동 열림.

### 6.2 동작 확인

- 백엔드 ready 확인: `curl http://localhost:8000/healthz` → `{"status":"ok","modelLoaded":true}`
- API 자동 문서: `http://localhost:8000/docs` (Swagger UI)

## 7. 데이터 흐름

```
[Next.js :3000]
   │ useUsers() / usePerspectives() → fetch /api/users, /api/perspectives
   │ useMatch({uid, persp, K}) → fetch POST /api/match
   │
   ▼ rewrites (next.config.ts)
[FastAPI :8000]
   │ lifespan startup:
   │   1. 임베딩 npz 로드 (Qwen3 user/jd, 약 5초)
   │   2. user/JD 메타 로드 + 5컴포넌트 행렬 (60MB, 약 1분)
   │   3. head 5개 학습 (관점 A·B·C·D·E, 각 4초)
   │
   │ POST /match handler:
   │   1. user_idx 조회
   │   2. head_p(user_emb, jd_emb, comp) → scores (3000,)
   │   3. argsort(-scores)[:K] → top-K
   │   4. JD 메타 + 5컴포넌트 점수 + 라벨 함께 반환
   │
   ▼
[Next.js render]
   └─ MatchCard × K (회사명, 직무, 점수, 5컴포넌트 차트)
```

## 8. API 명세 (요약)

| Method | Path | 설명 |
| --- | --- | --- |
| `GET` | `/healthz` | 모델 ready 여부 |
| `GET` | `/users` | 999명 user 목록 (id, jobs, industries, abilityKeywords, starPreview) |
| `GET` | `/perspectives` | A/B/C/D/E 정의 + 라벨러 가중치 (참고용) |
| `POST` | `/match` | `{userId, perspective, topK}` → Top-K JD + 5컴포넌트 + 모델 정보 |

상세 명세: `demo/api/README.md` 또는 `http://localhost:8000/docs`.

## 9. 디자인 시스템

`careermizing-web`의 디자인 토큰을 그대로 사용합니다.

### 9.1 컬러 (`app/colors.css` 복사)

| 토큰 | 16진 | 용도 |
| --- | --- | --- |
| `bg-blue-500` | `#1f7fff` | 주요 액션 |
| `bg-sky-blue-500` | `#11b0ff` | 보조 강조 |
| `bg-green-500` | (디자인 시스템) | 라벨=4, 성공 |
| `bg-gray-50~950` | gray scale | 배경·텍스트·구분선 |
| `bg-red-500` | `#f01c38` | 라벨=0, 경고 |

### 9.2 타이포그래피 (`app/typography.css` 복사)

- 본문: `Pretendard Variable` (woff2 파일 로컬 호스팅)
- 사이즈 토큰: `text-xs(12) ~ text-6xl(48)`
- Display1/Display2 (대형 타이틀), Headline1/2/3, Body1/2, Label1/2

### 9.3 레이아웃

- 최대 너비: `max-w-7xl mx-auto px-6`
- 메인 그리드: `grid grid-cols-[320px_1fr] gap-8` (md 이상)
- 카드: `rounded-lg p-6 shadow-sm hover:shadow-md transition`

## 10. 시연 시나리오 (졸업 심사용)

1. 메인 화면 진입 → 헤더 NDCG 뱃지 hover → 모델 정보 tooltip
2. 사용자 `P0247` 선택 → 관심 직무 `rnd`, 관심 산업 `automotive` 표시
3. 관점 `A: Job-Centric` → R&D 직무 위주 Top-10
4. 관점 `D: Context-Fit`으로 변경 → 자동차 산업 위주 Top-10 (즉시 재계산)
5. Top-1 카드 expand → 5컴포넌트 차트로 *왜 1등인지* 설명 (role=1.0, industry=1.0)
6. 다른 사용자 `P1001` (데이터 분야) 선택 → 결과 완전히 다른 풀
7. (시간 되면) "비교 모드" → 관점 A·D 결과 나란히 비교

## 11. 폐기·대체

| 폐기 | 사유 | 대체 |
| --- | --- | --- |
| `demo/app.py` (Streamlit) | 디자인 자유도 낮음, careermizing과 결이 다름 | `demo/web/` (Next.js + Tailwind + shadcn) |

## 12. 위험 요소

| # | 위험 | 대응 |
| --- | --- | --- |
| R1 | FastAPI 첫 부팅 1~2분 (모델 학습) | lifespan에서 동기 학습, `/healthz` polling으로 ready 확인 |
| R2 | MPS 메모리 부족 | torch 텐서를 CPU 보관, inference 시 MPS 이동 |
| R3 | 999명 user 한 번에 fetch (500KB) | 검색형 Select (combobox) — V1은 단순 select, 검색은 V2 |
| R4 | shadcn `new-york` 색 미세 차이 | `baseColor: neutral` + cssVariables true (careermizing 동일) |

## 13. 라이선스 / 데이터 출처

- 본 데모의 데이터(자기소개서 999명, JD 3,000개)는 raw-user-data-EDA 및 raw-company-jobdescription-EDA 참조. **재배포 금지** — 로컬 시연용.
- Qwen3-Embedding-0.6B: Apache 2.0 (Alibaba)
- shadcn/ui: MIT
- 디자인 토큰 출처: careermizing-web (이상엽 본인 프로젝트)

## 14. 관련 문서

- `modeling/17_v2_embedding_fusion.ipynb` — V2 모델 학습·평가
- `modeling/16_saturation_analysis.ipynb` — 천장 효과 진단 (V2가 왜 필요한가)
- `docs/` — 실험 진행 기록 및 결과 정리 (시간순)
