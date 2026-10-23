import { useState } from "react";
import { Check, Link as LinkIcon } from "lucide-react";

export function ArticleShare() {
  const [copied, setCopied] = useState(false);
  const [fallbackUrl, setFallbackUrl] = useState("");

  const copyLink = async () => {
    const url = `${window.location.origin}${window.location.pathname}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setFallbackUrl("");
    } catch {
      setFallbackUrl(url);
      setCopied(false);
    }
  };

  return (
    <div>
      <button type="button" onClick={copyLink} className="inline-flex min-h-11 items-center gap-3 rounded-full border border-white/15 px-5 py-3 text-[11px] text-[#eee5ed] hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent">
        <span className="accent-text">{copied ? <Check size={15} aria-hidden="true" /> : <LinkIcon size={15} aria-hidden="true" />}</span><span className="accent-text">{copied ? "Link copied" : "Copy article link"}</span>
      </button>
      <span role="status" className="sr-only">{copied ? "Article link copied to clipboard." : fallbackUrl ? "Copy the article link from the field below." : ""}</span>
      {fallbackUrl && <label className="mt-4 block text-xs text-[#b0a8b1]">Article link<input readOnly value={fallbackUrl} onFocus={(event) => event.currentTarget.select()} className="mt-2 min-h-11 w-full rounded-lg border border-white/20 bg-[#1b1b1b] p-3 text-xs text-white" /></label>}
    </div>
  );
}
