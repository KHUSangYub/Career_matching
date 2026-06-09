"use client";

import { useEffect, useState } from "react";
import { UserSelector } from "@/components/demo/UserSelector";
import { PerspectiveSelector } from "@/components/demo/PerspectiveSelector";
import { UserProfileCard } from "@/components/demo/UserProfileCard";
import { MatchResultList } from "@/components/demo/MatchResultList";
import { useUsers } from "@/hooks/useUsers";
import type { Perspective } from "@/lib/types";

export default function UserDemoPage() {
  const { data: usersData } = useUsers();
  const [userId, setUserId] = useState<string | null>(null);
  const [perspective, setPerspective] = useState<Perspective>("E");
  const [topK, setTopK] = useState(10);

  useEffect(() => {
    if (userId || !usersData?.users.length) return;
    const preferred = usersData.users.find((u) => u.userId === "P0247");
    setUserId((preferred ?? usersData.users[0]).userId);
  }, [usersData, userId]);

  const selectedUser = usersData?.users.find((u) => u.userId === userId);

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-950">사용자 매칭</h1>
        <p className="mt-1 text-sm text-gray-600">
          학습 데이터 999명 user 중 한 명 선택 → V2 모델이 3,000 JD 중 Top-K 매칭
        </p>
      </div>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-[320px_1fr]">
        <aside className="space-y-6">
          <UserSelector value={userId} onChange={setUserId} />
          <PerspectiveSelector value={perspective} onChange={setPerspective} />
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-800">
              3. Top-K · <span className="font-mono text-blue-600">{topK}</span>
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
            <div className="flex justify-between text-[11px] text-gray-500">
              <span>5</span>
              <span>30</span>
            </div>
          </div>
        </aside>

        <section className="space-y-6">
          {selectedUser && <UserProfileCard user={selectedUser} />}
          <MatchResultList userId={userId} perspective={perspective} topK={topK} />
        </section>
      </div>
    </main>
  );
}
