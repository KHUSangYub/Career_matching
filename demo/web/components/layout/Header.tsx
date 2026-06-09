"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Sparkles, Beaker } from "lucide-react";
import { cn } from "@/lib/utils";
// import { SystemInfoBadge } from "@/components/demo/SystemInfoBadge"; // TODO: 추후 복원

const NAV = [
  { label: "홈", href: "/", icon: Home },
  { label: "사용자 매칭", href: "/user-demo", icon: Sparkles },
  { label: "자소서 테스트", href: "/test", icon: Beaker },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-common-white/80 backdrop-blur supports-[backdrop-filter]:bg-common-white/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* 로고 — CareerMatching 워드마크 */}
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-xl font-extrabold tracking-tight transition-opacity hover:opacity-80"
        >
          <span className="text-gray-950">Career</span>
          <span className="bg-gradient-to-r from-blue-600 to-sky-blue-500 bg-clip-text text-transparent">
            Matching
          </span>
          <span className="ml-0.5 h-1.5 w-1.5 rounded-full bg-blue-500" />
        </Link>

        {/* 중앙 nav */}
        <nav className="flex items-center gap-1">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-950",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* 우측 시스템 정보 */}
        {/* TODO: 추후 복원 — V2 NDCG 뱃지
        <div className="hidden md:block">
          <SystemInfoBadge />
        </div>
        */}
      </div>
    </header>
  );
}
