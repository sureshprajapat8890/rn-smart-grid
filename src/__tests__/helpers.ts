import { StyleSheet, type ViewStyle } from 'react-native';

interface HostLike {
  props: { style?: unknown; testID?: string };
  children: (HostLike | string)[];
}

export const flat = (node: { props: { style?: unknown } }): ViewStyle =>
  (StyleSheet.flatten(node.props.style as ViewStyle) ?? {}) as ViewStyle;

export const hostChildren = (node: HostLike): HostLike[] =>
  node.children.filter((c): c is HostLike => typeof c !== 'string');

/**
 * Minimal single-line flexbox model (no wrapping, shrink unused): enough to
 * check that grid cells land on the same column boundaries in every row.
 * Returns [start, end] per child along the main axis.
 */
export function simulateRow(row: HostLike, width: number): [number, number][] {
  const containerGap = Number(flat(row).columnGap ?? 0);
  const kids = hostChildren(row).map(flat);
  const n = kids.length;
  const num = (v: unknown) => (typeof v === 'number' ? v : 0);
  // Yoga clamps a flex basis to at least the item's horizontal padding + border.
  const floor = (k: ViewStyle) =>
    num(k.paddingStart ?? k.paddingLeft ?? k.paddingHorizontal ?? k.padding) +
    num(k.paddingEnd ?? k.paddingRight ?? k.paddingHorizontal ?? k.padding) +
    2 * num(k.borderWidth);
  for (const k of kids) {
    (k as { flexBasis?: number }).flexBasis = Math.max(num(k.flexBasis), floor(k));
  }
  const totalBasis = kids.reduce((s, k) => s + num(k.flexBasis), 0);
  const totalMargins = kids.reduce((s, k) => s + num(k.marginStart) + num(k.marginEnd), 0);
  const totalGrow = kids.reduce((s, k) => s + num(k.flexGrow), 0);
  const free = width - totalBasis - totalMargins - containerGap * (n - 1);
  let x = 0;
  return kids.map((k) => {
    x += num(k.marginStart);
    const w = num(k.flexBasis) + (totalGrow ? (num(k.flexGrow) / totalGrow) * free : 0);
    const box: [number, number] = [x, x + w];
    x += w + num(k.marginEnd) + containerGap;
    return box;
  });
}

/** Column boundaries for a grid of `cols` columns. */
export function columnEdges(width: number, cols: number, gap: number): [number, number][] {
  const unit = (width - gap * (cols - 1)) / cols;
  return Array.from({ length: cols }, (_, i) => [i * (unit + gap), i * (unit + gap) + unit]);
}

export const round = (boxes: [number, number][]) =>
  boxes.map(([a, b]) => [Math.round(a * 1000) / 1000, Math.round(b * 1000) / 1000]);
