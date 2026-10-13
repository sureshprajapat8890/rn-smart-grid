import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { Breakpoints, GapStrategy } from '../types';
import { DEFAULT_BREAKPOINTS } from '../utils/responsive';

export interface LayoutConfig {
  /** Breakpoint name → min window width. Default `{ sm: 360, md: 600, lg: 900, xl: 1200 }`. */
  breakpoints: Breakpoints;
  /** Base spacing unit used when `useScale` is on. Default 4. */
  spacing: number;
  /** Treat numeric gap / padding / spacer values as multiples of `spacing`. Default false. */
  useScale: boolean;
  /**
   * How gaps are rendered. `gap` (default) uses native gap style props,
   * `margin` emulates them for React Native < 0.71.
   */
  gapStrategy: GapStrategy;
}

export const DEFAULT_LAYOUT_CONFIG: LayoutConfig = {
  breakpoints: DEFAULT_BREAKPOINTS,
  spacing: 4,
  useScale: false,
  gapStrategy: 'gap',
};

const LayoutContext = createContext<LayoutConfig>(DEFAULT_LAYOUT_CONFIG);
LayoutContext.displayName = 'LayoutContext';

export interface LayoutProviderProps extends Partial<LayoutConfig> {
  children?: ReactNode;
}

/**
 * Configures breakpoints and spacing for every layout component below it.
 * Unset props inherit from the nearest parent provider (or the defaults).
 */
export function LayoutProvider({
  breakpoints,
  spacing,
  useScale,
  gapStrategy,
  children,
}: LayoutProviderProps) {
  const parent = useContext(LayoutContext);
  const value = useMemo<LayoutConfig>(
    () => ({
      breakpoints: breakpoints ?? parent.breakpoints,
      spacing: spacing ?? parent.spacing,
      useScale: useScale ?? parent.useScale,
      gapStrategy: gapStrategy ?? parent.gapStrategy,
    }),
    [parent, breakpoints, spacing, useScale, gapStrategy],
  );
  return <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>;
}

/** The active layout configuration. */
export function useLayoutConfig(): LayoutConfig {
  return useContext(LayoutContext);
}
