import type { RowSlot } from '../types';
import { packRows } from '../utils/chunk';
import { defaultKeyExtractor, layoutRow } from '../utils/layoutRow';

const describeSlots = (slots: RowSlot<unknown>[]) =>
  slots.map((s) => (s.type === 'cell' ? `cell:${s.key}` : `pad:${s.span}`));

const lastRowOf = (count: number, cols: number) => {
  const rows = packRows(Array.from({ length: count }, (_, i) => i), cols);
  return rows[rows.length - 1]!;
};

describe('layoutRow', () => {
  const row = lastRowOf(18, 4); // 2 items in the last row

  it('align: pads the end so items keep column width', () => {
    expect(describeSlots(layoutRow(row, 4, true, 'align', defaultKeyExtractor))).toEqual([
      'cell:16',
      'cell:17',
      'pad:2',
    ]);
  });

  it('stretch: no placeholders', () => {
    expect(describeSlots(layoutRow(row, 4, true, 'stretch', defaultKeyExtractor))).toEqual([
      'cell:16',
      'cell:17',
    ]);
  });

  it('center: splits padding on both sides', () => {
    expect(describeSlots(layoutRow(row, 4, true, 'center', defaultKeyExtractor))).toEqual([
      'pad:1',
      'cell:16',
      'cell:17',
      'pad:1',
    ]);
  });

  it('center: uses half-column placeholders for an odd remainder', () => {
    const odd = lastRowOf(9, 4); // 1 item, 3 columns free
    expect(describeSlots(layoutRow(odd, 4, true, 'center', defaultKeyExtractor))).toEqual([
      'pad:1.5',
      'cell:8',
      'pad:1.5',
    ]);
  });

  it('end: pads the start', () => {
    expect(describeSlots(layoutRow(row, 4, true, 'end', defaultKeyExtractor))).toEqual([
      'pad:2',
      'cell:16',
      'cell:17',
    ]);
  });

  it('adds nothing to a full row', () => {
    const full = packRows([0, 1, 2, 3], 4)[0]!;
    for (const mode of ['align', 'stretch', 'center', 'end'] as const) {
      expect(layoutRow(full, 4, true, mode, defaultKeyExtractor)).toHaveLength(4);
    }
  });

  it('always pads incomplete rows that are not last, whatever lastRow says', () => {
    const spans = [3, 2];
    const rows = packRows([0, 1], 4, (i) => spans[i]!);
    expect(describeSlots(layoutRow(rows[0]!, 4, false, 'stretch', defaultKeyExtractor))).toEqual([
      'cell:0',
      'pad:1',
    ]);
  });

  it('renders offsets as leading placeholders', () => {
    const rows = packRows(['a', 'b'], 4, undefined, (_, i) => (i === 1 ? 1 : 0));
    const slots = layoutRow(rows[0]!, 4, true, 'align', (item) => item);
    expect(describeSlots(slots)).toEqual(['cell:a', 'pad:1', 'cell:b', 'pad:1']);
  });

  it('pads a single row when cols exceeds data length', () => {
    const only = packRows([0, 1], 5)[0]!;
    expect(describeSlots(layoutRow(only, 5, true, 'align', defaultKeyExtractor))).toEqual([
      'cell:0',
      'cell:1',
      'pad:3',
    ]);
  });
});

describe('defaultKeyExtractor', () => {
  it('prefers key, then id, then index', () => {
    expect(defaultKeyExtractor({ key: 'k', id: 'i' }, 3)).toBe('k');
    expect(defaultKeyExtractor({ id: 7 }, 3)).toBe('7');
    expect(defaultKeyExtractor({ name: 'x' }, 3)).toBe('3');
    expect(defaultKeyExtractor('plain', 4)).toBe('4');
  });
});
