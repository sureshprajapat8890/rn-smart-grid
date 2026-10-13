import {
  Children,
  forwardRef,
  isValidElement,
  useMemo,
  type ReactElement,
  type ReactNode,
} from 'react';
import { View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';
import { useGridLayout } from '../hooks/useGridLayout';
import type { ViewRef } from '../types';
import type { CellAlign, LastRowMode, PackedCell, ResponsiveValue } from '../types';
import { packRows } from '../utils/chunk';
import { marginTopStyle, rowGapStyle } from '../utils/styles';
import { GridItem, type GridItemProps } from './GridItem';
import { GridRow } from './GridRow';

export interface GridProps extends ViewProps {
  /** Column count, or a responsive object such as `{ base: 2, md: 3 }`. */
  cols: ResponsiveValue<number>;
  gap?: number;
  rowGap?: number;
  columnGap?: number;
  /** Vertical alignment of cells within a row. Default `stretch`. */
  align?: CellAlign;
  /** Layout of an incomplete last row. Default `align`. */
  lastRow?: LastRowMode;
  rowStyle?: StyleProp<ViewStyle>;
  /** `aspectRatio` applied to every cell. */
  itemAspectRatio?: number;
  children?: ReactNode;
}

interface Entry {
  key: string;
  span?: number;
  offset?: number;
  content: ReactNode;
  cellProps?: ViewProps;
}

function toEntries(children: ReactNode): Entry[] {
  return Children.toArray(children)
    .filter(isValidElement)
    .map((child, i) => {
      const key = child.key != null ? String(child.key) : String(i);
      if (child.type === GridItem) {
        const { span, offset, children: content, ...cellProps } = (
          child as ReactElement<GridItemProps>
        ).props;
        const hasCellProps = Object.keys(cellProps).length > 0;
        return { key, span, offset, content, cellProps: hasCellProps ? cellProps : undefined };
      }
      return { key, content: child };
    });
}

const entrySpan = (entry: Entry) => entry.span ?? 1;
const entryOffset = (entry: Entry) => entry.offset ?? 0;
const entryKey = (entry: Entry) => entry.key;
const renderEntry = (cell: PackedCell<Entry>) => cell.item.content;
const entryCellProps = (cell: PackedCell<Entry>) => cell.item.cellProps;

/**
 * Declarative grid for hand-written children. Children are packed into rows
 * by `GridItem` span and offset, with the same algorithm and last-row
 * placeholders as `SmartGrid`. Children that are not `GridItem`s span 1.
 */
export const Grid = forwardRef<ViewRef, GridProps>(function Grid(
  {
    cols,
    gap,
    rowGap: rowGapProp,
    columnGap: columnGapProp,
    align = 'stretch',
    lastRow = 'align',
    rowStyle,
    itemAspectRatio,
    style,
    testID,
    children,
    ...rest
  },
  ref,
) {
  const { cols: resolvedCols, rowGap, columnGap, useMargins } = useGridLayout(cols, {
    gap,
    rowGap: rowGapProp,
    columnGap: columnGapProp,
  });

  const entries = useMemo(() => toEntries(children), [children]);
  const rows = useMemo(
    () => packRows(entries, resolvedCols, entrySpan, entryOffset),
    [entries, resolvedCols],
  );
  const containerStyle = useMemo(
    () => [useMargins ? undefined : rowGapStyle(rowGap), style],
    [useMargins, rowGap, style],
  );

  return (
    <View ref={ref} {...rest} style={containerStyle} testID={testID}>
      {rows.map((row) => (
        <GridRow<Entry>
          key={`row-${row.index}`}
          row={row}
          cols={resolvedCols}
          isLast={row.index === rows.length - 1}
          lastRow={lastRow}
          columnGap={columnGap}
          useMargins={useMargins}
          align={align}
          spacingStyle={useMargins && row.index > 0 ? marginTopStyle(rowGap) : undefined}
          rowStyle={rowStyle}
          aspectRatio={itemAspectRatio}
          getKey={entryKey}
          renderCell={renderEntry}
          getCellProps={entryCellProps}
          testID={testID}
        />
      ))}
    </View>
  );
});
