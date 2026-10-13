import {
  createElement,
  isValidElement,
  useCallback,
  useMemo,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react';
import {
  FlatList,
  Platform,
  View,
  type FlatListProps,
  type ListRenderItemInfo,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useGridLayout } from '../hooks/useGridLayout';
import type {
  CellAlign,
  CellStyle,
  LastRowMode,
  ListSlot,
  PackedCell,
  PackedRow,
  RenderItem,
  ResponsiveValue,
} from '../types';
import { packRows, type SpanGetter } from '../utils/chunk';
import { defaultKeyExtractor } from '../utils/layoutRow';
import { heightStyle, marginTopStyle, rowGapStyle } from '../utils/styles';
import { GridRow } from './GridRow';

type RowListProps<T> = FlatListProps<PackedRow<T>>;

export interface SmartGridProps<T> {
  /** Items to lay out. */
  data: readonly T[];
  /** Column count, or a responsive object such as `{ base: 2, md: 4 }`. */
  cols: ResponsiveValue<number>;
  /** Space between rows and columns. */
  gap?: number;
  /** Space between rows. Overrides `gap`. */
  rowGap?: number;
  /** Space between columns. Overrides `gap`. */
  columnGap?: number;
  renderItem: RenderItem<T>;
  /** Stable key per item. Defaults to `item.key`, `item.id`, then the index. */
  keyExtractor?: (item: T, index: number) => string;
  /** Number of columns an item spans. Clamped to `cols`. Rows are packed by total span. */
  getSpan?: SpanGetter<T>;
  /** `aspectRatio` (width / height) applied to every cell. */
  itemAspectRatio?: number;
  /** Vertical alignment of cells within a row. Default `stretch`. */
  align?: CellAlign;
  /** Layout of an incomplete last row. Default `align`. */
  lastRow?: LastRowMode;
  /** Render rows through a `FlatList`. Default false (a plain `View`). */
  virtualized?: boolean;
  /** Fixed row height (excluding row gap). Enables `getItemLayout` when virtualized. */
  rowHeight?: number;
  style?: StyleProp<ViewStyle>;
  rowStyle?: StyleProp<ViewStyle>;
  /** Style for every cell, or a function of `{ index, row, col }`. */
  cellStyle?: CellStyle;
  testID?: string;

  /** Rendered when `data` is empty (virtualized or not). */
  ListEmptyComponent?: ListSlot;
  // FlatList pass-through, used when `virtualized`.
  ListHeaderComponent?: ListSlot;
  ListFooterComponent?: ListSlot;
  onEndReached?: RowListProps<T>['onEndReached'];
  onEndReachedThreshold?: number;
  refreshControl?: RowListProps<T>['refreshControl'];
  contentContainerStyle?: StyleProp<ViewStyle>;
  scrollEnabled?: boolean;
  /** Rows rendered in the first batch. Default 8. */
  initialNumToRender?: number;
  /** Rows rendered per batch while scrolling. Default 8. */
  maxToRenderPerBatch?: number;
  /** Viewport-height multiples kept rendered. Default 7. */
  windowSize?: number;
  /** Any other FlatList props (escape hatch). */
  flatListProps?: Omit<Partial<RowListProps<T>>, 'data' | 'renderItem' | 'keyExtractor'>;
  /** Ref to the underlying FlatList when `virtualized`. */
  listRef?: Ref<FlatList<PackedRow<T>>>;
}

function renderSlot(slot: ListSlot): ReactNode {
  return isValidElement(slot) ? slot : createElement(slot);
}

/** Drops undefined entries so they do not override values from `flatListProps`. */
function withoutUndefined<P extends object>(props: P): Partial<P> {
  const out: Partial<P> = {};
  for (const key of Object.keys(props) as (keyof P)[]) {
    if (props[key] !== undefined) out[key] = props[key];
  }
  return out;
}

const rowKeyExtractor =(row: PackedRow<unknown>) => `row-${row.index}`;

/**
 * Data-driven grid. Items are packed into rows of `cols` columns (by span
 * when `getSpan` is given); each row is a flex row whose cells grow by their
 * span, so columns share space without percentage math. An incomplete last
 * row is padded with invisible placeholders according to `lastRow`.
 */
export function SmartGrid<T>(props: SmartGridProps<T>): ReactElement | null {
  const {
    data,
    cols,
    gap,
    rowGap: rowGapProp,
    columnGap: columnGapProp,
    renderItem,
    keyExtractor,
    getSpan,
    itemAspectRatio,
    align = 'stretch',
    lastRow = 'align',
    virtualized = false,
    rowHeight,
    style,
    rowStyle,
    cellStyle,
    testID,
    ListEmptyComponent,
    ListHeaderComponent,
    ListFooterComponent,
    onEndReached,
    onEndReachedThreshold,
    refreshControl,
    contentContainerStyle,
    scrollEnabled,
    initialNumToRender,
    maxToRenderPerBatch,
    windowSize,
    flatListProps,
    listRef,
  } = props;

  const layout = useGridLayout(cols, { gap, rowGap: rowGapProp, columnGap: columnGapProp });
  const { cols: resolvedCols, rowGap, columnGap, useMargins } = layout;

  const rows = useMemo(
    () => packRows(data, resolvedCols, getSpan),
    [data, resolvedCols, getSpan],
  );

  const getKey = (keyExtractor ?? defaultKeyExtractor) as (item: T, index: number) => string;

  const renderCell = useCallback(
    (cell: PackedCell<T>, rowIndex: number) =>
      renderItem({ item: cell.item, index: cell.index, row: rowIndex, col: cell.col }),
    [renderItem],
  );

  const lastIndex = rows.length - 1;

  const renderRow = useCallback(
    (row: PackedRow<T>, spacingStyle?: ViewStyle) => (
      <GridRow<T>
        key={rowKeyExtractor(row)}
        row={row}
        cols={resolvedCols}
        isLast={row.index === lastIndex}
        lastRow={lastRow}
        columnGap={columnGap}
        useMargins={useMargins}
        align={align}
        spacingStyle={spacingStyle}
        rowStyle={rowStyle}
        cellStyle={cellStyle}
        aspectRatio={itemAspectRatio}
        getKey={getKey}
        renderCell={renderCell}
        testID={testID}
      />
    ),
    [
      resolvedCols,
      lastIndex,
      lastRow,
      columnGap,
      useMargins,
      align,
      rowStyle,
      cellStyle,
      itemAspectRatio,
      getKey,
      renderCell,
      testID,
    ],
  );

  const renderListItem = useCallback(
    ({ item }: ListRenderItemInfo<PackedRow<T>>) => renderRow(item),
    [renderRow],
  );

  const Separator = useMemo(
    () => (rowGap > 0 ? () => <View style={heightStyle(rowGap)} /> : undefined),
    [rowGap],
  );

  const getItemLayout = useMemo(
    () =>
      rowHeight === undefined
        ? undefined
        : (_: ArrayLike<PackedRow<T>> | null | undefined, index: number) => ({
            length: rowHeight,
            offset: (rowHeight + rowGap) * index,
            index,
          }),
    [rowHeight, rowGap],
  );

  const containerStyle = useMemo(
    () => [useMargins ? undefined : rowGapStyle(rowGap), style],
    [useMargins, rowGap, style],
  );

  if (virtualized) {
    return (
      <FlatList<PackedRow<T>>
        removeClippedSubviews={Platform.OS === 'android'}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={7}
        {...flatListProps}
        {...withoutUndefined({
          initialNumToRender,
          maxToRenderPerBatch,
          windowSize,
          ListEmptyComponent,
          ListHeaderComponent,
          ListFooterComponent,
          onEndReached,
          onEndReachedThreshold,
          refreshControl,
          contentContainerStyle,
          scrollEnabled,
          style,
          testID,
        })}
        ref={listRef}
        data={rows}
        renderItem={renderListItem}
        keyExtractor={rowKeyExtractor}
        ItemSeparatorComponent={Separator}
        getItemLayout={getItemLayout}
        extraData={renderRow}
      />
    );
  }

  if (rows.length === 0) {
    return ListEmptyComponent ? (
      <View style={style} testID={testID}>
        {renderSlot(ListEmptyComponent)}
      </View>
    ) : null;
  }

  return (
    <View style={containerStyle} testID={testID}>
      {rows.map((row) =>
        renderRow(row, useMargins && row.index > 0 ? marginTopStyle(rowGap) : undefined),
      )}
    </View>
  );
}
