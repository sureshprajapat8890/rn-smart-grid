import type { PackedCell, PackedRow } from '../types';
import { normalizeOffset, normalizeSpan } from './normalize';

/**
 * Splits `data` into consecutive chunks of `size` items. The last chunk holds
 * the remainder. Sizes below 1 (or not finite) are treated as 1; fractional
 * sizes are floored.
 *
 * @example chunk([1, 2, 3, 4, 5], 2) // [[1, 2], [3, 4], [5]]
 */
export function chunk<T>(data: readonly T[], size: number): T[][] {
  const step = Number.isFinite(size) && size >= 1 ? Math.floor(size) : 1;
  const out: T[][] = [];
  for (let i = 0; i < data.length; i += step) {
    out.push(data.slice(i, i + step));
  }
  return out;
}

export type SpanGetter<T> = (item: T, index: number) => number;
export type OffsetGetter<T> = (item: T, index: number) => number;

/**
 * Packs items into rows of `cols` columns, keeping their order. Each item
 * takes `offset + span` columns. When that does not fit in what is left of the
 * current row, the item starts a new row (its offset applies in the new row).
 * Spans above `cols` are clamped to `cols`, and offsets to `cols - span`.
 *
 * Without `getSpan` / `getOffset` this is `chunk(data, cols)`.
 */
export function packRows<T>(
  data: readonly T[],
  cols: number,
  getSpan?: SpanGetter<T>,
  getOffset?: OffsetGetter<T>,
): PackedRow<T>[] {
  if (!getSpan && !getOffset) {
    return chunk(data, cols).map((items, rowIndex) => {
      const start = rowIndex * cols;
      return {
        index: rowIndex,
        used: items.length,
        cells: items.map((item, i) => ({ item, index: start + i, span: 1, offset: 0, col: i })),
      };
    });
  }

  const rows: PackedRow<T>[] = [];
  let cells: PackedCell<T>[] = [];
  let used = 0;

  const flush = () => {
    rows.push({ index: rows.length, cells, used });
    cells = [];
    used = 0;
  };

  data.forEach((item, index) => {
    const span = normalizeSpan(getSpan?.(item, index), cols);
    const offset = normalizeOffset(getOffset?.(item, index), cols - span);
    if (cells.length > 0 && used + offset + span > cols) flush();
    cells.push({ item, index, span, offset, col: used + offset });
    used += offset + span;
    if (used === cols) flush();
  });
  if (cells.length > 0) flush();

  return rows;
}
