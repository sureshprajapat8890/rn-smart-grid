import { createRef, useEffect, type RefObject } from 'react';
import { Dimensions, Text, type FlatList } from 'react-native';
import { act, render, screen } from '@testing-library/react-native';
import {
  LayoutProvider,
  SmartGrid,
  type LastRowMode,
  type PackedRow,
  type SmartGridProps,
} from '../index';
import { resetDevWarnings } from '../utils/env';
import { columnEdges, flat, hostChildren, round, simulateRow } from './helpers';

interface Item {
  id: string;
}

const items = (n: number, prefix = 'item'): Item[] =>
  Array.from({ length: n }, (_, i) => ({ id: `${prefix}-${i}` }));

const renderItem: SmartGridProps<Item>['renderItem'] = ({ item }) => <Text>{item.id}</Text>;

const hidden = { includeHiddenElements: true } as const;

const setWidth = (width: number) =>
  act(() => {
    Dimensions.set({
      window: { width, height: 1000, scale: 2, fontScale: 1 },
      screen: { width, height: 1000, scale: 2, fontScale: 1 },
    });
  });

const rowsOf = () => screen.queryAllByTestId(/^grid-row-\d+$/, hidden);
const cellsOf = () => screen.queryAllByTestId(/^grid-cell-\d+$/);
const placeholdersOf = () => screen.queryAllByTestId(/^grid-placeholder-/, hidden);

afterEach(async () => {
  await setWidth(750);
});

describe('SmartGrid', () => {
  it('renders 18 items in 4 columns as 5 rows of 4, 4, 4, 4, 2', async () => {
    await render(<SmartGrid testID="grid" data={items(18)} cols={4} renderItem={renderItem} />);
    const rows = rowsOf();
    expect(rows).toHaveLength(5);
    expect(rows.map((r) => hostChildren(r).length)).toEqual([4, 4, 4, 4, 3]);
    expect(cellsOf()).toHaveLength(18);
    expect(screen.getByText('item-17')).toBeTruthy();
  });

  it('gives every cell flex growth instead of percentage widths', async () => {
    await render(<SmartGrid testID="grid" data={items(4)} cols={4} renderItem={renderItem} />);
    for (const cell of cellsOf()) {
      const style = flat(cell);
      expect(style.flexGrow).toBe(1);
      expect(style.width).toBeUndefined();
    }
  });

  it('passes item, index, row and col to renderItem', async () => {
    const spy = jest.fn(renderItem);
    await render(<SmartGrid data={items(5)} cols={2} renderItem={spy} />);
    expect(spy).toHaveBeenCalledWith({ item: { id: 'item-4' }, index: 4, row: 2, col: 0 });
    expect(spy).toHaveBeenCalledWith({ item: { id: 'item-3' }, index: 3, row: 1, col: 1 });
  });

  it('hides placeholders from touches and accessibility', async () => {
    await render(<SmartGrid testID="grid" data={items(6)} cols={4} renderItem={renderItem} />);
    const [placeholder] = placeholdersOf();
    expect(placeholder).toBeDefined();
    expect(flat(placeholder!).pointerEvents).toBe('none');
    expect(placeholder!.props.accessibilityElementsHidden).toBe(true);
    expect(placeholder!.props.importantForAccessibility).toBe('no-hide-descendants');
    expect(placeholder!.props.accessible).toBe(false);
    expect(screen.queryAllByTestId(/^grid-placeholder-/)).toHaveLength(0);
  });

  describe('geometry (columns line up across rows)', () => {
    const W = 400;
    const GAP = 12;
    const edges = columnEdges(W, 4, GAP);

    const cellBoxes = (rowIndex: number) => {
      const row = screen.getByTestId(`grid-row-${rowIndex}`, hidden);
      const boxes = simulateRow(row, W);
      return round(
        hostChildren(row)
          .map((child, i) => [child, boxes[i]!] as const)
          .filter(([child]) => /-cell-/.test(child.props.testID ?? ''))
          .map(([, box]) => box),
      );
    };

    describe.each(['gap', 'margin'] as const)('gapStrategy=%s', (gapStrategy) => {
      const renderGrid = (count: number, lastRow: LastRowMode, extra?: Partial<SmartGridProps<Item>>) =>
        render(
          <LayoutProvider gapStrategy={gapStrategy}>
            <SmartGrid
              testID="grid"
              data={items(count)}
              cols={4}
              gap={GAP}
              lastRow={lastRow}
              renderItem={renderItem}
              {...extra}
            />
          </LayoutProvider>,
        );

      it('full rows fill the columns', async () => {
        await renderGrid(8, 'align');
        expect(cellBoxes(0)).toEqual(round(edges));
      });

      it('align: last-row items keep column width at the start', async () => {
        await renderGrid(18, 'align');
        expect(cellBoxes(4)).toEqual(round([edges[0]!, edges[1]!]));
      });

      it('end: last-row items sit in the last columns', async () => {
        await renderGrid(18, 'end');
        expect(cellBoxes(4)).toEqual(round([edges[2]!, edges[3]!]));
      });

      it('center: even remainder centers on column boundaries', async () => {
        await renderGrid(18, 'center');
        expect(cellBoxes(4)).toEqual(round([edges[1]!, edges[2]!]));
      });

      it('center: odd remainder is exactly centered at column width', async () => {
        await renderGrid(9, 'center');
        const unit = edges[0]![1];
        const start = (W - unit) / 2;
        expect(cellBoxes(2)).toEqual(round([[start, start + unit]]));
      });

      it('stretch: last-row items share the full width', async () => {
        await renderGrid(18, 'stretch');
        const half = (W - GAP) / 2;
        expect(cellBoxes(4)).toEqual(round([[0, half], [half + GAP, W]]));
      });

      it('padded and bordered cells stay on the column grid', async () => {
        await renderGrid(7, 'align', {
          cellStyle: ({ index }) => (index % 2 ? { padding: 9, borderWidth: 2 } : undefined),
        });
        expect(cellBoxes(0)).toEqual(round(edges));
        expect(cellBoxes(1)).toEqual(round([edges[0]!, edges[1]!, edges[2]!]));
      });

      it('spans cover whole columns plus the gaps between them', async () => {
        const spans = [2, 1, 1, 3, 1];
        await renderGrid(5, 'align', { getSpan: (_, i) => spans[i]! });
        expect(cellBoxes(0)).toEqual(round([[0, edges[1]![1]], edges[2]!, edges[3]!]));
        expect(cellBoxes(1)).toEqual(round([[0, edges[2]![1]], edges[3]!]));
      });
    });
  });

  describe('lastRow placeholders', () => {
    it.each([
      ['align', 1, ['cell', 'cell', 'pad']],
      ['stretch', 0, ['cell', 'cell']],
      ['center', 2, ['pad', 'cell', 'cell', 'pad']],
      ['end', 1, ['pad', 'cell', 'cell']],
    ] as const)('%s', async (lastRow, count, order) => {
      await render(
        <SmartGrid testID="grid" data={items(6)} cols={4} lastRow={lastRow} renderItem={renderItem} />,
      );
      expect(placeholdersOf()).toHaveLength(count);
      const lastRowEl = screen.getByTestId('grid-row-1', hidden);
      expect(
        hostChildren(lastRowEl).map((c) => (/placeholder/.test(c.props.testID ?? '') ? 'pad' : 'cell')),
      ).toEqual(order);
    });

    it('pads a single row when cols exceeds data length', async () => {
      await render(<SmartGrid testID="grid" data={items(2)} cols={5} renderItem={renderItem} />);
      expect(rowsOf()).toHaveLength(1);
      const [pad] = placeholdersOf();
      expect(flat(pad!).flexGrow).toBe(3);
    });
  });

  describe('empty data', () => {
    it('renders nothing by default', async () => {
      await render(<SmartGrid testID="grid" data={[]} cols={3} renderItem={renderItem} />);
      expect(screen.queryByTestId('grid')).toBeNull();
    });

    it('renders ListEmptyComponent', async () => {
      await render(
        <SmartGrid
          data={[]}
          cols={3}
          renderItem={renderItem}
          ListEmptyComponent={<Text>Nothing here</Text>}
        />,
      );
      expect(screen.getByText('Nothing here')).toBeTruthy();
    });

    it('renders ListEmptyComponent as a component type when virtualized', async () => {
      const Empty = () => <Text>Empty list</Text>;
      await render(
        <SmartGrid data={[]} cols={3} virtualized renderItem={renderItem} ListEmptyComponent={Empty} />,
      );
      expect(screen.getByText('Empty list')).toBeTruthy();
    });
  });

  describe('invalid cols', () => {
    let warn: jest.SpyInstance;
    beforeEach(() => {
      resetDevWarnings();
      warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    });
    afterEach(() => warn.mockRestore());

    it.each([0, -1, NaN])('clamps %p to 1 column with a dev warning', async (cols) => {
      await render(<SmartGrid testID="grid" data={items(3)} cols={cols} renderItem={renderItem} />);
      expect(rowsOf()).toHaveLength(3);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('Invalid `cols`'));
    });

    it('floors non-integer cols with a dev warning', async () => {
      await render(<SmartGrid testID="grid" data={items(6)} cols={2.5} renderItem={renderItem} />);
      expect(rowsOf()).toHaveLength(3);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('must be an integer'));
    });
  });

  describe('responsive cols', () => {
    const cols = { base: 2, sm: 3, md: 4, lg: 6 };

    it.each([
      [320, 6],
      [400, 4],
      [750, 3],
      [1000, 2],
    ])('at width %p renders %p rows of 12 items', async (width, rowCount) => {
      await setWidth(width);
      await render(<SmartGrid testID="grid" data={items(12)} cols={cols} renderItem={renderItem} />);
      expect(rowsOf()).toHaveLength(rowCount);
    });

    it('re-chunks on orientation change', async () => {
      await setWidth(400);
      await render(<SmartGrid testID="grid" data={items(12)} cols={cols} renderItem={renderItem} />);
      expect(rowsOf()).toHaveLength(4);
      await setWidth(1000);
      expect(rowsOf()).toHaveLength(2);
    });

    it('uses breakpoints from LayoutProvider', async () => {
      await setWidth(500);
      await render(
        <LayoutProvider breakpoints={{ tablet: 480 }}>
          <SmartGrid
            testID="grid"
            data={items(12)}
            cols={{ base: 1, tablet: 6 }}
            renderItem={renderItem}
          />
        </LayoutProvider>,
      );
      expect(rowsOf()).toHaveLength(2);
    });
  });

  describe('updates and keys', () => {
    it('re-chunks when data or cols change', async () => {
      const { rerender } = await render(
        <SmartGrid testID="grid" data={items(6)} cols={3} renderItem={renderItem} />,
      );
      expect(rowsOf()).toHaveLength(2);
      await rerender(<SmartGrid testID="grid" data={items(10)} cols={3} renderItem={renderItem} />);
      expect(rowsOf()).toHaveLength(4);
      await rerender(<SmartGrid testID="grid" data={items(10)} cols={5} renderItem={renderItem} />);
      expect(rowsOf()).toHaveLength(2);
    });

    it('does not re-render unchanged rows or remount cells when data is appended', async () => {
      const mounts = new Map<string, number>();
      const Probe = ({ id }: { id: string }) => {
        useEffect(() => {
          mounts.set(id, (mounts.get(id) ?? 0) + 1);
        }, [id]);
        return <Text>{id}</Text>;
      };
      const calls: string[] = [];
      const render$ = ({ item }: { item: Item }) => {
        calls.push(item.id);
        return <Probe id={item.id} />;
      };
      const first = items(8);
      const { rerender } = await render(<SmartGrid data={first} cols={4} renderItem={render$} />);
      calls.length = 0;
      await rerender(<SmartGrid data={[...first, ...items(2, 'more')]} cols={4} renderItem={render$} />);
      expect(calls).toEqual(['more-0', 'more-1']);
      expect([...mounts.values()].every((n) => n === 1)).toBe(true);
    });

    it('keeps cells mounted when cols change and they stay in the same row', async () => {
      const mounts: string[] = [];
      const Probe = ({ id }: { id: string }) => {
        useEffect(() => {
          mounts.push(id);
        }, [id]);
        return <Text>{id}</Text>;
      };
      const data = items(6);
      const r = ({ item }: { item: Item }) => <Probe id={item.id} />;
      const { rerender } = await render(<SmartGrid data={data} cols={3} renderItem={r} />);
      mounts.length = 0;
      await rerender(<SmartGrid data={data} cols={2} renderItem={r} />);
      expect(mounts).not.toContain('item-0');
      expect(mounts).not.toContain('item-1');
    });

    it('uses keyExtractor for cell keys', async () => {
      const keyExtractor = jest.fn((item: Item) => item.id);
      await render(
        <SmartGrid data={items(3)} cols={3} renderItem={renderItem} keyExtractor={keyExtractor} />,
      );
      expect(keyExtractor).toHaveBeenCalledWith({ id: 'item-0' }, 0);
    });
  });

  describe('styling props', () => {
    it('applies itemAspectRatio, rowStyle and functional cellStyle', async () => {
      await render(
        <SmartGrid
          testID="grid"
          data={items(4)}
          cols={2}
          itemAspectRatio={1.5}
          rowStyle={{ paddingVertical: 3 }}
          cellStyle={({ row, col }) => ({ opacity: row === 1 && col === 1 ? 0.5 : 1 })}
          renderItem={renderItem}
        />,
      );
      const inner = (id: string) => flat(hostChildren(screen.getByTestId(id))[0]!);
      expect(flat(screen.getByTestId('grid-cell-0')).aspectRatio).toBe(1.5);
      expect(inner('grid-cell-3').opacity).toBe(0.5);
      expect(inner('grid-cell-2').opacity).toBe(1);
      expect(flat(screen.getByTestId('grid-cell-3')).opacity).toBeUndefined();
      expect(flat(screen.getByTestId('grid-row-0')).paddingVertical).toBe(3);
    });

    it('keeps row height from one column when itemAspectRatio meets spans', async () => {
      const spans = [2, 1, 1, 1, 2];
      await render(
        <SmartGrid
          testID="grid"
          data={items(5)}
          cols={3}
          itemAspectRatio={1.5}
          getSpan={(_, i) => spans[i]!}
          renderItem={renderItem}
        />,
      );
      const cell = (i: number) => flat(screen.getByTestId(`grid-cell-${i}`));
      // row 0: span 2 next to a span 1 → stretches to the span-1 cell's height
      expect(cell(0).aspectRatio).toBeUndefined();
      expect(cell(0).alignSelf).toBe('stretch');
      expect(cell(1).aspectRatio).toBe(1.5);
      // row 2: only a span-2 cell → ratio × span
      expect(cell(4).aspectRatio).toBe(3);
    });

    it('maps align to alignItems on rows', async () => {
      await render(
        <SmartGrid testID="grid" data={items(2)} cols={2} align="center" renderItem={renderItem} />,
      );
      expect(flat(screen.getByTestId('grid-row-0')).alignItems).toBe('center');
    });

    it('rowGap/columnGap override gap', async () => {
      await render(
        <SmartGrid
          testID="grid"
          data={items(4)}
          cols={2}
          gap={4}
          rowGap={20}
          renderItem={renderItem}
        />,
      );
      expect(flat(screen.getByTestId('grid')).rowGap).toBe(20);
      expect(flat(screen.getByTestId('grid-row-0')).columnGap).toBe(4);
    });

    it('scales gaps by spacing when useScale is on', async () => {
      await render(
        <LayoutProvider spacing={4} useScale>
          <SmartGrid testID="grid" data={items(4)} cols={2} gap={3} renderItem={renderItem} />
        </LayoutProvider>,
      );
      expect(flat(screen.getByTestId('grid')).rowGap).toBe(12);
    });

    it('uses logical start margins, so RTL mirrors natively, in margin mode', async () => {
      await render(
        <LayoutProvider gapStrategy="margin">
          <SmartGrid testID="grid" data={items(4)} cols={2} gap={8} renderItem={renderItem} />
        </LayoutProvider>,
      );
      const second = flat(screen.getByTestId('grid-cell-1'));
      expect(second.marginStart).toBe(8);
      expect(second.marginLeft).toBeUndefined();
      expect(flat(screen.getByTestId('grid-row-1')).marginTop).toBe(8);
      expect(flat(screen.getByTestId('grid')).rowGap).toBeUndefined();
    });
  });

  describe('virtualized', () => {
    type ListRef = RefObject<FlatList<PackedRow<Item>> | null>;
    const listOf = (ref: ListRef) => ({ props: ref.current!.props });

    it('renders rows through a FlatList with row keys and defaults', async () => {
      const ref: ListRef = createRef();
      await render(
        <SmartGrid
          testID="grid"
          data={items(1000)}
          cols={4}
          virtualized
          listRef={ref}
          renderItem={renderItem}
        />,
      );
      const list = listOf(ref);
      expect(list.props.data).toHaveLength(250);
      expect(list.props.keyExtractor!(list.props.data![3]!, 3)).toBe('row-3');
      expect(list.props.initialNumToRender).toBe(8);
      expect(list.props.windowSize).toBe(7);
      expect(list.props.getItemLayout).toBeUndefined();
      expect(screen.getByText('item-0')).toBeTruthy();
      expect(screen.queryByText('item-999')).toBeNull();
    });

    it('supports getItemLayout with a fixed rowHeight', async () => {
      const ref: ListRef = createRef();
      await render(
        <SmartGrid
          data={items(40)}
          cols={4}
          gap={10}
          rowHeight={100}
          virtualized
          listRef={ref}
          renderItem={renderItem}
        />,
      );
      const list = listOf(ref);
      expect(list.props.getItemLayout!(undefined, 3)).toEqual({ length: 100, offset: 330, index: 3 });
    });

    it('passes FlatList props through and lets explicit props win over flatListProps', async () => {
      const onEndReached = jest.fn();
      const ref: ListRef = createRef();
      await render(
        <SmartGrid
          listRef={ref}
          data={items(8)}
          cols={4}
          virtualized
          renderItem={renderItem}
          onEndReached={onEndReached}
          scrollEnabled={false}
          windowSize={3}
          flatListProps={{ windowSize: 11, showsVerticalScrollIndicator: false }}
          ListHeaderComponent={<Text>Header</Text>}
          ListFooterComponent={<Text>Footer</Text>}
        />,
      );
      const list = listOf(ref);
      expect(list.props.onEndReached).toBe(onEndReached);
      expect(list.props.scrollEnabled).toBe(false);
      expect(list.props.windowSize).toBe(3);
      expect(list.props.showsVerticalScrollIndicator).toBe(false);
      expect(screen.getByText('Header')).toBeTruthy();
      expect(screen.getByText('Footer')).toBeTruthy();
    });
  });
});
