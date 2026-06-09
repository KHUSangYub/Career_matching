# exp-019: 독립 LLM 라벨 eval — learnable fusion 순환성 검증

> 내 연구 관점에서의 핵심 takeaway
> - **어느 차별성 축에 연결되는가:** ④ GT 부재 (LLM-API 없이 LLM in-session 판단을 준-GT로) · ⑤ 자체 학습 노선의 신뢰도 점검
> - **무엇을 강화/위협하는가:** 위협(정직) — exp-018의 "learned > arbitrary(+0.062p)"가 **독립 라벨에선 사라짐(learned 0.906 ≈ arbitrary 0.917, -0.011p)**. 즉 그 우위는 부분적 순환 아티팩트. 강화 — **role_match가 실제 적합도의 압도적 신호(ρ=0.62)**, competency는 최약(ρ=0.15)임을 비순환적으로 확인.
> - **영향 부위:** 평가 프레임워크 / Fusion 가중치 정의
> - **당장 가져갈 1개 액션:** 5개 규칙 컴포넌트의 선형 fusion으로는 실제 적합도에서 임의값 이상을 못 낸다 → V2 임베딩(컴포넌트가 못 잡는 자소서 의미)이 진짜 이득의 원천.

## 한 줄 요약

exp-018 held-out 6명 × 후보 10개 = 60쌍의 자소서·JD 원문을 **LLM(나)가 직접 읽고** holistic relevance(0~4)를 매겨, 규칙 라벨과 독립된 평가를 수행. 규칙 라벨과 Spearman 0.75(완전일치 58%)로 부분 독립, **독립 라벨에선 학습 가중치가 임의 가중치를 못 이김**.

## 핵심 내용

- **방법:** held-out 6명에 후보 10개(role-match 3 / industry 2 / competency 2 / off 3)를 뽑아 텍스트 덤프 → LLM가 "이 사람에게 이 공고가 얼마나 맞나"를 0~4 채점(규칙 컴포넌트와 독립). LLM-API 0건(세션 내 판단). 라벨은 `llm_labels.csv`에 동결.

**(1) 순환성 정량화** — 규칙 E-label vs LLM 독립 라벨: **Spearman 0.754**, 완전일치 58.3%, MAE 0.50. → 규칙 라벨은 실제 판단의 좋은 근사지만 25%는 어긋남.

**(2) 컴포넌트별 실제 적합도 예측력 (비순환 신호)**

| 컴포넌트 | Spearman vs LLM |
|---|---|
| **role_match** | **+0.62** |
| star_overlap | +0.31 |
| hard_skill | +0.31 |
| industry_match | +0.29 |
| **competency** | **+0.15** (최약) |

**(3) NDCG@10 (LLM 독립 라벨 기준)**

| | arbitrary E | golden E | learned E |
|---|---|---|---|
| NDCG@10 | **0.917** | 0.917 | **0.906** |

learned − arbitrary = **-0.011p** (≤0 → 선형 학습이 독립 평가에선 임의값 대비 이득 없음).

- **대표 사례:** P0717의 "광동제약 전략기획팀 신입"은 enum이 `unknown`이라 규칙 점수 ≈0이지만, 제목·배경을 읽으면 그의 *전략기획 지향*과 정확히 맞아 holistic 3점 — 규칙이 놓치는 걸 텍스트 판단이 잡는 직접 증거.

## 내 연구에의 적용

- **Fusion 가중치:** role_match를 최우선으로 두는 게 실제 적합도와 정합. exp-018에서 추가한 competency는 실제 기여가 작음(generic 역량 키워드가 광범위 매칭되기 때문).
- **평가 프레임워크:** 규칙 기반 합성 라벨은 ~75% 신뢰. 결정적 비교(백본 선택 등)는 **독립 라벨**(LLM-as-judge on text, 또는 인간)로 교차검증해야 과대주장 방지. 차별성 ④의 핵심 실천.
- **V2 동기 강화:** 선형 컴포넌트 fusion의 한계가 독립 평가로 확인 → 자소서 STAR ↔ JD 의미 적합도를 잡는 **임베딩 head(KURE-v1/Qwen3, V2)**가 다음 1순위. 차별성 ①②.

## 한계 · 비판 · 모순

> ⚠️ N=6 user / 60쌍, 단일 채점자(LLM)
> 방향성 신호이며 통계적 결론은 N 확장 후. 또한 LLM 자신이 채점자이므로 "LLM 임베딩과의 정합" 편향 가능성은 별도 존재(인간 라벨 교차검증이 이상적).

## 후속 검증 — `docs/14_independent_eval_stats.md` (N=12 + 통계검정)

본 발견을 12명·120쌍으로 확장 + Wilcoxon·부트스트랩·Cohen's d로 검정한 결과 **우위 미재현 확정**:

| 비교 | Δ NDCG@10 | Wilcoxon p | Cohen d | 95% CI |
|---|---|---|---|---|
| golden − arbitrary | +0.000 | 1.000 | 0.00 | [0, 0] (E 가중치 동일) |
| learned − arbitrary | −0.002 | 0.945 | −0.04 | [−0.030, +0.024] (0 포함) |

→ 통계적으로 **유의한 우위 없음**. 컴포넌트 예측력도 안정적 재확인: role_match +0.61 ≫ hard_skill +0.39 > industry +0.33 > star +0.25 > **competency +0.16**.

## 관련 페이지
- `docs/12_learnable_fusion_head.md` — ★ 본 실험이 검증하는 규칙 라벨 기반 결과
- `docs/10_learnable_fusion_plan.md` — V2/V3 동기 강화
- `docs/05_benchmark_100pairs_analysis.md` — 휴리스틱 Judge 순환 편향 문제의 연장선

## 출처
- 노트북: `output/exp-019-independent-llm-eval.ipynb`
- 결과: `raw/experiments/exp-019-independent-llm-eval/` (eval_pairs / llm_labels / ndcg_independent / component_correlation / meta.json)

## 메타
- 작성일: 2026-05-31
- 마지막 갱신: 2026-05-31
- 태그: #실험 #평가 #순환성검증 #독립라벨 #트랙8 #LLM호출0건