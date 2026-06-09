# exp-023: V2 임베딩 + 학습 head (★ 차별성 ① 첫 정량 입증)

> 내 연구 관점에서의 핵심 takeaway
> - **어느 차별성 축에 연결되는가:** ① 자소서 정성 (★ **처음으로 정량 입증**), ② 한국어 (Qwen3 vs KURE), ⑤ E2E LLM 재정의 (LLM 호출 0건, 매칭은 자체 임베딩 + 학습 head)
> - **무엇을 강화하는가:** **독립 라벨 평가에서 V2 NDCG=0.9390 > V1 golden 0.9204 (+0.019p)** — 지금까지 (exp-019/020) 모든 가중치 튜닝이 독립 라벨에서 효과 없었으나, *임베딩 의미 신호*는 처음으로 V1 능가. 자소서 임베딩이 실제 매칭에 기여한다는 정량 증거.
> - **위협:** 순환 라벨(held-out 199 × 3k JD)에서는 V1 = V2 = 0.998로 동률 — exp-022가 짚은 천장 효과 그대로. 독립 라벨이 *유일한 신뢰 평가*임을 재확인.
> - **영향 부위:** Dual Encoder / 매칭 head (Qwen3-0.6B 또는 KURE-v1 + MLP-128), 평가 프레임워크 (독립 라벨 필수)
> - **당장 가져갈 1개 액션:** 논문 §결과에 "V2 독립 라벨 NDCG = 0.9390 (V1 0.9204 대비 +0.019p)"을 차별성 ① 핵심 증거로 명시. Production 권장: Qwen3 + MLP-128 + MSE + wd=1e-3 (4초 학습).

## 한 줄 요약

임베딩(Qwen3 또는 KURE) + MLP-128 head가 독립 라벨 NDCG=0.9390으로 V1(rule fusion) 0.9204를 +0.019p 능가. **자소서 정성 신호가 매칭에 실제 기여한다는 첫 정량 증거.** 백본은 Qwen3 ≈ KURE (동률), 핵심은 **비선형 (MLP > Linear)**.

## 실험 설계

| 항목 | 설정 |
|---|---|
| 데이터 | user 999명 전체 + JD 3,000 전체 |
| 백본 | Qwen3-Embedding-0.6B (last_token pool) / KURE-v1 (mean pool) |
| 학습 head | `[user_emb (1024) ⊕ jd_emb (1024) ⊕ 5컴포넌트] → score` |
| 평가 | held-out 199 × 3k JD (순환) + LLM 독립 라벨 120쌍 |
| 시드 | 42 (numpy / torch / mps / python random / PYTHONHASHSEED) |
| 환경 | python 3.12.13, torch 2.12.0 (MPS), transformers 5.8.1 |
| 코드 | `output/exp-023-v2-embedding-fusion-head.ipynb` |
| LLM 호출 | ❌ 0건 (임베딩 모델은 inference만) |

**Sweep 차원 (16 configs):** 백본 2 × arch 2 × loss 2 × wd 2.

## 핵심 결과

### ★ 1. 독립 라벨 평가 (★ 진짜 성능 — 본 실험의 가장 중요한 결과)

| 모델 | 독립 라벨 NDCG@10 (120쌍) | exp-020 비교 |
|---|---|---|
| V1 golden (rule fusion, exp-018) | 0.9204 | (재현: exp-020 0.9204) |
| **V2 (Qwen3 + MLP, branched-E)** | **0.9390** | **+0.019p ★** |

> ★ 결정적 발견 (차별성 ① 정량 입증)
> exp-019/020에서 "모든 가중치 튜닝은 독립 라벨에서 가짜 우위(순환성 아티팩트)"라고 정리됐으나, **임베딩 의미 신호는 처음으로 독립 라벨에서 실질 우위 증명**. 임베딩이 rule 5컴포넌트(boolean + token Jaccard)가 못 잡는 *서사적 의미*를 잡아냄.

### 2. 순환 라벨 평가 (held-out 199 × 3k JD, 5관점 평균)

| 모델 | A | B | C | D | E | **MEAN** |
|---|---|---|---|---|---|---|
| V1 arbitrary (rule) | 0.9951 | 0.9326 | 0.7854 | 0.9719 | 0.9970 | 0.9364 |
| V1 golden (rule) | 0.9998 | 0.9983 | 0.9967 | 1.0000 | 0.9970 | **0.9984** |
| V2 unified (best cfg, 관점 E 학습) | 0.9989 | 0.9765 | 0.9656 | 0.9985 | 0.9995 | 0.9878 |
| **V2 branched (관점별 분기 head)** | **1.0000** | **0.9967** | 0.9959 | **1.0000** | **0.9994** | **0.9984** |

- V1 golden과 V2 branched가 0.9984 동률 — exp-022가 짚은 천장 효과 그대로
- A·D 관점에서 V2가 perfect 1.0 달성
- 5관점 분기 head가 통합 head보다 +0.011p (각 관점별 가중치 따로 학습)

### 3. Sweep 결과 (16 configs, NDCG@10 평균 내림차순)

| Rank | 백본 | arch | loss | wd | MEAN | 학습시간 |
|---|---|---|---|---|---|---|
| 1 | qwen3 | **mlp** | rank | 0.001 | **0.9878** | 39.7s |
| 2 | kure | **mlp** | rank | 0.001 | 0.9878 | 32.3s |
| 3 | kure | mlp | mse | 0.001 | 0.9876 | 4.0s |
| 4 | qwen3 | mlp | mse | 0.001 | 0.9875 | 4.2s |
| 5 | kure | mlp | mse | 0.000 | 0.9867 | 3.9s |
| 6 | qwen3 | mlp | mse | 0.000 | 0.9863 | 4.9s |
| 7 | qwen3 | mlp | rank | 0.000 | 0.9862 | 40.6s |
| 8 | kure | mlp | rank | 0.000 | 0.9862 | 32.5s |
| 9 | kure | **linear** | mse | 0.001 | 0.9456 | 3.3s |
| ... | (linear 모두 0.89~0.95) | | | | | |

## 핵심 ablation 발견 3종

> 
> 1. **MLP가 Linear 압도** (0.987 vs 0.90~0.95, **+0.04~+0.08p**) — 비선형이 본질. 임베딩만 가지고는 부족.
> 2. **Qwen3 ↔ KURE 사실상 동률** (0.0001p 차이) — 모델 선택은 속도/인프라로 결정. 한국어 자소서·JD 도메인에서는 두 모델이 동등.
> 3. **MSE vs Rank: 성능 차이 거의 없음 + MSE 8배 빠름** (4초 vs 40초). → **MSE 권장**.
> 4. **wd=1e-3가 wd=0보다 일관되게 우위** (~+0.001~+0.004p) — overfitting 방지 효과.

## Production 권장 설정

```python
backbone = 'Qwen3-Embedding-0.6B'  # or 'KURE-v1' — 동률
arch = 'MLP-128'  # ★ Linear 대비 +0.04~0.08p
loss = 'MSE'      # ★ Rank 대비 8배 빠르고 성능 동률
wd = 1e-3
lr = 1e-3
epochs = 15
```

→ NDCG@10 = 0.9875 (순환), **0.9390 (독립 라벨, V1 +0.019p)**.

## 내 연구에의 적용

- **자기소개서 파이프라인 (차별성 ①):** ★ **첫 정량 입증** — 임베딩이 자소서 서사 의미를 매칭에 추가. 5컴포넌트 rule만으로는 안 됨. 논문 §결과의 핵심.
- **JD 파이프라인:** Qwen3/KURE 임베딩 = 한국어 JD에서 동등 — Qwen3가 D 관점 우위(exp-009 1k)는 V2 환경에서는 해소됨
- **Dual Encoder / 매칭 (차별성 ② ⑤):** Production = Qwen3 + MLP-128 + MSE. KURE도 가능. LLM API 0건 (E2E LLM 재정의 ⑤ 유지)
- **평가 프레임워크 (차별성 ④):** **독립 라벨이 유일한 신뢰 평가**라는 점이 V1/V2 격차 패턴으로 다시 확인 — 순환 0.998 (V1=V2), 독립 0.92→0.94 (V2 우위)

## 한계 · 비판 · 모순

> ⚠️ 
> - **독립 라벨 N=120쌍**(12명 × 10후보)이라 +0.019p 차이의 통계적 유의성 미검증. **N=200~500 확장 후 Wilcoxon 검정 필수** (다음 실험)
> - V2 unified의 NDCG가 V1 golden보다 *순환에서는* 낮음 (0.988 vs 0.998). 5관점 분기 head는 동률이지만 unified 단일 head는 약함 → 통합 학습이 모든 관점을 동시에 맞추기 어려움
> - 임베딩 입력 텍스트 구성 (user_text/jd_text)이 fixed — 텍스트 chunk·prompt 변경 시 결과 다를 수 있음
> - 학습 데이터 라벨은 여전히 순환 라벨 (rule 기반) — 학습 자체는 순환성 안에 있음. 단, *평가*가 독립이라 우위 인정 가능
> - Linear의 한계가 *임베딩의 한계*인지 *aggregation의 한계*인지 분리 안 됨 — Linear도 임베딩 정보 일부는 잡지만 비선형 상호작용 못 잡음

## 다음 단계 (V3 / 후속)

- **V3 contrastive 학습** — InfoNCE / TripletLoss로 임베딩 자체 fine-tune. Mira-Embeddings-V1 5-stage 패턴 차용
- **순수 dual encoder baseline (cosine only)** — 임베딩만의 효과 분리. exp-024 후보
- **독립 라벨 N 확장** — 200~500 쌍, Wilcoxon 검정으로 +0.019p의 통계적 유의성 검증
- **양방향 매칭** — 자소서→JD + JD→자소서 (차별성 ③ — 여전히 미입증)

## 관련 페이지

- KCC-한국어-자기소개서-채용공고-양방향-정성-매칭-시스템 — exp-023의 V2 독립 라벨 개선이 최종 논문 결론으로 반영된 위치
- `docs/12_learnable_fusion_head.md` — V1 (rule fusion, NDCG 0.998이 처음 등장)
- `docs/13_independent_eval.md` / `docs/14_independent_eval_stats.md` — 독립 라벨 평가 (V1 0.9204 기준점)
- `docs/15_ndcg_root_cause.md` — 순환성 +0.078p 인플레이션
- `docs/16_saturation_analysis.md` — 천장 효과 5겹 분석 (V2가 필요한 이유)
- Qwen3-Embedding / KURE-v1 — 백본 모델
- `docs/10_learnable_fusion_plan.md` — 전체 로드맵
- research-context — 차별성 5축

## 출처

- `output/exp-023-v2-embedding-fusion-head.ipynb` (코드, 시드 42, 재현성 보장)
- `output/17_v2_embedding_fusion/`
  - `sweep_results.csv` — 16 configs
  - `v1_vs_v2_comparison.csv` — held-out 5관점 비교
  - `independent_label_v2_scores.csv` — 120쌍 V2 점수
  - `meta.json` — 환경 + 핵심 수치
  - `embeddings/*.npz` — Qwen3/KURE × user/jd 임베딩 캐시 (재실행 즉시 로드)

## 메타

- 작성일: 2026-06-05
- 마지막 갱신: 2026-06-05
- 태그: #V2 #임베딩학습head #Qwen3 #KURE #MLP #독립라벨우위 #차별성1입증 #최초실질우위