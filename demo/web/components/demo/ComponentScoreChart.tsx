"use client";

import { Bar, BarChart, Cell, ResponsiveContainer, XAxis, YAxis } from "recharts";
import type { ComponentScores } from "@/lib/types";

const COMP_LABEL_KO: Record<keyof ComponentScores, string> = {
  role_match: "직무",
  hard_skill: "스킬",
  industry_match: "산업",
  star_overlap: "자소서",
  competency: "역량",
};

const COLORS = ["#1f7fff", "#11b0ff", "#0d5df1", "#69cdff", "#3cbeff"]; // blue/sky-blue palette

interface Props {
  components: ComponentScores;
}

export function ComponentScoreChart({ components }: Props) {
  const data = (Object.keys(COMP_LABEL_KO) as (keyof ComponentScores)[]).map((k, i) => ({
    name: COMP_LABEL_KO[k],
    value: Number(components[k].toFixed(2)),
    color: COLORS[i],
  }));

  return (
    <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
      <div className="mb-1 text-xs font-semibold text-gray-700">5컴포넌트 점수 (rule baseline)</div>
      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#5f6870" }} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 1]} hide />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.map((d) => (
              <Cell key={d.name} fill={d.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-1 grid grid-cols-5 gap-1 text-[10px] text-gray-600">
        {data.map((d) => (
          <div key={d.name} className="text-center font-mono">
            {d.value.toFixed(2)}
          </div>
        ))}
      </div>
    </div>
  );
}
