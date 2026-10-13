import { useCallback } from 'react';
import { useLayoutConfig } from '../context/LayoutProvider';

/**
 * Returns a function converting a spacing value to pixels: a multiple of the
 * provider's `spacing` when `useScale` is on, the raw value otherwise.
 */
export function useSpace(): (value: number) => number {
  const { spacing, useScale } = useLayoutConfig();
  return useCallback((value: number) => (useScale ? value * spacing : value), [spacing, useScale]);
}
