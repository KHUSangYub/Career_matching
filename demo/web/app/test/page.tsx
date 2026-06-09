"use client";

import { useState } from "react";
import { Beaker, Loader2, Send, AlertCircle, Info } from "lucide-react";
import { useMatchCustom } from "@/hooks/useMatchCustom";
import { PerspectiveSelector } from "@/components/demo/PerspectiveSelector";
import { MatchCard } from "@/components/demo/MatchCard";
import type { Perspective } from "@/lib/types";

// 실제 user_data.csv에서 추출한 자기소개서 예시
const EXAMPLES = [
  {
    label: "💼 P0247 · 컨설팅 / 핀테크 (서비스 기획)",
    jobs: "consulting, planning_strategy, service_pm",
    industries: "finance_fintech, it_software, ai_data",
    abilityKeywords:
      "전략·기획 역량, 문제해결 능력, 정보수집·분석 역량, 커뮤니케이션 역량, 고객·서비스 지향",
    text:
      "대학생 핀테크 서포터즈로서 신규 자산관리 앱의 사용자 만족도를 높이기 위한 개선 프로젝트를 수행했습니다. " +
      "초기 사용자 인터뷰 결과, 고령층 사용자들이 송금 및 자산 확인 과정에서 메뉴 진입의 어려움을 겪고 있다는 점을 발견했습니다. " +
      "사용자 피드백(VOC) 100여 건을 분석하여 이탈률이 높은 지점을 파악하고 UI 개선안을 도출하는 과제를 설정했습니다. " +
      "먼저 수집된 VOC를 '기능 오류', '사용성 불편', '디자인 제안'의 세 가지 카테고리로 분류했습니다. " +
      "이후 가장 비중이 높았던 '사용성 불편' 항목 중 송금 단계의 뎁스(Depth)를 줄이는 방안을 기획했습니다. " +
      "또한 팀원들과 함께 프로토타입을 제작하여 실제 고령 사용자 5명에게 사용성 테스트를 진행하고 피드백을 수용했습니다. " +
      "마지막으로 기존 대비 클릭 횟수를 2회 줄인 '간편 모드' 도입을 최종 제안서에 담았습니다. " +
      "단순한 아이디어가 아닌 실제 사용자의 불편 지점을 근거로 개선안을 마련해야 실질적인 전환율 상승을 기대할 수 있다고 판단했습니다.",
  },
  {
    label: "📊 P1001 · 데이터/AI / 금융 (AI 경진대회)",
    jobs: "data_ai_ml, finance_investment, service_pm",
    industries: "ai_data, finance_fintech, it_software",
    abilityKeywords:
      "정보수집·분석 역량, 문제해결 능력, 디지털·기술 활용 역량, 창의·혁신 역량, 학습·성장 역량",
    text:
      "주식 시장의 급격한 변동성을 예측하기 위한 AI 경진대회에 팀장으로 참여하였습니다. " +
      "기존의 표준 모델로는 특정 이벤트 발생 시 발생하는 급격한 오차를 줄이는 데 한계가 있었습니다. " +
      "모델의 예측 정확도를 나타내는 RMSE 지표를 기존 대비 50% 이상 개선하는 것을 목표로 설정하였습니다. " +
      "먼저 이상치가 발생한 시점의 뉴스 데이터를 크롤링하여 텍스트 마이닝을 실시하였습니다. " +
      "이후 감성 분석 점수를 파생 변수로 생성하여 시계열 모델에 결합하는 하이브리드 구조를 설계하였습니다. " +
      "또한 외부 거시경제 지표 중 상관관계가 높은 변수를 선별하여 다변량 분석을 수행하였습니다. " +
      "마지막으로 모델의 과적합을 방지하기 위해 교차 검증 과정을 강화하여 안정성을 확보하였습니다. " +
      "수치 데이터만으로는 시장의 심리적 요인을 반영할 수 없다고 판단하여 비정형 데이터 활용을 선택했습니다. " +
      "최종적으로 예측 오차를 71% 개선하며 대회 상위 5% 이내의 성적을 거두었습니다.",
  },
  {
    label: "🛍️ P0522 · 서비스 PM / 패션 커머스 (UX 개선)",
    jobs: "service_pm, marketing, cs_cx",
    industries: "retail_ecommerce, fashion, it_software",
    abilityKeywords:
      "고객·서비스 지향, 정보수집·분석 역량, 협업·팀워크, 전략·기획 역량, 커뮤니케이션 역량",
    text:
      "대학생 연합 IT 서비스 기획 프로젝트에서 특정 패션 커머스 앱의 사용자 이탈률이 결제 단계에서 급증하는 문제를 분석하게 되었습니다. " +
      "사용자 인터뷰 결과, 복잡한 필터 기능과 결제 수단 선택 과정에서의 번거로움이 주요 이탈 원인으로 파악되었습니다. " +
      "사용자 여정 지도(User Journey Map)를 재설계하여 구매 전환율을 높이고 앱 내 체류 시간을 개선하는 제안서를 작성하는 것이 목표였습니다. " +
      "먼저 경쟁사 앱 5곳의 UI/UX를 벤치마킹하여 필터링 시스템의 편의성을 비교 분석했습니다. " +
      "이후 20대 사용자 10명을 대상으로 UT(User Test)를 실시하여 실제 클릭 동선과 병목 지점을 데이터화했습니다. " +
      "또한 분석 결과를 바탕으로 '원클릭 필터'와 '간편 결제 우선 배치'를 핵심으로 하는 와이어프레임을 제작했습니다. " +
      "마지막으로 기획안을 현업 디자이너에게 피드백 받아 실현 가능성을 검토한 후 최종 제안서를 완성했습니다. " +
      "주관적인 미적 감각보다는 실제 사용자의 행동 데이터와 불편 사항에 근거한 개선이 서비스 성과로 직결될 것이라고 믿었습니다.",
  },
];

export default function TestPage() {
  const [text, setText] = useState(EXAMPLES[0].text);
  const [jobs, setJobs] = useState(EXAMPLES[0].jobs);
  const [industries, setIndustries] = useState(EXAMPLES[0].industries);
  const [abilityKeywords, setAbilityKeywords] = useState(EXAMPLES[0].abilityKeywords);
  const [perspective, setPerspective] = useState<Perspective>("E");
  const [topK, setTopK] = useState(10);

  const mutation = useMatchCustom();

  const handleSubmit = () => {
    if (text.trim().length < 20) {
      alert("자기소개서는 최소 20자 이상이어야 합니다.");
      return;
    }
    mutation.mutate({
      text,
      jobs: jobs.split(",").map((s) => s.trim()).filter(Boolean),
      industries: industries.split(",").map((s) => s.trim()).filter(Boolean),
      abilityKeywords: abilityKeywords.split(",").map((s) => s.trim()).filter(Boolean),
      perspective,
      topK,
    });
  };

  const applyExample = (i: number) => {
    const ex = EXAMPLES[i];
    setText(ex.text);
    setJobs(ex.jobs);
    setIndustries(ex.industries);
    setAbilityKeywords(ex.abilityKeywords);
  };

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      {/* 헤드 */}
      <div className="mb-6 flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-blue-50 text-sky-blue-600">
          <Beaker className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-950">자소서 직접 테스트</h1>
          <p className="mt-1 text-sm text-gray-600">
            새 자기소개서 입력 → Qwen3 라이브 인코딩 → 3,000 JD 중 Top-K 매칭. 첫 호출은 모델 로드로 약 20초 소요.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-[420px_1fr]">
        {/* 좌측: 입력 폼 */}
        <aside className="space-y-5">
          {/* 예시 적용 */}
          <div className="rounded-lg border border-gray-200 bg-common-white p-4">
            <div className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-800">
              <Info className="h-3.5 w-3.5 text-gray-500" />
              예시로 채우기
            </div>
            <div className="grid grid-cols-1 gap-2">
              {EXAMPLES.map((ex, i) => (
                <button
                  key={ex.label}
                  type="button"
                  onClick={() => applyExample(i)}
                  className="rounded-md border border-gray-200 px-3 py-2 text-left text-xs text-gray-700 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                >
                  {ex.label}
                </button>
              ))}
            </div>
          </div>

          {/* 입력 필드 */}
          <div className="space-y-3 rounded-lg border border-gray-200 bg-common-white p-4">
            <Field label="관심 직무 (쉼표 구분)">
              <input
                type="text"
                value={jobs}
                onChange={(e) => setJobs(e.target.value)}
                placeholder="rnd, manufacturing"
                className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </Field>
            <Field label="관심 산업 (쉼표 구분)">
              <input
                type="text"
                value={industries}
                onChange={(e) => setIndustries(e.target.value)}
                placeholder="automotive, semiconductor"
                className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </Field>
            <Field label="보유 역량 키워드 (쉼표 구분)">
              <input
                type="text"
                value={abilityKeywords}
                onChange={(e) => setAbilityKeywords(e.target.value)}
                placeholder="문제해결, 분석, 협업"
                className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </Field>
            <Field label={`자기소개서 본문 (${text.length}자, 최소 20자)`}>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={10}
                placeholder="STAR 구조로 작성된 자기소개서 본문..."
                className="w-full resize-y rounded-md border border-gray-300 px-3 py-2 text-sm leading-relaxed focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </Field>
          </div>

          {/* 관점 + Top-K */}
          <PerspectiveSelector value={perspective} onChange={setPerspective} />
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-800">
              Top-K · <span className="font-mono text-blue-600">{topK}</span>
            </label>
            <input
              type="range"
              min={5}
              max={30}
              step={1}
              value={topK}
              onChange={(e) => setTopK(Number(e.target.value))}
              className="w-full accent-blue-500"
            />
          </div>

          {/* 매칭 시작 버튼 */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={mutation.isPending || text.trim().length < 20}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-blue-500 px-5 py-3 text-sm font-semibold text-common-white shadow-md shadow-blue-200 transition-all hover:bg-blue-600 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                매칭 중... (첫 호출 ~20초)
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                매칭 시작
              </>
            )}
          </button>
        </aside>

        {/* 우측: 결과 */}
        <section className="space-y-4">
          {!mutation.data && !mutation.isPending && !mutation.error && (
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
              <Beaker className="mx-auto mb-3 h-10 w-10 text-gray-400" />
              <div className="text-sm text-gray-700">자소서를 입력하고 [매칭 시작] 버튼을 누르세요.</div>
              <div className="mt-2 text-xs text-gray-500">
                좌측 상단의 예시 버튼으로 빠르게 채울 수도 있습니다.
              </div>
            </div>
          )}

          {mutation.isPending && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-8 text-center">
              <Loader2 className="mx-auto mb-3 h-10 w-10 animate-spin text-blue-500" />
              <div className="text-sm font-semibold text-blue-700">Qwen3가 자소서를 인코딩하고 있습니다...</div>
              <div className="mt-1 text-xs text-blue-600">
                첫 호출 시 모델 로드 약 20초, 이후 호출은 1~3초.
              </div>
            </div>
          )}

          {mutation.error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
                <div>
                  <div className="font-semibold text-red-700">매칭 실패</div>
                  <div className="mt-1 text-sm text-red-600">{(mutation.error as Error).message}</div>
                </div>
              </div>
            </div>
          )}

          {mutation.data && (
            <>
              <div className="text-sm font-medium text-gray-700">
                Top-{mutation.data.results.length} 결과 · 관점{" "}
                <span className="font-bold text-blue-600">{mutation.data.perspective}</span> · 모델{" "}
                <span className="font-mono text-xs text-gray-500">{mutation.data.modelInfo.backbone}</span>
              </div>
              {mutation.data.results.map((it) => (
                <MatchCard key={`${it.jobId}-${it.rank}`} item={it} initiallyExpanded={it.rank <= 2} />
              ))}
            </>
          )}
        </section>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-gray-700">{label}</label>
      {children}
    </div>
  );
}
