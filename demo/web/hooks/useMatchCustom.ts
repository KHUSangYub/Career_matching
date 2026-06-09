"use client";

import { useMutation } from "@tanstack/react-query";
import { api, type MatchCustomRequest } from "@/lib/api";

export function useMatchCustom() {
  return useMutation({
    mutationFn: (req: MatchCustomRequest) => api.matchCustom(req),
  });
}
