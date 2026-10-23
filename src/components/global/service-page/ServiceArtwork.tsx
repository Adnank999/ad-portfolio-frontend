import { useId } from "react";
import type { ServiceArtworkKind } from "./servicePage.types";

const labels: Record<ServiceArtworkKind, string[]> = {
  web: ["Interface", "Experience", "API", "Content", "Delivery"],
  software: ["Product", "Platform", "API", "Logic", "Release"],
  cloud: ["Source", "Cloud", "Data", "Secure", "Deploy"],
  data: ["Sources", "Insight", "Model", "Quality", "Action"],
  automation: ["Trigger", "Workflow", "Agent", "Review", "Output"],
  systems: ["People", "Systems", "Data", "Process", "Connect"],
  growth: ["Discover", "Measure", "Content", "Intent", "Growth"],
};

export function ServiceArtwork({ kind, className = "" }: { kind: ServiceArtworkKind; className?: string }) {
  const id = useId().replace(/:/g, "");
  const names = labels[kind];
  const nodes = [[105, 195], [380, 110], [655, 195], [245, 335], [515, 335]];

  return (
    <div aria-hidden="true" className={`relative isolate overflow-hidden rounded-2xl border border-white/5 bg-[#131315] ${className}`}>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,#C21E5622,transparent_65%)]" />
      <svg viewBox="0 0 760 450" fill="none" className="relative h-full w-full" focusable="false">
        <defs>
          <linearGradient id={`${id}-panel`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#383139" /><stop offset="1" stopColor="#18181c" /></linearGradient>
          <linearGradient id={`${id}-line`} x1="0" y1="0" x2="1" y2="0"><stop stopColor="#70234f" /><stop offset=".5" stopColor="#ff87cc" /><stop offset="1" stopColor="#70234f" /></linearGradient>
          <radialGradient id={`${id}-glow`}><stop stopColor="#ff34ac" stopOpacity=".5" /><stop offset="1" stopColor="#ff34ac" stopOpacity="0" /></radialGradient>
          <pattern id={`${id}-grid`} width="40" height="24" patternUnits="userSpaceOnUse"><path d="M40 0H0V24" stroke="#fff" strokeOpacity=".035" /></pattern>
        </defs>
        <path d="M0 0H760V450H0Z" fill={`url(#${id}-grid)`} />
        <ellipse cx="380" cy="250" rx="265" ry="150" fill={`url(#${id}-glow)`} />
        <g stroke={`url(#${id}-line)`} strokeWidth="2">
          <path d="M105 195 380 110 655 195 515 335 245 335 105 195ZM380 110V240M105 195 380 240 655 195M245 335 380 240 515 335" />
        </g>
        {nodes.map(([x, y], index) => (
          <g key={names[index]} transform={`translate(${x} ${y})`}>
            <path d="m-68 0 68-38L68 0v30L0 68-68 30Z" fill="#17171b" stroke="#54404e" />
            <path d="m-68 0 68-38L68 0 0 38Z" fill={`url(#${id}-panel)`} stroke={index === 1 ? "#fb74c2" : "#65505f"} />
            <path d="M0 38V68M-48 13l48 26 48-26" stroke="#C21E56" strokeOpacity=".7" />
            <text x="0" y="5" fill="#e9c4da" fontFamily="Inter, sans-serif" fontSize="12" textAnchor="middle">{names[index]}</text>
            <circle cy="53" r="3" fill="#ff67c1" />
          </g>
        ))}
        <g transform="translate(380 240)">
          <path d="m-45 0 45-26L45 0 0 26Z" fill="#8d285f" stroke="#ffa0d6" strokeWidth="2" />
          {kind === "cloud" ? <path d="M-18 3c-10-8 0-17 8-13C-4-25 15-18 15-8 30-8 27 6 16 6H-15" fill="#ffc0e4" /> : kind === "data" || kind === "growth" ? <path d="M-20 8v-10M-7 5v-22M7 4v-30M21-1v-38" stroke="#ffe0f2" strokeWidth="5" /> : <path d="m-18-8-12 8 12 8M18-8l12 8-12 8M5-15-5 15" stroke="#ffe0f2" strokeWidth="3" />}
        </g>
      </svg>
    </div>
  );
}
