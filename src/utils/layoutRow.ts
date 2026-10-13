import type { LastRowMode, PackedRow, RowSlot } from '../types';

export type CellKeyGetter<T> = (item: T, index: number) => string;

/**
 * Turns a packed row into the children to render: real cells plus invisible
 * placeholders that keep column widths identical across rows.
 *
 * - An offset becomes a leading placeholder in front of its cell.
 * - Rows other than the last are always padded at the end, so a row that
 *   wrapped early because the next item's span did not fit never stretches.
 * - The last row follows `lastRow`:
 *   - `align`: pad at the end (items keep column width, aligned to start)
 *   - `stretch`: no padding, items share the full width
 *   - `center`: pad equally on both sides (half-column placeholders if odd)
 *   - `end`: pad at the start
 */
export function layoutRow<T>(
  row: PackedRow<T>,
  cols: number,
  isLastRow: boolean,
  lastRow: LastRowMode,
  getKey: CellKeyGetter<T>,
): RowSlot<T>[] {
  const slots: RowSlot<T>[] = [];
  for (const cell of row.cells) {
    if (cell.offset > 0) {
      slots.push({ type: 'placeholder', key: `offset-${cell.index}`, span: cell.offset, side: 'leading' });
    }
    slots.push({ type: 'cell', key: getKey(cell.item, cell.index), cell });
  }

  const remaining = cols - row.used;
  if (remaining <= 0) return slots;

  const mode: LastRowMode = isLastRow ? lastRow : 'align';
  switch (mode) {
    case 'stretch':
      return slots;
    case 'end':
      return [{ type: 'placeholder', key: 'pad-start', span: remaining, side: 'leading' }, ...slots];
    case 'center': {
      const half = remaining / 2;
      return [
        { type: 'placeholder', key: 'pad-start', span: half, side: 'leading' },
        ...slots,
        { type: 'placeholder', key: 'pad-end', span: half, side: 'trailing' },
      ];
    }
    case 'align':
    default:
      return [...slots, { type: 'placeholder', key: 'pad-end', span: remaining, side: 'trailing' }];
  }
}

/** Default cell key: `item.key`, then `item.id`, then the index. */
export function defaultKeyExtractor(item: unknown, index: number): string {
  if (item !== null && typeof item === 'object') {
    const record = item as { key?: unknown; id?: unknown };
    if (typeof record.key === 'string' || typeof record.key === 'number') return String(record.key);
    if (typeof record.id === 'string' || typeof record.id === 'number') return String(record.id);
  }
  return String(index);
}
