import { devWarn } from './env';

/**
 * Coerces a column count to a positive integer. `NaN`, non-numbers, infinite
 * values and values below 1 become 1; fractional values are floored (and
 * still clamped to at least 1). Warns in development.
 */
export function normalizeCols(cols: unknown): number {
  if (typeof cols !== 'number' || !Number.isFinite(cols) || cols < 1) {
    devWarn(`Invalid \`cols\` value ${String(cols)}; falling back to 1.`);
    return 1;
  }
  if (!Number.isInteger(cols)) {
    const floored = Math.floor(cols);
    devWarn(`\`cols\` must be an integer, got ${cols}; using ${floored}.`);
    return floored;
  }
  return cols;
}

/** Coerces a span to an integer in [1, cols]. Spans above `cols` are clamped silently. */
export function normalizeSpan(span: unknown, cols: number): number {
  if (span === undefined || span === null) return 1;
  if (typeof span !== 'number' || !Number.isFinite(span) || span < 1) {
    devWarn(`Invalid span ${String(span)}; using 1.`);
    return 1;
  }
  return Math.min(Math.floor(span), cols);
}

/** Coerces an offset to an integer in [0, maxOffset]. */
export function normalizeOffset(offset: unknown, maxOffset: number): number {
  if (offset === undefined || offset === null) return 0;
  if (typeof offset !== 'number' || !Number.isFinite(offset) || offset < 0) {
    devWarn(`Invalid offset ${String(offset)}; using 0.`);
    return 0;
  }
  return Math.min(Math.floor(offset), maxOffset);
}
