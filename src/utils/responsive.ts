import type { BreakpointName, Breakpoints, ResponsiveObject, ResponsiveValue } from '../types';

export const DEFAULT_BREAKPOINTS: Breakpoints = { sm: 360, md: 600, lg: 900, xl: 1200 };

/** Breakpoint names sorted by ascending min width, starting with `base`. */
export function orderBreakpoints(breakpoints: Breakpoints): string[] {
  return [
    'base',
    ...Object.keys(breakpoints)
      .filter((name) => name !== 'base')
      .sort((a, b) => (breakpoints[a] ?? 0) - (breakpoints[b] ?? 0)),
  ];
}

/** The largest breakpoint whose min width is <= `width`, or `base`. */
export function getBreakpoint(
  width: number,
  breakpoints: Breakpoints = DEFAULT_BREAKPOINTS,
): BreakpointName {
  let current: BreakpointName = 'base';
  let currentMin = -Infinity;
  for (const [name, min] of Object.entries(breakpoints)) {
    if (width >= min && min > currentMin) {
      current = name;
      currentMin = min;
    }
  }
  return current;
}

export function isResponsiveObject<T>(value: ResponsiveValue<T>): value is ResponsiveObject<T> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Resolves a responsive value for `breakpoint`, mobile-first: the value for
 * `breakpoint` if defined, otherwise the nearest smaller breakpoint's, down to
 * `base`. Plain values are returned unchanged. Returns `undefined` when
 * nothing at or below `breakpoint` is defined.
 */
export function resolveResponsive<T>(
  value: ResponsiveValue<T>,
  breakpoint: BreakpointName,
  breakpoints: Breakpoints = DEFAULT_BREAKPOINTS,
): T | undefined {
  if (!isResponsiveObject(value)) return value;
  const order = orderBreakpoints(breakpoints);
  const start = order.indexOf(breakpoint);
  for (let i = start === -1 ? 0 : start; i >= 0; i--) {
    const resolved = value[order[i] as string];
    if (resolved !== undefined) return resolved;
  }
  return undefined;
}
