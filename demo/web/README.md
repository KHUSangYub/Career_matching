# 캡스톤 V2 매칭 데모 — Next.js Frontend

Next.js 15 (App Router) + Tailwind v4 + TypeScript 5 + TanStack Query 5 + Recharts.
careermizing-web의 디자인 시스템(`colors.css`, `typography.css`, Pretendard 폰트)을 그대로 차용.

## 1. 사전 준비

- Node.js 20+
- 백엔드 (`demo/api`)가 `:8000`에서 띄워져 있어야 함

## 2. 설치

```bash
cd demo/web
npm install
```

## 3. shadcn UI 컴포넌트 (선택 — 현재 코드는 직접 작성된 컴포넌트만 사용)

만약 추가 shadcn 컴포넌트가 필요하면:

```bash
npx shadcn@latest add button card select badge progress separator accordion radio-group label tooltip
```

> `components.json`이 이미 careermizing과 동일 설정으로 작성됨.

## 4. 실행

```bash
npm run dev
```

→ `http://localhost:3000` 자동 열림.

`next.config.ts`의 rewrites가 `/api/*` 호출을 `http://localhost:8000/*`으로 프록시.

## 5. 파일 구조

```
web/
├── app/
│   ├── layout.tsx         # Root layout + Providers (TanStack Query)
│   ├── page.tsx           # 메인 페이지 (단일 SPA)
│   ├── globals.css        # @import tailwindcss + colors + typography + Pretendard
│   ├── colors.css         # careermizing 복사
│   ├── typography.css     # careermizing 복사
│   └── PretendardVariable.woff2
├── components/
│   ├── providers.tsx      # QueryClientProvider
│   └── demo/
│       ├── UserSelector.tsx
│       ├── PerspectiveSelector.tsx
│       ├── UserProfileCard.tsx
│       ├── MatchResultList.tsx
│       ├── MatchCard.tsx
│       ├── ComponentScoreChart.tsx   # Recharts BarChart
│       └── SystemInfoBadge.tsx
├── lib/
│   ├── api.ts             # typed fetch (api.health, api.listUsers, api.match)
│   ├── types.ts           # 백엔드 schemas.py와 동기화
│   └── utils.ts           # cn() (clsx + twMerge)
├── hooks/
│   ├── useUsers.ts        # GET /users (1시간 캐시)
│   ├── usePerspectives.ts # GET /perspectives (영구 캐시)
│   └── useMatch.ts        # POST /match (30분 캐시)
├── next.config.ts         # /api/* → :8000/*
├── components.json        # shadcn (new-york, neutral)
├── postcss.config.mjs
├── tsconfig.json
└── package.json
```

## 6. 디자인 시스템

`careermizing-web`의 디자인 토큰을 그대로 사용. 핵심 클래스 예시:

| 용도 | 클래스 |
| --- | --- |
| 주요 액션 | `bg-blue-500 text-common-white` |
| 보조 강조 | `bg-sky-blue-500` |
| 직무 뱃지 | `bg-blue-50 text-blue-700 border-blue-200` |
| 산업 뱃지 | `bg-sky-blue-50 text-sky-blue-700 border-sky-blue-200` |
| 본문 | `font-pretendard text-base text-gray-800` |
| 카드 | `rounded-lg border border-gray-200 bg-common-white p-6 shadow-sm` |

## 7. 빌드

```bash
npm run build
npm start
```

## 8. 주의

- `app/PretendardVariable.woff2` 폰트 파일은 git에 *포함*하기보다는 careermizing 또는 npm `pretendard` 패키지에서 가져오는 것을 권장 (현 데모는 단순화 위해 로컬 복사 사용).
- 백엔드가 띄워져 있지 않으면 `useUsers`가 에러 → 콘솔에 fetch 에러 표시. `demo/api/README.md` 참조.
