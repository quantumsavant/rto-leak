/**
 * Pure decision logic for the NumberField editing state machine.
 * Framework-free so it can be unit-tested without a DOM.
 *
 * Rules:
 * - A cancelled edit (Escape) never commits — even if a stale blur handler
 *   runs after the draft was already discarded.
 * - Empty, whitespace-only, or non-numeric input reverts to the old value.
 * - Numeric input is clamped to [min, max] before commit.
 */
export type DraftResolution = { commit: number } | { commit: null };

export function resolveDraft(opts: {
  /** Current draft text; null means the field is not being edited. */
  draft: string | null;
  /** True when Escape was pressed during the current edit session. */
  cancelled: boolean;
  min: number;
  max: number;
}): DraftResolution {
  const { draft, cancelled, min, max } = opts;
  if (draft === null || cancelled) return { commit: null };
  const n = Number(draft);
  if (draft.trim() === "" || !Number.isFinite(n)) return { commit: null };
  return { commit: Math.min(max, Math.max(min, n)) };
}
