"use client";

import { useState } from "react";
import { Info, Sparkles } from "lucide-react";

export function SystemInfoBadge() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100"
      >
        <Sparkles className="h-3.5 w-3.5" />
        V2 · NDCG 0.939 (독립) / 0.998 (순환)
        <Info className="h-3.5 w-3.5 opacity-70" />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-20 mt-2 w-80 rounded-lg border border-gray-200 bg-common-white p-4 text-sm shadow-lg">
          <div className="mb-2 text-sm font-bold text-gray-950">V2 모델 (exp-023)</div>
          <ul className="space-y-1.5 text-xs leading-relaxed text-gray-700">
            <li>
              <span className="font-semibold">백본:</span> Qwen3-Embedding-0.6B (MPS)
            </li>
            <li>
              <span className="font-semibold">학습 head:</span> MLP-128 (관점별 분기 5개)
            </li>
            <li>
              <span className="font-semibold">학습 데이터:</span> 800명 × 22후보 × 5관점 = 88k pair
            </li>
            <li>
              <span className="font-semibold">평가 (held-out 199):</span> NDCG@10 = 0.9984
            </li>
            <li>
              <span className="font-semibold">평가 (API로 만든 독립 라벨 120쌍):</span>{" "}
              <span className="text-blue-700 font-bold">NDCG@10 = 0.9390 (V1 +0.019p)</span>
            </li>
          </ul>
          <div className="mt-3 border-t border-gray-100 pt-2 text-[11px] text-gray-500">
            차별성 ① 자소서 정성 첫 정량 입증 — V1(rule fusion) 대비 독립 라벨에서 처음 우위
          </div>
        </div>
      )}
    </div>
  );
}
