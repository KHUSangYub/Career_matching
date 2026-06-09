"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: api.listUsers,
    staleTime: 1000 * 60 * 60, // 1시간
  });
}
