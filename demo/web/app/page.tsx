"use client";

import Link from "next/link";
import {
  Sparkles,
  Beaker,
  ArrowRight,
  Database,
  Layers,
  Target,
  Zap,
  ShieldCheck,
  Cpu,
} from "lucide-react";

export default function LandingPage() {
  return (
    <main className="overflow-hidden">
      {/* ─────────── Hero ─────────── */}
      <section className="relative">
        {/* 배경 그라데이션 */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-32 left-1/2 h-[640px] w-[1280px] -translate-x-1/2 rounded-full bg-gradient-to-br from-blue-100 via-sky-blue-50 to-transparent opacity-70 blur-3xl" />
          <div className="absolute top-40 right-0 h-[400px] w-[400px] rounded-full bg-blue-200/40 blur-3xl" />
        </div>

        <div className="mx-auto max-w-6xl px-6 pt-20 pb-16 md:pt-28 md:pb-24">
          <div className="flex flex-col items-center text-center">
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-gray-950 md:text-6xl md:leading-[1.15]">
              자기소개서로 찾는
              <br />
              <span className="bg-gradient-to-br from-blue-600 via-blue-500 to-sky-blue-500 bg-clip-text text-transparent">
                나에게 맞는 채용공고
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-base text-gray-600 md:text-lg md:leading-relaxed">
              Qwen3-Embedding-0.6B에 학습된 MLP-128 head가
              <br className="hidden md:inline" />
              자소서의 *서사 의미*를 잡아 999명 user × 3,000 JD를 매칭합니다.
            </p>

            {/* CTA */}
            <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
              <Link
                href="/user-demo"
                className="inline-flex items-center gap-2 rounded-full bg-blue-500 px-6 py-3 text-sm font-semibold text-common-white shadow-md shadow-blue-200 transition-all hover:bg-blue-600 hover:shadow-lg"
              >
                <Sparkles className="h-4 w-4" />
                기존 사용자 매칭 보기
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/test"
                className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-common-white px-6 py-3 text-sm font-semibold text-gray-800 transition-all hover:border-gray-400 hover:bg-gray-50"
              >
                <Beaker className="h-4 w-4" />
                내 자소서로 직접 테스트
              </Link>
            </div>

            {/* Stats Row */}
            <div className="mt-16 grid w-full max-w-3xl grid-cols-3 gap-4 rounded-2xl border border-gray-200 bg-common-white/60 p-6 backdrop-blur md:gap-8">
              <Stat label="학습 user" value="999명" sublabel="자기소개서 11,986행" />
              <Stat label="JD 풀" value="3,000개" sublabel="enriched 채용공고" />
              <Stat label="독립 라벨 NDCG" value="0.939" sublabel="V1 대비 +0.019p" accent />
            </div>
          </div>
        </div>
      </section>

      {/* ─────────── 3 Feature Cards ─────────── */}
      <section className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-gray-950 md:text-4xl">
            왜 V2인가
          </h2>
          <p className="mt-3 text-sm text-gray-600 md:text-base">
            V1(rule fusion)이 천장에 막혔던 평가에서, 임베딩 의미 신호가 처음으로 V1을 능가한 결과.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <FeatureCard
            icon={Cpu}
            title="임베딩 + 학습 head"
            desc="자소서·JD 텍스트를 Qwen3로 통째 임베딩 후 MLP-128이 5컴포넌트와 결합해 매칭 점수를 계산"
            tag="exp-023"
          />
          <FeatureCard
            icon={Layers}
            title="5관점 분기"
            desc="Job · Resume · Skill · Industry · Mixed 각 관점별 독립 MLP 학습. 같은 user에 관점별로 결과가 다름"
            tag="5 perspectives"
          />
          <FeatureCard
            icon={ShieldCheck}
            title="GT 부재 평가 방법론"
            desc="순환 라벨의 천장 효과(0.998)를 진단·완화하고, API로 만든 독립 라벨에서 V1 대비 +0.019p 우위 입증"
            tag="차별성 ④"
          />
        </div>
      </section>

      {/* ─────────── Workflow ─────────── */}
      <section className="bg-gradient-to-b from-blue-50/30 via-common-white to-common-white py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-gray-950 md:text-4xl">
              어떻게 사용하나
            </h2>
            <p className="mt-3 text-sm text-gray-600 md:text-base">
              두 가지 시나리오 모두 지원합니다.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <ScenarioCard
              href="/user-demo"
              icon={Sparkles}
              step="시나리오 1"
              title="기존 사용자 매칭"
              desc="학습 데이터 999명 user 중 한 명 선택 → 관심 직무·산업·자소서가 자동 로드 → 즉시 Top-K 매칭 결과 표시. 시연 및 평가 재현 용도."
              cta="기존 사용자 시작 →"
              accent="blue"
            />
            <ScenarioCard
              href="/test"
              icon={Beaker}
              step="시나리오 2"
              title="새 자소서로 직접 테스트"
              desc="새 자기소개서 입력 → Qwen3-Embedding-0.6B가 라이브로 인코딩 → V2 모델이 3,000 JD 중 매칭. 모델의 *실전 동작*을 확인."
              cta="자소서 테스트 시작 →"
              accent="sky-blue"
            />
          </div>
        </div>
      </section>

      {/* ─────────── Footer ─────────── */}
      <footer className="border-t border-gray-200 bg-common-white">
        <div className="mx-auto max-w-6xl px-6 py-8 text-center text-xs text-gray-600">
          <div className="flex flex-wrap items-center justify-center gap-4">
            <span className="flex items-center gap-1.5">
              <Database className="h-3 w-3" />
              user 999명 · JD 3,000
            </span>
            <span>·</span>
            <span className="flex items-center gap-1.5">
              <Zap className="h-3 w-3" />
              Qwen3-0.6B + MLP-128
            </span>
            <span>·</span>
            <span className="flex items-center gap-1.5">
              <Target className="h-3 w-3" />
              독립 NDCG@10 0.9390
            </span>
          </div>
        </div>
      </footer>
    </main>
  );
}

/* ─────────── 헬퍼 컴포넌트 ─────────── */

function Stat({
  label,
  value,
  sublabel,
  accent,
}: {
  label: string;
  value: string;
  sublabel: string;
  accent?: boolean;
}) {
  return (
    <div className="text-center">
      <div className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</div>
      <div
        className={`mt-1 text-2xl font-bold md:text-3xl ${
          accent ? "bg-gradient-to-r from-blue-600 to-sky-blue-500 bg-clip-text text-transparent" : "text-gray-950"
        }`}
      >
        {value}
      </div>
      <div className="mt-1 text-[11px] text-gray-500">{sublabel}</div>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  desc,
  tag,
}: {
  icon: typeof Cpu;
  title: string;
  desc: string;
  tag: string;
}) {
  return (
    <div className="group rounded-2xl border border-gray-200 bg-common-white p-6 transition-all hover:border-blue-300 hover:shadow-lg hover:shadow-blue-100/50">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-sky-blue-50 text-blue-600 transition-colors group-hover:from-blue-500 group-hover:to-sky-blue-500 group-hover:text-common-white">
        <Icon className="h-5 w-5" />
      </div>
      <div className="mb-2 flex items-start justify-between">
        <h3 className="text-base font-bold text-gray-950">{title}</h3>
        <span className="rounded-md bg-gray-100 px-1.5 py-0.5 font-mono text-[10px] text-gray-600">
          {tag}
        </span>
      </div>
      <p className="text-sm leading-relaxed text-gray-600">{desc}</p>
    </div>
  );
}

function ScenarioCard({
  href,
  icon: Icon,
  step,
  title,
  desc,
  cta,
  accent,
}: {
  href: string;
  icon: typeof Sparkles;
  step: string;
  title: string;
  desc: string;
  cta: string;
  accent: "blue" | "sky-blue";
}) {
  const bgClass =
    accent === "blue"
      ? "bg-gradient-to-br from-blue-500 to-blue-600 text-common-white shadow-blue-200"
      : "bg-gradient-to-br from-sky-blue-500 to-sky-blue-600 text-common-white shadow-sky-blue-200";
  const iconBgClass =
    accent === "blue" ? "bg-blue-400/20 text-common-white" : "bg-sky-blue-400/20 text-common-white";
  return (
    <Link
      href={href}
      className={`group block rounded-2xl ${bgClass} p-8 shadow-lg transition-all hover:scale-[1.01] hover:shadow-xl`}
    >
      <div className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl ${iconBgClass} backdrop-blur`}>
        <Icon className="h-6 w-6" />
      </div>
      <div className="mb-1 text-xs font-medium opacity-80">{step}</div>
      <h3 className="text-xl font-bold">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed opacity-90">{desc}</p>
      <div className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold transition-transform group-hover:translate-x-0.5">
        {cta}
      </div>
    </Link>
  );
}

