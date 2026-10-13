import type { ComponentRef, ComponentType, ReactElement, ReactNode } from 'react';
import type { StyleProp, View, ViewStyle } from 'react-native';

/** Breakpoint name → minimum window width (dp) at which it becomes active. */
export type Breakpoints = Record<string, number>;

/** Name of a breakpoint. `base` is always active below the smallest breakpoint. */
export type BreakpointName = 'base' | (string & {});

/**
 * A value that varies by breakpoint, mobile-first:
 * `{ base: 2, sm: 3, md: 4, lg: 6 }`. A missing key inherits from the nearest
 * smaller breakpoint that defines a value.
 */
export type ResponsiveObject<T> = { base?: T } & { [breakpoint: string]: T | undefined };

export type ResponsiveValue<T> = T | ResponsiveObject<T>;

/** How an incomplete last row is laid out. */
export type LastRowMode = 'align' | 'stretch' | 'center' | 'end';

/** Vertical alignment of cells inside a grid row. */
export type CellAlign = 'start' | 'center' | 'end' | 'stretch';

/** Friendly `alignItems` values. */
export type FlexAlign = 'start' | 'center' | 'end' | 'stretch' | 'baseline';

/** Friendly `justifyContent` values. */
export type FlexJustify = 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';

/**
 * How gaps are rendered. `gap` uses the native `gap` / `rowGap` / `columnGap`
 * style props (RN >= 0.71). `margin` emulates them with margins for older
 * runtimes.
 */
export type GapStrategy = 'gap' | 'margin';

/** One cell produced by the packing algorithm. */
export interface PackedCell<T> {
  item: T;
  /** Index of the item in the source data. */
  index: number;
  /** Number of columns the cell occupies (1..cols). */
  span: number;
  /** Empty columns rendered before the cell (0..cols - span). */
  offset: number;
  /** Zero-based column where the cell starts (after its offset). */
  col: number;
}

/** One row produced by the packing algorithm. */
export interface PackedRow<T> {
  /** Zero-based row index. */
  index: number;
  cells: PackedCell<T>[];
  /** Total columns consumed by the row's cells and their offsets. */
  used: number;
}

/** A child of a laid-out row: a real cell or an invisible placeholder. */
export type RowSlot<T> =
  | { type: 'cell'; key: string; cell: PackedCell<T> }
  | {
      type: 'placeholder';
      key: string;
      /** Width in columns. Can be fractional (e.g. 0.5) when centering. */
      span: number;
      /** Which side of the row's content the placeholder sits on. */
      side: 'leading' | 'trailing';
    };

export interface CellInfo {
  index: number;
  row: number;
  col: number;
}

export interface RenderItemInfo<T> extends CellInfo {
  item: T;
}

export type RenderItem<T> = (info: RenderItemInfo<T>) => ReactNode;

export type CellStyle = StyleProp<ViewStyle> | ((info: CellInfo) => StyleProp<ViewStyle>);

/** A FlatList-style slot: a component type or an element. */
export type ListSlot = ComponentType<any> | ReactElement;

/** Instance type of a React Native `View` (what `ref` receives). */
export type ViewRef = ComponentRef<typeof View>;
