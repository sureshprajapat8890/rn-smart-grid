import { chunk, packRows } from '../utils/chunk';

const range = (n: number) => Array.from({ length: n }, (_, i) => i);

describe('chunk', () => {
  it('splits 18 items into rows of 4, 4, 4, 4, 2', () => {
    expect(chunk(range(18), 4).map((r) => r.length)).toEqual([4, 4, 4, 4, 2]);
  });

  it('keeps order and content', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it('returns an empty array for empty data', () => {
    expect(chunk([], 3)).toEqual([]);
  });

  it('returns a single chunk when size exceeds length', () => {
    expect(chunk([1, 2], 10)).toEqual([[1, 2]]);
  });

  it.each([0, -2, NaN, Infinity])('treats invalid size %p as 1', (size) => {
    expect(chunk([1, 2, 3], size)).toEqual([[1], [2], [3]]);
  });

  it('floors fractional sizes', () => {
    expect(chunk([1, 2, 3, 4, 5], 2.9)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it('accepts readonly input without mutating it', () => {
    const data = Object.freeze([1, 2, 3]);
    expect(chunk(data, 2)).toEqual([[1, 2], [3]]);
  });
});

describe('packRows', () => {
  it('matches chunk without span or offset getters', () => {
    const rows = packRows(range(7), 3);
    expect(rows.map((r) => r.cells.map((c) => c.item))).toEqual([[0, 1, 2], [3, 4, 5], [6]]);
    expect(rows.map((r) => r.used)).toEqual([3, 3, 1]);
    expect(rows[2]!.cells[0]).toEqual({ item: 6, index: 6, span: 1, offset: 0, col: 0 });
    expect(rows.map((r) => r.index)).toEqual([0, 1, 2]);
  });

  it('packs by total span per row', () => {
    const spans = [2, 1, 1, 3, 1, 2];
    const rows = packRows(range(spans.length), 4, (i) => spans[i]!);
    expect(rows.map((r) => r.cells.map((c) => c.item))).toEqual([[0, 1, 2], [3, 4], [5]]);
    expect(rows.map((r) => r.used)).toEqual([4, 4, 2]);
    expect(rows[0]!.cells.map((c) => c.col)).toEqual([0, 2, 3]);
  });

  it('wraps an item whose span does not fit the rest of the row', () => {
    const spans = [3, 2, 1];
    const rows = packRows(range(3), 4, (i) => spans[i]!);
    expect(rows.map((r) => r.cells.map((c) => c.item))).toEqual([[0], [1, 2]]);
    expect(rows[0]!.used).toBe(3);
  });

  it('clamps spans greater than cols', () => {
    const rows = packRows(['a', 'b'], 3, () => 10);
    expect(rows.map((r) => r.cells.map((c) => c.span))).toEqual([[3], [3]]);
  });

  it('treats invalid spans as 1', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const rows = packRows(['a', 'b'], 2, () => NaN);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.cells.map((c) => c.span)).toEqual([1, 1]);
    warn.mockRestore();
  });

  it('applies offsets as consumed columns', () => {
    const rows = packRows(['a', 'b', 'c'], 4, undefined, (_, i) => (i === 1 ? 2 : 0));
    expect(rows[0]!.cells.map((c) => [c.item, c.col, c.offset])).toEqual([
      ['a', 0, 0],
      ['b', 3, 2],
    ]);
    expect(rows[1]!.cells.map((c) => c.item)).toEqual(['c']);
  });

  it('moves an item to a new row when offset + span overflow, keeping its offset', () => {
    const rows = packRows(['a', 'b'], 3, undefined, (_, i) => (i === 1 ? 2 : 0));
    expect(rows).toHaveLength(2);
    expect(rows[1]!.cells[0]).toMatchObject({ item: 'b', offset: 2, col: 2 });
  });

  it('clamps offsets so the item still fits in a row', () => {
    const rows = packRows(['a'], 3, () => 2, () => 5);
    expect(rows[0]!.cells[0]).toMatchObject({ span: 2, offset: 1, col: 1 });
  });
});
