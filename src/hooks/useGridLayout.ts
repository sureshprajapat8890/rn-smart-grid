import { useMemo } from 'react';
import { useLayoutConfig } from '../context/LayoutProvider';
import type { ResponsiveValue } from '../types';
import { resolveGaps, type GapInput } from '../utils/gaps';
import { normalizeCols } from '../utils/normalize';
import { resolveResponsive } from '../utils/responsive';
import { useBreakpoint } from './useBreakpoint';
import { useSpace } from './useSpace';

export interface GridLayout {
  cols: number;
  rowGap: number;
  columnGap: number;
  /** True when gaps must be emulated with margins. */
  useMargins: boolean;
}

/** Shared by `SmartGrid` and `Grid`: resolves responsive cols, validates them and scales gaps. */
export function useGridLayout(cols: ResponsiveValue<number>, gaps: GapInput): GridLayout {
  const breakpoint = useBreakpoint();
  const { breakpoints, gapStrategy } = useLayoutConfig();
  const space = useSpace();
  const rawCols = resolveResponsive(cols, breakpoint, breakpoints);
  const resolvedCols = useMemo(() => normalizeCols(rawCols), [rawCols]);
  const { rowGap, columnGap } = resolveGaps(gaps, space);
  return { cols: resolvedCols, rowGap, columnGap, useMargins: gapStrategy === 'margin' };
}
