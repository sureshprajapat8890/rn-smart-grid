import { memo, useMemo, type ReactElement, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';
import type { CellAlign, CellStyle, LastRowMode, PackedCell, PackedRow } from '../types';
import { layoutRow, type CellKeyGetter } from '../utils/layoutRow';
import {
  alignItemsStyle,
  aspectRatioStyle,
  baseStyles,
  columnGapStyle,
  spanStyle,
} from '../utils/styles';

export type RenderCell<T> = (cell: PackedCell<T>, rowIndex: number) => ReactNode;
export type GetCellProps<T> = (cell: PackedCell<T>) => ViewProps | undefined;

export interface GridRowProps<T> {
  row: PackedRow<T>;
  cols: number;
  isLast: boolean;
  lastRow: LastRowMode;
  columnGap: number;
  useMargins: boolean;
  align: CellAlign;
  /** Row spacing applied by the parent (margin fallback). */
  spacingStyle?: ViewStyle;
  rowStyle?: StyleProp<ViewStyle>;
  cellStyle?: CellStyle;
  aspectRatio?: number;
  getKey: CellKeyGetter<T>;
  renderCell: RenderCell<T>;
  getCellProps?: GetCellProps<T>;
  testID?: string;
}

const styles = StyleSheet.create({
  placeholder: { pointerEvents: 'none' },
  content: { flexGrow: 1 },
  stretch: { alignSelf: 'stretch' },
});

function sameCell<T>(a: PackedCell<T>, b: PackedCell<T>): boolean {
  return (
    a === b ||
    (a.item === b.item &&
      a.index === b.index &&
      a.span === b.span &&
      a.offset === b.offset &&
      a.col === b.col)
  );
}

/** Rows are rebuilt on every re-pack; compare contents so unchanged rows skip rendering. */
function sameRow<T>(a: PackedRow<T>, b: PackedRow<T>): boolean {
  if (a === b) return true;
  if (a.index !== b.index || a.used !== b.used || a.cells.length !== b.cells.length) return false;
  return a.cells.every((cell, i) => sameCell(cell, b.cells[i] as PackedCell<T>));
}

function equalExcept<P extends object>(prev: P, next: P, skip: keyof P): boolean {
  for (const key of Object.keys(next) as (keyof P)[]) {
    if (key !== skip && prev[key] !== next[key]) return false;
  }
  return Object.keys(prev).length === Object.keys(next).length;
}

const Placeholder = memo(function Placeholder({
  layoutStyle,
  testID,
}: {
  layoutStyle: ViewStyle;
  testID?: string;
}) {
  return (
    <View
      style={[layoutStyle, styles.placeholder]}
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      aria-hidden
      testID={testID}
    />
  );
});

interface GridCellProps<T> {
  cell: PackedCell<T>;
  rowIndex: number;
  layoutStyle: ViewStyle;
  aspectRatio?: number;
  /** Stretch to the row height (spanned cell next to aspect-ratio cells). */
  stretch?: boolean;
  cellStyle?: CellStyle;
  renderCell: RenderCell<T>;
  getCellProps?: GetCellProps<T>;
  testID?: string;
}

function GridCellImpl<T>({
  cell,
  rowIndex,
  layoutStyle,
  aspectRatio,
  stretch,
  cellStyle,
  renderCell,
  getCellProps,
  testID,
}: GridCellProps<T>) {
  const userStyle =
    typeof cellStyle === 'function'
      ? cellStyle({ index: cell.index, row: rowIndex, col: cell.col })
      : cellStyle;
  const extra = getCellProps?.(cell);
  const content = renderCell(cell, rowIndex);
  const sizing = aspectRatio
    ? [layoutStyle, aspectRatioStyle(aspectRatio)]
    : stretch
      ? [layoutStyle, styles.stretch]
      : layoutStyle;

  if (userStyle == null && extra == null) {
    return (
      <View testID={testID} style={sizing}>
        {content}
      </View>
    );
  }
  // User styles go on an inner view. Yoga never lets a flex basis drop below
  // an item's padding + border, so padding on the sizing view would add a
  // hidden basis and break column alignment between rows.
  return (
    <View testID={testID} style={sizing}>
      <View {...extra} style={[styles.content, userStyle, extra?.style]}>
        {content}
      </View>
    </View>
  );
}

const GridCell = memo(
  GridCellImpl,
  (prev, next) => sameCell(prev.cell, next.cell) && equalExcept(prev, next, 'cell'),
) as <T>(props: GridCellProps<T>) => ReactElement;

function GridRowImpl<T>({
  row,
  cols,
  isLast,
  lastRow,
  columnGap,
  useMargins,
  align,
  spacingStyle,
  rowStyle,
  cellStyle,
  aspectRatio,
  getKey,
  renderCell,
  getCellProps,
  testID,
}: GridRowProps<T>) {
  const slots = useMemo(
    () => layoutRow(row, cols, isLast, lastRow, getKey),
    [row, cols, isLast, lastRow, getKey],
  );
  const containerStyle = useMemo(
    () => [
      baseStyles.row,
      alignItemsStyle(align),
      useMargins ? undefined : columnGapStyle(columnGap),
      spacingStyle,
      rowStyle,
    ],
    [align, useMargins, columnGap, spacingStyle, rowStyle],
  );

  // `aspectRatio` describes one column. Wider cells stretch to the row height
  // set by the span-1 cells; a row of only wide cells approximates it with
  // `aspectRatio * span` (ignoring the gaps a cell covers).
  const hasSingle = row.cells.some((cell) => cell.span === 1);
  const cellAspect = (span: number) =>
    !aspectRatio || span === 1 ? aspectRatio : hasSingle ? undefined : aspectRatio * span;

  return (
    <View style={containerStyle} testID={testID ? `${testID}-row-${row.index}` : undefined}>
      {slots.map((slot, i) => {
        const leadingMargin = useMargins && i > 0 ? columnGap : 0;
        if (slot.type === 'placeholder') {
          return (
            <Placeholder
              key={slot.key}
              layoutStyle={spanStyle(
                slot.span,
                columnGap,
                leadingMargin,
                slot.side === 'leading' ? 'start' : 'end',
              )}
              testID={testID ? `${testID}-placeholder-${row.index}-${slot.key}` : undefined}
            />
          );
        }
        return (
          <GridCell
            key={slot.key}
            cell={slot.cell}
            rowIndex={row.index}
            layoutStyle={spanStyle(slot.cell.span, columnGap, leadingMargin)}
            aspectRatio={cellAspect(slot.cell.span)}
            stretch={!!aspectRatio && slot.cell.span > 1 && hasSingle}
            cellStyle={cellStyle}
            renderCell={renderCell}
            getCellProps={getCellProps}
            testID={testID ? `${testID}-cell-${slot.cell.index}` : undefined}
          />
        );
      })}
    </View>
  );
}

/** One horizontal row of grid cells and placeholders. Internal; shared by `SmartGrid` and `Grid`. */
export const GridRow = memo(
  GridRowImpl,
  (prev, next) => sameRow(prev.row, next.row) && equalExcept(prev, next, 'row'),
) as <T>(props: GridRowProps<T>) => ReactElement;
