import { Factory, ShoppingBag, HeartPulse, GraduationCap, Building2, Newspaper, AudioLines, PanelsTopLeft, Truck, HandHeart, type LucideIcon } from "lucide-react";
import type { Industry } from "@/data/case-studies";

const icons: Record<string, LucideIcon> = {
  manufacturing: Factory, "retail-ecommerce": ShoppingBag, healthcare: HeartPulse,
  education: GraduationCap, "hospitality-real-estate": Building2,
  "media-publishing": Newspaper, "music-entertainment": AudioLines,
  "technology-saas": PanelsTopLeft, logistics: Truck, "non-profits": HandHeart,
};

export function IndustryArtwork({ industry }: { industry: Industry }) {
  const Icon = icons[industry.slug] ?? PanelsTopLeft;
  return <div aria-hidden="true" className="relative isolate grid aspect-[4/3] place-items-center overflow-hidden rounded-2xl border border-white/10 bg-[#111417]">
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,#C21E5625,transparent_65%)]" />
    <div className="absolute inset-0 bg-[linear-gradient(#ffffff04_1px,transparent_1px),linear-gradient(90deg,#ffffff04_1px,transparent_1px)] bg-size-[32px_32px] [mask-image:radial-gradient(ellipse,black,transparent_80%)]" />
    <div className="absolute size-[70%] rotate-[-25deg] rounded-[45%] border border-[#e87bb9]/20 [transform:rotateX(35deg)_rotateZ(-25deg)]" />
    <div className="absolute size-[58%] rotate-[25deg] rounded-[45%] border border-[#e87bb9]/20" />
    <div className="absolute top-[20%] right-[8%] h-[20%] w-[26%] rotate-12 rounded-lg border border-accent/25 bg-[#b95c9320] p-3 shadow-[0_0_25px_#C21E5612]">
      <div className="mb-2 h-px w-1/2 bg-accent/50" /><div className="h-1 w-3/4 rounded bg-white/10" /><div className="mt-2 h-1 w-1/2 rounded bg-white/10" />
    </div>
    <div className="absolute bottom-[16%] left-[7%] h-[22%] w-[28%] -rotate-12 rounded-lg border border-accent/25 bg-[#b95c9320] p-3">
      <div className="flex h-full items-end gap-2">{[40, 70, 55, 90].map((height) => <div key={height} className="w-1/4 rounded-t border-t border-accent/60 bg-accent/15" style={{ height: `${height}%` }} />)}</div>
    </div>
    <div className="relative grid size-[43%] place-items-center rounded-[24%] border border-[#f2a2d0]/30 bg-linear-to-br from-[#3b2d3e] to-[#17171d] shadow-[0_25px_40px_#0008,0_0_60px_#C21E5618] [transform:perspective(700px)_rotateY(-18deg)_rotateX(10deg)]">
      <Icon className="size-[58%] text-[#f0b3d4] drop-shadow-[0_0_10px_#C21E5699]" strokeWidth={1.1} />
    </div>
    <span className="absolute right-5 bottom-4 left-5 text-[8px] uppercase tracking-[.22em] text-[#c49db6]/60">Industry exploration / {industry.name}</span>
  </div>;
}
