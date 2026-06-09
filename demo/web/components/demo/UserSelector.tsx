"use client";

import { useMemo, useState } from "react";
import { Search, User } from "lucide-react";
import { useUsers } from "@/hooks/useUsers";
import { cn } from "@/lib/utils";

interface Props {
  value: string | null;
  onChange: (uid: string) => void;
}

export function UserSelector({ value, onChange }: Props) {
  const { data, isLoading } = useUsers();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    if (!q) return data.users.slice(0, 50);
    return data.users
      .filter(
        (u) =>
          u.userId.toLowerCase().includes(q) ||
          u.jobs.some((j) => j.includes(q)) ||
          u.industries.some((i) => i.includes(q)),
      )
      .slice(0, 50);
  }, [data, query]);

  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="h-9 w-full animate-pulse rounded-md bg-gray-100" />
        <div className="h-32 w-full animate-pulse rounded-md bg-gray-50" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-gray-800">
        1. 사용자 선택 <span className="text-gray-500">({data?.total ?? 0}명)</span>
      </label>
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ID / 직무 / 산업 검색"
          className="h-9 w-full rounded-md border border-gray-300 bg-common-white px-3 pl-8 text-sm placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
      <div className="max-h-[420px] overflow-y-auto rounded-md border border-gray-200 bg-common-white">
        {filtered.length === 0 ? (
          <div className="px-3 py-6 text-center text-sm text-gray-500">검색 결과 없음</div>
        ) : (
          filtered.map((u) => {
            const active = u.userId === value;
            return (
              <button
                key={u.userId}
                type="button"
                onClick={() => onChange(u.userId)}
                className={cn(
                  "flex w-full items-start gap-2 border-b border-gray-100 px-3 py-2 text-left text-sm transition-colors last:border-b-0",
                  active ? "bg-blue-50 text-blue-700" : "hover:bg-gray-50",
                )}
              >
                <User className={cn("mt-0.5 h-3.5 w-3.5 flex-shrink-0", active ? "text-blue-600" : "text-gray-500")} />
                <div className="min-w-0 flex-1">
                  <div className={cn("font-semibold", active ? "text-blue-700" : "text-gray-800")}>{u.userId}</div>
                  <div className="truncate text-xs text-gray-600">
                    {u.jobs.join(", ") || "(직무 미지정)"} · {u.industries.join(", ") || "(산업 미지정)"}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
