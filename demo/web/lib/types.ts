// FastAPI 백엔드 schemas.py와 동기화된 타입.

export type Perspective = "A" | "B" | "C" | "D" | "E";

export interface UserSummary {
  userId: string;
  jobs: string[];
  industries: string[];
  abilityKeywords: string[];
  starPreview: string;
}

export interface UserListResponse {
  users: UserSummary[];
  total: number;
}

export interface PerspectiveWeights {
  role: number;
  industry: number;
  skill: number;
  star: number;
  comp: number;
}

export interface PerspectiveInfo {
  id: Perspective;
  name: string;
  description: string;
  weights: PerspectiveWeights;
}

export interface PerspectiveListResponse {
  perspectives: PerspectiveInfo[];
}

export interface ComponentScores {
  role_match: number;
  hard_skill: number;
  industry_match: number;
  star_overlap: number;
  competency: number;
}

export interface MatchItem {
  rank: number;
  jobId: number;
  company: string;
  title: string;
  role: string;
  industry: string;
  score: number;
  label: number; // 0~4
  components: ComponentScores;
  summary: string | null;
  duties: string | null;
  ideal: string | null;
  requiredSkills: string[];
}

export interface ModelInfo {
  backbone: string;
  head: string;
  perspective: Perspective;
  userPool: number;
  jdPool: number;
}

export interface MatchResponse {
  userId: string;
  perspective: Perspective;
  results: MatchItem[];
  modelInfo: ModelInfo;
}

export interface MatchRequest {
  userId: string;
  perspective: Perspective;
  topK: number;
}

export interface HealthResponse {
  status: string;
  modelLoaded: boolean;
  device: string;
}
