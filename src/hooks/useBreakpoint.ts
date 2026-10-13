import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import { useLayoutConfig } from '../context/LayoutProvider';
import type { BreakpointName } from '../types';
import { getBreakpoint } from '../utils/responsive';

/** Name of the breakpoint matching the current window width (`base` below the smallest). */
export function useBreakpoint(): BreakpointName {
  const { width } = useWindowDimensions();
  const { breakpoints } = useLayoutConfig();
  return useMemo(() => getBreakpoint(width, breakpoints), [width, breakpoints]);
}
