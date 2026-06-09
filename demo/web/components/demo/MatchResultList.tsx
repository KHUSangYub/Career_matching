"use client";

import { useMatch } from "@/hooks/useMatch";
import type { Perspective } from "@/lib/types";
import { Loader2, AlertCircle } from "lucide-react";
import { MatchCard } from "./MatchCard";

interface Props {
  userId: string | null;
  perspective: Perspective;
  topK: number;
}

export function MatchResultList({ userId, perspective, topK }: Props) {
  const { data, isLoading, error, isFetching } = useMatch(userId, perspective, topK);

  if (!userId) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
        <div className="text-sm text-gray-600">왼쪽에서 사용자를 선택하세요.</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-lg bg-gray-100" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
          <div>
            <div className="font-semibold text-red-700">매칭 실패</div>
            <div className="mt-1 text-sm text-red-600">{(error as Error).message}</div>
            <div className="mt-2 text-xs text-red-500">
              백엔드가 켜져 있는지 확인하세요 (uvicorn main:app --port 8000).
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-gray-700">
          Top-{data.results.length} 결과 · 관점 <span className="font-bold text-blue-600">{data.perspective}</span>
        </div>
        {isFetching && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Loader2 className="h-3 w-3 animate-spin" />
            업데이트 중...
          </div>
        )}
      </div>
      {data.results.map((it) => (
        <MatchCard key={`${it.jobId}-${it.rank}`} item={it} initiallyExpanded={it.rank <= 2} />
      ))}
    </div>
  );
}
