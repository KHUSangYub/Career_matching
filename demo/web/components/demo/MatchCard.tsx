"use client";

import { useState } from "react";
import { Building2, Briefcase, Trophy } from "lucide-react";
import type { MatchItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ComponentScoreChart } from "./ComponentScoreChart";

interface Props {
  item: MatchItem;
  initiallyExpanded?: boolean;
}

const LABEL_COLOR: Record<number, string> = {
  0: "bg-gray-200 text-gray-700",
  1: "bg-gray-300 text-gray-800",
  2: "bg-yellow-100 text-yellow-800 border border-yellow-300",
  3: "bg-sky-blue-100 text-sky-blue-700 border border-sky-blue-300",
  4: "bg-green-100 text-green-700 border border-green-300",
};

export function MatchCard({ item, initiallyExpanded = false }: Props) {
  const [open, setOpen] = useState(initiallyExpanded);

  return (
    <div
      className={cn(
        "rounded-lg border bg-common-white shadow-sm transition-all",
        open ? "border-blue-200" : "border-gray-200 hover:border-gray-300 hover:shadow-md",
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start gap-4 p-5 text-left"
      >
        <div
          className={cn(
            "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold",
            item.rank === 1
              ? "bg-blue-500 text-common-white"
              : item.rank <= 3
              ? "bg-blue-50 text-blue-700"
              : "bg-gray-100 text-gray-700",
          )}
        >
          {item.rank === 1 ? <Trophy className="h-5 w-5" /> : `#${item.rank}`}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-base font-bold text-gray-950">{item.company || "(회사 미상)"}</span>
            <span className={cn("rounded-md px-1.5 py-0.5 text-xs font-medium", LABEL_COLOR[item.label] ?? "bg-gray-100")}>
              라벨 {item.label}/4
            </span>
            <span className="text-xs text-gray-500">·</span>
            <span className="font-mono text-xs text-gray-500">job_id {item.jobId}</span>
          </div>
          <div className="mt-1 line-clamp-1 text-sm text-gray-700">{item.title}</div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            {item.role && (
              <span className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-blue-700">
                <Briefcase className="h-3 w-3" />
                {item.role}
              </span>
            )}
            {item.industry && (
              <span className="inline-flex items-center gap-1 rounded-md border border-sky-blue-200 bg-sky-blue-50 px-2 py-0.5 text-sky-blue-700">
                <Building2 className="h-3 w-3" />
                {item.industry}
              </span>
            )}
          </div>
        </div>

      </button>

      {open && (
        <div className="border-t border-gray-100 p-5">
          <div className="grid gap-4 md:grid-cols-[1fr_240px]">
            <div className="space-y-3">
              {item.summary && (
                <Section label="요약">
                  <p className="text-sm leading-relaxed text-gray-700">{item.summary}</p>
                </Section>
              )}
              {item.duties && (
                <Section label="주요 업무">
                  <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-line">{item.duties}</p>
                </Section>
              )}
              {item.ideal && (
                <Section label="인재상">
                  <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-line">{item.ideal}</p>
                </Section>
              )}
              {item.requiredSkills.length > 0 && (
                <Section label="필수 스킬">
                  <div className="flex flex-wrap gap-1.5">
                    {item.requiredSkills.map((s) => (
                      <span
                        key={s}
                        className="rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs text-gray-700"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </Section>
              )}
            </div>
            <ComponentScoreChart components={item.components} />
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-xs font-semibold text-gray-700">{label}</div>
      {children}
    </div>
  );
}
