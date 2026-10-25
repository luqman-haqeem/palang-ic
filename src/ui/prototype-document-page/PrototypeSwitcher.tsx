// PROTOTYPE — throwaway. Lives on branch prototype/document-page only; never merge.
import { useEffect } from "react";

type Props = {
  variants: { key: string; name: string }[];
  current: string;
  onChange: (key: string) => void;
};

export function readVariant(fallback: string): string {
  return new URLSearchParams(window.location.search).get("variant") ?? fallback;
}

export function PrototypeSwitcher({ variants, current, onChange }: Props) {
  const index = Math.max(0, variants.findIndex((v) => v.key === current));

  function go(step: number) {
    const next = variants[(index + step + variants.length) % variants.length].key;
    const url = new URL(window.location.href);
    url.searchParams.set("variant", next);
    window.history.replaceState(null, "", url);
    onChange(next);
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, [contenteditable]")) return;
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!import.meta.env.DEV) return null;
  const v = variants[index];
  return (
    <div className="fixed bottom-4 left-1/2 z-[100] flex -translate-x-1/2 items-center gap-3 rounded-full bg-fuchsia-600 px-4 py-2 text-sm font-medium text-white shadow-lg">
      <button type="button" onClick={() => go(-1)} aria-label="Previous variant">
        ◀
      </button>
      <span>
        {v.key} ({v.name})
      </span>
      <button type="button" onClick={() => go(1)} aria-label="Next variant">
        ▶
      </button>
    </div>
  );
}
