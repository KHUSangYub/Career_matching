"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, User } from "lucide-react";
import type { UserSummary } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  user: UserSummary;
}

export function UserProfileCard({ user }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border border-gray-200 bg-common-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
          <User className="h-5 w-5" />
        </div>
        <div>
          <div className="text-xs font-medium text-gray-500">선택된 사용자</div>
          <div className="text-xl font-bold text-gray-950">{user.userId}</div>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <Field label="관심 직무">
          {user.jobs.length === 0 ? (
            <span className="text-sm text-gray-500">(없음)</span>
          ) : (
            user.jobs.map((j) => (
              <span
                key={j}
                className="rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700"
              >
                {j}
              </span>
            ))
          )}
        </Field>
        <Field label="관심 산업">
          {user.industries.length === 0 ? (
            <span className="text-sm text-gray-500">(없음)</span>
          ) : (
            user.industries.map((i) => (
              <span
                key={i}
                className="rounded-md border border-sky-blue-200 bg-sky-blue-50 px-2 py-0.5 text-xs font-medium text-sky-blue-700"
              >
                {i}
              </span>
            ))
          )}
        </Field>
        <Field label={`역량 키워드 (${user.abilityKeywords.length})`}>
          {user.abilityKeywords.length === 0 ? (
            <span className="text-sm text-gray-500">(없음)</span>
          ) : (
            user.abilityKeywords.slice(0, 10).map((k) => (
              <span key={k} className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                {k}
              </span>
            ))
          )}
        </Field>
      </div>

      {user.starPreview && (
        <div className="mt-4 border-t border-gray-100 pt-4">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-gray-950"
          >
            {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            자기소개서 일부 보기
          </button>
          <div
            className={cn(
              "overflow-hidden transition-all",
              open ? "mt-2 max-h-96 opacity-100" : "max-h-0 opacity-0",
            )}
          >
            <div className="rounded-md bg-gray-50 p-3 text-sm leading-relaxed text-gray-700">
              {user.starPreview}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 text-xs font-medium text-gray-500">{label}</div>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}
