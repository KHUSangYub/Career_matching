# exp-018: 학습 가능한 fusion head (V1 — 관점별 선형)

> 내 연구 관점에서의 핵심 takeaway
> - **어느 차별성 축에 연결되는가:** ④ GT 부재(LLM 생성 graded relevance) · ⑤ 매칭 head 자체 학습(LLM 합성·재랭킹 0건)
> - **무엇을 강화/위협하는가:** 강화 — exp-017 천장을 깨는 **3,000 JD 전체 풀 평가**에서 임의 가중치(평균 NDCG@10 0.936)가 학습/황금 가중치(≈0.996) 대비 명백히 열등함을 드러냄(특히 C=Skill 0.785). 위협 — 라벨이 LLM 규칙 생성이라 결과가 *부분적으로 순환적*(`docs/13_independent_eval.md`에서 검증).
> - **영향 부위:** Fusion 가중치 정의 / 평가 프레임워크
> - **당장 가져갈 1개 액션:** 선형 head는 grid 황금 가중치를 따라잡을 뿐 능가하진 못함 → 진짜 이득은 V2 임베딩(자소서 의미 신호)에서.

## 한 줄 요약

`user_data.csv`(999명) × `jd_enriched.partial.csv`(3,000 JD)에서 **LLM가 직접 만든 graded relevance**로 관점별 선형 head(Ridge)를 학습. held-out 199명을 3,000 JD에 랭킹한 de-saturated 평가에서 **임의 0.936 < 황금 0.998 ≈ 학습 0.996**, 학습 λ vs 황금 λ cosine 5/5 ≥ 0.8.

## 핵심 내용

- **설계 결정(2026-05-31 사용자 확정):** (1) 후보 풀 = 주신 3,000 JD 전체, (2) 라벨 = LLM가 데이터 보고 직접 생성(규칙·LLM-API 아님, 관점별 가중 + 비선형 상호작용), (3) 순환성 완화 = userId 기준 train 800/held-out 199 분리 + 임의/황금/학습 3자 비교.
- **컴포넌트(5, distinct):** role_match / hard_skill / industry_match / star_overlap / **competency**. (원 exp-017의 `context`는 산업과 중복이라 제거, 자소서 역량키워드↔`jd_competencies` 매칭인 competency 추가.)
- **모델 V1:** 관점별 positive Ridge (6→5컴포넌트 선형 가중치, 해석 가능).
- **학습셋:** 88,000행 (800명 × 후보 ~20개 × 5관점), label dist {0:28.7k,1:14.6k,2:23.2k,3:17.2k,4:4.3k}.

| 관점 | 임의 | 황금(grid) | 학습(V1) |
|---|---|---|---|
| A | 0.995 | 1.000 | 1.000 |
| B | 0.932 | 0.998 | 0.991 |
| **C** | **0.785** | 0.997 | 0.995 |
| D | 0.972 | 1.000 | 1.000 |
| E | 0.997 | 0.997 | 0.993 |
| **평균** | **0.936** | **0.998** | **0.996** |

- golden − arbitrary = **+0.062p** (exp-017 500쌍에선 +0.000였던 격차가 풀 확장으로 드러남)
- learned λ vs golden λ cosine: A 0.97 / B 0.96 / C 0.998 / D 0.93 / E 0.84 — **5/5 ≥ 0.8** (계획서 성공기준 통과)

## 내 연구에의 적용

- **Fusion 가중치:** 임의 가중치(특히 C=Skill `skill 0.7`)는 큰 풀에서 약함. 데이터로 학습한 가중치가 더 낫다는 1차 증거.
- **평가 프레임워크:** "user를 전체 JD 풀에 랭킹"이 천장을 깨는 핵심. `docs/11_grid_search.md` 대비 변별력 확보.
- **다음(V2/V3):** 선형 head는 황금 가중치≈수준 → 비선형·임베딩(KURE-v1/Qwen3)으로 자소서 의미 신호를 더해야 추가 이득. 차별성 ①②.

## 한계 · 비판 · 모순

> ⚠️ 순환성 — learned > arbitrary가 라벨 아티팩트일 수 있음
> 라벨이 LLM의 (대체로 선형) 규칙으로 생성되어, 그 규칙을 선형 head가 복원하는 측면이 있다. `docs/13_independent_eval.md`에서 **독립 라벨로 재평가하니 learned가 arbitrary를 못 이김(-0.011p)** — 본 +0.062p 우위는 부분적으로 순환 아티팩트로 확인됨. 절대 성능이 아닌 *가중치 스킴 간 상대 비교*로 해석.

## 관련 페이지
- KCC-한국어-자기소개서-채용공고-양방향-정성-매칭-시스템 — 본 실험의 가중치 발전 흐름이 최종 논문 원고에 반영된 위치
- `docs/10_learnable_fusion_plan.md` §4 exp-018 (설계 출처)
- `docs/11_grid_search.md` — 천장 발견(이 실험의 동기)
- `docs/13_independent_eval.md` — ★ 본 결과의 순환성 검증 (필독 동반)
- `docs/03_perspective_fusion_weight_design.md` — 임의 가중치 5세트 원안

## 출처
- 노트북: `output/exp-018-learnable-fusion-head.ipynb`
- 결과: `raw/experiments/exp-018-learnable-fusion-head/` (ndcg_results / learned·golden·arbitrary_weights / learned_vs_golden_cosine / training_label_distribution / spot_check / meta.json)

## 메타
- 작성일: 2026-05-31
- 마지막 갱신: 2026-05-31
- 태그: #실험 #learnable-fusion #트랙8 #LLM호출0건 #순환성