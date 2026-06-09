# 캡스톤 V2 매칭 API (FastAPI)

자기소개서 → JD 매칭의 V2 모델(Qwen3-0.6B + MLP-128) inference를 제공하는 FastAPI 백엔드.

## 실행 환경

| 항목 | 권장 버전 |
| --- | --- |
| Python | 3.12 |
| torch / transformers | 2.12 / 5.8 (Apple Silicon은 MPS) |
| fastapi / uvicorn / pydantic | 0.118+ / 0.30+ / 2.x |

## 설치 및 실행

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r demo/api/requirements.txt
cd demo/api
uvicorn main:app --reload --port 8000
```

> 프롬프트에 `(.venv)` 표시되면 venv 활성화 성공.

첫 시작 시 lifespan에서:
1. 임베딩 npz 로드 (~5초)
2. 5컴포넌트 행렬 계산 (~1분, 999 × 3,000)
3. head 5개 학습 (~20초, 관점 A·B·C·D·E)

`INFO: Model ready ✅` 로그가 보이면 준비 완료.

## API 명세

자동 생성된 Swagger: `http://localhost:8000/docs`

### `GET /healthz`

모델 로드 상태 확인.

```json
{ "status": "ok", "modelLoaded": true, "device": "mps" }
```

### `GET /users`

999명 user 목록.

```json
{
  "total": 999,
  "users": [
    {
      "userId": "P0247",
      "jobs": ["rnd"],
      "industries": ["automotive"],
      "abilityKeywords": ["문제해결", "...", ...],
      "starPreview": "자동차 엔진 효율 최적화 프로젝트에서..."
    }
  ]
}
```

### `GET /perspectives`

5관점 정의 + 라벨러 가중치.

```json
{
  "perspectives": [
    {
      "id": "D",
      "name": "D: Context-Fit (산업 매칭 우선)",
      "description": "산업 매칭을 가장 중요하게 평가합니다. 중소기업 매칭에 강점.",
      "weights": { "role": 0.20, "industry": 0.45, "skill": 0.00, "star": 0.20, "comp": 0.15 }
    }
  ]
}
```

### `POST /match`

요청:

```json
{ "userId": "P0247", "perspective": "D", "topK": 10 }
```

응답:

```json
{
  "userId": "P0247",
  "perspective": "D",
  "results": [
    {
      "rank": 1,
      "jobId": 306194,
      "company": "현대모비스",
      "title": "자동차 R&D 엔지니어",
      "role": "rnd",
      "industry": "automotive",
      "score": 2.34,
      "label": 4,
      "components": {
        "role_match": 1.0, "hard_skill": 0.20, "industry_match": 1.0,
        "star_overlap": 0.35, "competency": 0.50
      },
      "summary": "...",
      "duties": "...",
      "ideal": "...",
      "requiredSkills": ["엔진 설계", "ANSYS", "..."]
    }
  ],
  "modelInfo": {
    "backbone": "Qwen3-Embedding-0.6B",
    "head": "MLP-128 (branched per perspective)",
    "perspective": "D",
    "userPool": 999,
    "jdPool": 3000
  }
}
```

## 환경 변수 / 설정

없음. 모든 경로는 `data_loader.py`의 `ROOT` 변수가 `__file__` 기준으로 자동 산출.

## 의존성

`requirements.txt` 참조. 핵심:

- fastapi >= 0.118
- uvicorn[standard]
- torch >= 2.2 (MPS 지원)
- transformers >= 4.40
- pandas, numpy

## 관련 문서

- `demo/README.md` — 전체 데모 구현 범위
- `modeling/17_v2_embedding_fusion.ipynb` — V2 모델 학습·평가 노트북
- `wiki/experiment/exp-023-v2-embedding-fusion-head.md` — V2 분석 페이지
