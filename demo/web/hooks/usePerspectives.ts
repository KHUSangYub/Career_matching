"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function usePerspectives() {
  return useQuery({
    queryKey: ["perspectives"],
    queryFn: api.listPerspectives,
    staleTime: Infinity,
  });
}
