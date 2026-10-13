import { useLayoutConfig } from '../context/LayoutProvider';
import type { ResponsiveValue } from '../types';
import { resolveResponsive } from '../utils/responsive';
import { useBreakpoint } from './useBreakpoint';

/** Resolves a responsive value against the current breakpoint. */
export function useResponsiveValue<T>(value: ResponsiveValue<T>): T | undefined {
  const breakpoint = useBreakpoint();
  const { breakpoints } = useLayoutConfig();
  return resolveResponsive(value, breakpoint, breakpoints);
}
