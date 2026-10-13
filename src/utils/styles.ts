import { StyleSheet, type ViewStyle } from 'react-native';
import type { CellAlign, FlexAlign, FlexJustify } from '../types';

export const alignMap: Record<FlexAlign, ViewStyle['alignItems']> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  stretch: 'stretch',
  baseline: 'baseline',
};

export const justifyMap: Record<FlexJustify, ViewStyle['justifyContent']> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  between: 'space-between',
  around: 'space-around',
  evenly: 'space-evenly',
};

export const cellAlignMap: Record<CellAlign, ViewStyle['alignItems']> = alignMap;

// Grid styles depend on a handful of numbers (span, gap) that repeat across
// every cell, so they are built once and shared instead of per render.
const cache = new Map<string, ViewStyle>();

function cached(key: string, build: () => ViewStyle): ViewStyle {
  let style = cache.get(key);
  if (!style) {
    style = StyleSheet.create({ s: build() }).s;
    cache.set(key, style);
  }
  return style;
}

/**
 * Flex style for a cell or placeholder spanning `span` columns in a row whose
 * children are separated by `gap`.
 *
 * `flexGrow: span` alone would make a span-2 cell exactly twice a span-1 cell,
 * ignoring the gap it swallows, and rows with different child counts would
 * have different free space. Using `(span - 1) * gap` as the basis makes every
 * full row distribute the same free space, `width - (cols - 1) * gap`, so a
 * span-N cell is N columns plus the N - 1 gaps between them and columns line
 * up across rows. A fractional span below 1 (a half-column centering
 * placeholder) would need a negative basis, so that deficit becomes a negative
 * margin on the row's outer edge instead.
 *
 * `leadingMargin` is the margin-based gap fallback; it is 0 with native gaps.
 */
export function spanStyle(
  span: number,
  gap: number,
  leadingMargin = 0,
  outerSide: 'start' | 'end' = 'end',
): ViewStyle {
  return cached(`span:${span}:${gap}:${leadingMargin}:${outerSide}`, () => {
    const basis = (span - 1) * gap;
    const style: { -readonly [K in keyof ViewStyle]: ViewStyle[K] } = {
      flexGrow: span,
      flexShrink: 1,
      flexBasis: Math.max(0, basis),
      minWidth: 0,
    };
    let marginStart = leadingMargin;
    let marginEnd = 0;
    if (basis < 0) {
      if (outerSide === 'start') marginStart += basis;
      else marginEnd += basis;
    }
    if (marginStart !== 0) style.marginStart = marginStart;
    if (marginEnd !== 0) style.marginEnd = marginEnd;
    return style;
  });
}

/** `marginTop` used between rows in margin-fallback mode. */
export function marginTopStyle(value: number): ViewStyle {
  return cached(`mt:${value}`, () => ({ marginTop: value }));
}

export function aspectRatioStyle(ratio: number): ViewStyle {
  return cached(`ar:${ratio}`, () => ({ aspectRatio: ratio }));
}

export function rowGapStyle(rowGap: number): ViewStyle {
  return cached(`rg:${rowGap}`, () => ({ rowGap }));
}

export function columnGapStyle(columnGap: number): ViewStyle {
  return cached(`cg:${columnGap}`, () => ({ columnGap }));
}

export function heightStyle(height: number): ViewStyle {
  return cached(`h:${height}`, () => ({ height }));
}

export function alignItemsStyle(align: CellAlign): ViewStyle {
  return cached(`ai:${align}`, () => ({ alignItems: cellAlignMap[align] }));
}

export const baseStyles = StyleSheet.create({
  row: { flexDirection: 'row' },
  column: { flexDirection: 'column' },
  fill: { flex: 1 },
});
