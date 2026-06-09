"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Perspective } from "@/lib/types";

export function useMatch(userId: string | null, perspective: Perspective, topK: number) {
  return useQuery({
    queryKey: ["match", userId, perspective, topK],
    queryFn: () => {
      if (!userId) throw new Error("userId required");
      return api.match({ userId, perspective, topK });
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 30,
  });
}
