import type {
  HealthResponse,
  MatchRequest,
  MatchResponse,
  PerspectiveListResponse,
  UserListResponse,
} from "./types";

export interface MatchCustomRequest {
  text: string;
  jobs: string[];
  industries: string[];
  abilityKeywords: string[];
  perspective: "A" | "B" | "C" | "D" | "E";
  topK: number;
}

// next.config.ts rewrites가 /api/* → http://localhost:8000/* 로 매핑.
const BASE = "/api";

async function getJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}: ${await res.text()}`);
  return res.json();
}

async function postJSON<TBody, TRes>(path: string, body: TBody): Promise<TRes> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`POST ${path} → ${res.status}: ${await res.text()}`);
  return res.json();
}

export const api = {
  health: () => getJSON<HealthResponse>("/healthz"),
  listUsers: () => getJSON<UserListResponse>("/users"),
  listPerspectives: () => getJSON<PerspectiveListResponse>("/perspectives"),
  match: (req: MatchRequest) => postJSON<MatchRequest, MatchResponse>("/match", req),
  matchCustom: (req: MatchCustomRequest) =>
    postJSON<MatchCustomRequest, MatchResponse>("/match-custom", req),
};
