"use client";

import { Briefcase, FileText, Wrench, Building2, Layers } from "lucide-react";
import { usePerspectives } from "@/hooks/usePerspectives";
import type { Perspective } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  value: Perspective;
  onChange: (p: Perspective) => void;
}

const ICONS: Record<Perspective, typeof Briefcase> = {
  A: Briefcase,
  B: FileText,
  C: Wrench,
  D: Building2,
  E: Layers,
};

export function PerspectiveSelector({ value, onChange }: Props) {
  const { data, isLoading } = usePerspectives();

  if (isLoading || !data) {
    return (
      <div className="space-y-2">
        <div className="h-32 w-full animate-pulse rounded-md bg-gray-50" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-gray-800">2. 매칭 관점</label>
      <div className="space-y-1.5">
        {data.perspectives.map((p) => {
          const active = p.id === value;
          const Icon = ICONS[p.id];
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onChange(p.id)}
              className={cn(
                "flex w-full items-start gap-3 rounded-md border px-3 py-2.5 text-left transition-all",
                active
                  ? "border-blue-500 bg-blue-50 shadow-sm"
                  : "border-gray-200 bg-common-white hover:border-gray-300 hover:bg-gray-50",
              )}
            >
              <Icon className={cn("mt-0.5 h-4 w-4 flex-shrink-0", active ? "text-blue-600" : "text-gray-500")} />
              <div className="min-w-0 flex-1">
                <div className={cn("text-sm font-semibold", active ? "text-blue-700" : "text-gray-800")}>
                  {p.name}
                </div>
                <div className="mt-0.5 text-xs leading-relaxed text-gray-600">{p.description}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
