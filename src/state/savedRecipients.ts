export const SAVED_RECIPIENTS_KEY = "palang-ic:saved-recipients";
export const MAX_SAVED = 10;

export type SuggestionField = "recipient" | "purpose";
export type SavedStore = { recipient: string[]; purpose: string[] };

const empty = (): SavedStore => ({ recipient: [], purpose: [] });

export function loadSaved(): SavedStore {
  try {
    const raw = localStorage.getItem(SAVED_RECIPIENTS_KEY);
    if (!raw) return empty();
    const parsed = JSON.parse(raw) as Partial<SavedStore>;
    return {
      recipient: Array.isArray(parsed.recipient) ? parsed.recipient : [],
      purpose: Array.isArray(parsed.purpose) ? parsed.purpose : [],
    };
  } catch {
    return empty();
  }
}

function save(store: SavedStore): SavedStore {
  try {
    localStorage.setItem(SAVED_RECIPIENTS_KEY, JSON.stringify(store));
  } catch {
    // Suggestions are a convenience. Losing them must never break an export.
  }
  return store;
}

export function remember(field: SuggestionField, value: string): SavedStore {
  const trimmed = value.trim();
  const store = loadSaved();
  if (!trimmed) return store;
  const rest = store[field].filter((v) => v.toLowerCase() !== trimmed.toLowerCase());
  return save({ ...store, [field]: [trimmed, ...rest].slice(0, MAX_SAVED) });
}

export function forget(field: SuggestionField, value: string): SavedStore {
  const store = loadSaved();
  const next = store[field].filter((v) => v.toLowerCase() !== value.trim().toLowerCase());
  return save({ ...store, [field]: next });
}
