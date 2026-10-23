import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";

type ContentsItem = { id: string; title: string };

export function ArticleToc({ items, articleId }: { items: ContentsItem[]; articleId: string }) {
  const [reading, setReading] = useState({ active: items[0]?.id ?? "", progress: 0 });

  useEffect(() => {
    const article = document.getElementById(articleId);
    if (!article) return;
    const targets = items.map((entry) => ({ id: entry.id, element: document.getElementById(entry.id) }));
    let frame: number | null = null;

    const update = () => {
      frame = null;
      let active = items[0]?.id ?? "";
      for (const target of targets) {
        if (target.element && target.element.getBoundingClientRect().top <= 180) active = target.id;
      }
      const bounds = article.getBoundingClientRect();
      const distance = Math.max(1, bounds.height - window.innerHeight + 128);
      const progress = Math.max(0, Math.min(100, Math.round(((128 - bounds.top) / distance) * 100)));
      setReading((previous) => previous.active === active && previous.progress === progress ? previous : { active, progress });
    };

    const schedule = () => {
      if (frame === null) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    const observer = new ResizeObserver(schedule);
    observer.observe(article);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      observer.disconnect();
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, [items, articleId]);

  const activeIndex = items.findIndex((entry) => entry.id === reading.active);
  const links = (
    <ol className="space-y-1">
      {items.map((entry, index) => (
        <li key={entry.id}>
          <a href={`#${entry.id}`} aria-current={entry.id === reading.active ? "location" : undefined} className="group flex min-h-11 items-start gap-3 rounded-md py-3 pr-2 text-[11px] leading-[1.65] text-[#aaa2ac] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent aria-[current=location]:text-white">
            <span aria-hidden="true" className={`grid size-6 shrink-0 place-items-center rounded-full border text-[9px] ${index < activeIndex ? "border-accent bg-accent text-white" : index === activeIndex ? "border-accent text-accent" : "border-white/15 text-[#aaa2ac]"}`}><span className="accent-text">{String(index + 1).padStart(2, "0")}</span></span>
            <span>{entry.title}</span>
          </a>
        </li>
      ))}
    </ol>
  );

  return (
    <aside className="min-w-0 self-start lg:sticky lg:top-32">
      <details className="rounded-xl border border-white/10 bg-[#1b1b1b] p-5 lg:hidden">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 text-xs uppercase tracking-[.12em] [&::-webkit-details-marker]:hidden">In this article<ChevronDown size={15} aria-hidden="true" /></summary>
        <nav aria-label="Article contents" className="mt-3">{links}</nav>
      </details>
      <div className="hidden lg:block">
        <p className="mb-5 text-[10px] uppercase tracking-[.18em] text-[#aaa2ac]">In this article</p>
        <nav aria-label="Article contents" className="max-h-[calc(100dvh-16rem)] overflow-y-auto pr-2 [scrollbar-width:thin]">{links}</nav>
        <div className="mt-6 border-t border-white/10 pt-5">
          <label htmlFor="article-reading-progress" className="flex justify-between gap-4 text-[9px] uppercase tracking-widest text-[#aaa2ac]">Reading progress<span aria-hidden="true">{reading.progress}%</span></label>
          <progress id="article-reading-progress" value={reading.progress} max={100} className="mt-3 h-1 w-full overflow-hidden rounded-full accent-accent [&::-webkit-progress-bar]:bg-white/10 [&::-webkit-progress-value]:bg-accent [&::-moz-progress-bar]:bg-accent">{reading.progress}%</progress>
        </div>
      </div>
    </aside>
  );
}
