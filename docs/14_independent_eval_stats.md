# exp-020: 우위 재현 테스트 — 독립 라벨 N확장 + 통계 검정

> 내 연구 관점에서의 핵심 takeaway
> - **어느 차별성 축에 연결되는가:** ④ GT 부재 (독립 라벨 + 통계 검정) · ⑤ 자체 학습 노선 신뢰도
> - **무엇을 강화/위협하는가:** 위협(정직) — `docs/12_learnable_fusion_head.md`의 "학습 가중치 우위"가 **N=12 통계 검정에서도 재현되지 않음**(Wilcoxon p≈0.95, Cohen d≈0, 95% CI가 0 포함). 즉 *"학습 fusion이 임의 가중치보다 낫다"는 논문에 못 쓴다*가 통계로 확정.
> - **영향 부위:** 평가 프레임워크 / Fusion 가중치 정의 / 논문 주장 범위
> - **당장 가져갈 1개 액션:** 선형 가중치 재조정은 한계 도달 → 성능 이득은 V2 임베딩에서. 통계검정 표준(effect size + CI)은 `docs/08_wilcoxon_test.md`와 동일.

## 한 줄 요약

`docs/13_independent_eval.md`(N=6, 통계 없음)를 **held-out 12명 × 후보 10 = 120쌍**으로 확장하고 per-user NDCG@10에 Wilcoxon·부트스트랩·Cohen's d를 적용 → **golden·learned 가중치가 arbitrary 대비 통계적으로 유의한 우위 없음(VERDICT 우위 미재현).**

## 핵심 내용

- **데이터:** held-out 12명(exp-019의 6명 + 신규 6명) × 후보 10 = 120쌍. 후보는 role/industry/competency-match + off-target 혼합. 라벨 = LLM가 자소서·JD 원문 직접 읽고 holistic relevance 0~4 (LLM-API 0건). 1~6번은 exp-019 라벨 재사용.
- **비교:** E(균형) 관점 가중치 — arbitrary_E / golden_E / learned_E. per-user NDCG@10 (n=12).

| 비교 | Δ NDCG@10 | Wilcoxon p | Cohen d | 95% CI | 유의? |
|---|---|---|---|---|---|
| golden − arbitrary | +0.000 | 1.000 | 0.00 | [0, 0] | ❌ (E 가중치 동일) |
| learned − arbitrary | −0.002 | 0.945 | −0.04 | [−0.030, +0.024] | ❌ (0 포함) |

- **컴포넌트 vs 독립 라벨 Spearman (120쌍, 안정적):** role_match **+0.61** ≫ hard_skill +0.39 > industry +0.33 > star_overlap +0.25 > **competency +0.16**(최약).

## 내 연구에의 적용

- **논문 주장 범위:** "학습/최적 가중치가 임의 가중치보다 우수"는 **통계적으로 입증 불가** → 성능 우위 주장 금지. 대신 *"선형 fusion 가중치 재조정은 실제 적합도에서 한계(임의값과 동급), 이득은 의미 임베딩에서"*가 정직한 발견.
- **평가 프레임워크(④):** effect size + CI 병기(N 작을 때 p값 단독 위험) — `docs/08_wilcoxon_test.md` 표준 계승.
- **V2 동기:** role_match 외 컴포넌트(특히 competency)가 약해 선형 결합 한계. 자소서 STAR 의미를 임베딩으로 잡는 V2가 다음.

## 한계 · 비판 · 모순

> ⚠️ N=12 user / 120쌍, 단일 채점자(LLM), holistic(E) 라벨만
> 관점별(A~D) 독립 라벨·인간 교차검증은 미수행. golden_E가 arbitrary_E와 동일 가중치(균등)라 그 비교는 정의상 Δ=0 — 실질 검정 대상은 learned vs arbitrary.

## 관련 페이지
- `docs/13_independent_eval.md` — 본 실험이 확장·통계화한 원 실험
- `docs/12_learnable_fusion_head.md` — 검증 대상(규칙 라벨 기반 우위)
- `docs/08_wilcoxon_test.md` — effect size 보고 표준의 선례
- `docs/10_learnable_fusion_plan.md` — V2 동기 강화

## 출처
- 노트북: `output/exp-020-independent-eval-stats.ipynb`
- 결과: `raw/experiments/exp-020-independent-eval-stats/` (eval_pairs / llm_labels / per_user_ndcg / component_correlation / meta.json)

## 메타
- 작성일: 2026-05-31
- 마지막 갱신: 2026-05-31
- 태그: #실험 #평가 #통계검정 #우위미재현 #순환성 #트랙8 #LLM호출0건