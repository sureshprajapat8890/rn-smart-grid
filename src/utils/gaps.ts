export interface GapInput {
  gap?: number;
  rowGap?: number;
  columnGap?: number;
}

export interface ResolvedGaps {
  rowGap: number;
  columnGap: number;
}

/** Resolves `gap` / `rowGap` / `columnGap` (the specific prop wins) and scales them. */
export function resolveGaps(input: GapInput, scale: (value: number) => number): ResolvedGaps {
  return {
    rowGap: scale(input.rowGap ?? input.gap ?? 0),
    columnGap: scale(input.columnGap ?? input.gap ?? 0),
  };
}
