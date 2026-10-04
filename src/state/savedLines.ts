export const SAVED_LINES_KEY = "palang-ic:saved-lines";
export const MAX_SAVED = 10;

/** The only thing this app ever persists. Scans never come near it. */
export function loadLines(): string[] {
  try {
    const raw = localStorage.getItem(SAVED_LINES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

function save(lines: string[]): string[] {
  try {
    localStorage.setItem(SAVED_LINES_KEY, JSON.stringify(lines));
  } catch {
    // Suggestions are a convenience. Losing them must never break an export.
  }
  return lines;
}

export function rememberLine(line: string): string[] {
  const trimmed = line.trim();
  const lines = loadLines();
  if (!trimmed) return lines;
  const rest = lines.filter((v) => v.toLowerCase() !== trimmed.toLowerCase());
  return save([trimmed, ...rest].slice(0, MAX_SAVED));
}

export function forgetLine(line: string): string[] {
  const target = line.trim().toLowerCase();
  return save(loadLines().filter((v) => v.toLowerCase() !== target));
}
