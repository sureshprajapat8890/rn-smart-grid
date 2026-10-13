import { Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { Grid, GridItem } from '../index';
import { columnEdges, flat, hostChildren, round, simulateRow } from './helpers';

const hidden = { includeHiddenElements: true } as const;

describe('Grid / GridItem', () => {
  it('packs children by span like SmartGrid', async () => {
    await render(
      <Grid testID="grid" cols={3} gap={8}>
        <GridItem span={2}>
          <Text>wide</Text>
        </GridItem>
        <GridItem>
          <Text>a</Text>
        </GridItem>
        <GridItem>
          <Text>b</Text>
        </GridItem>
      </Grid>,
    );
    const rows = screen.queryAllByTestId(/^grid-row-\d+$/, hidden);
    expect(rows).toHaveLength(2);
    expect(hostChildren(rows[0]!).map((c) => flat(c).flexGrow)).toEqual([2, 1]);
    // last row: 1 item + trailing placeholder of 2 columns
    expect(hostChildren(rows[1]!).map((c) => flat(c).flexGrow)).toEqual([1, 2]);
  });

  it('lines spans up with the columns', async () => {
    await render(
      <Grid testID="grid" cols={3} gap={8}>
        <GridItem span={2} testID="wide" />
        <GridItem testID="x" />
        <GridItem testID="y" />
        <GridItem testID="z" />
        <GridItem testID="w" />
      </Grid>,
    );
    const edges = columnEdges(300, 3, 8);
    expect(round(simulateRow(screen.getByTestId('grid-row-0'), 300))).toEqual(
      round([[0, edges[1]![1]], edges[2]!]),
    );
    expect(round(simulateRow(screen.getByTestId('grid-row-1'), 300))).toEqual(round(edges));
  });

  it('keeps padded GridItems on the column grid (offset row vs full row)', async () => {
    const tile = { padding: 8 };
    await render(
      <Grid testID="grid" cols={3} gap={10}>
        <GridItem span={2} style={tile} />
        <GridItem style={tile} />
        <GridItem style={tile} />
        <GridItem offset={1} style={tile} />
      </Grid>,
    );
    const edges = columnEdges(332, 3, 10);
    const boxes = (row: number) =>
      round(simulateRow(screen.getByTestId(`grid-row-${row}`, { includeHiddenElements: true }), 332));
    expect(boxes(0)).toEqual(round([[0, edges[1]![1]], edges[2]!]));
    expect(boxes(1)).toEqual(round(edges));
  });

  it('renders offset as leading placeholder columns', async () => {
    await render(
      <Grid testID="grid" cols={4}>
        <GridItem offset={1} testID="shifted" />
      </Grid>,
    );
    const row = screen.getByTestId('grid-row-0', hidden);
    const kids = hostChildren(row);
    expect(kids.map((c) => c.props.testID)).toEqual([
      'grid-placeholder-0-offset-0',
      'grid-cell-0',
      'grid-placeholder-0-pad-end',
    ]);
    expect(kids.map((c) => flat(c).flexGrow)).toEqual([1, 1, 2]);
    expect(screen.getByTestId('shifted')).toBeTruthy();
  });

  it('applies GridItem style and props to a view inside the sizing cell', async () => {
    await render(
      <Grid testID="grid" cols={2}>
        <GridItem testID="item" style={{ backgroundColor: 'red' }} accessibilityLabel="card">
          <Text>content</Text>
        </GridItem>
      </Grid>,
    );
    const sizing = screen.getByTestId('grid-cell-0');
    const cell = screen.getByTestId('item');
    expect(hostChildren(sizing)[0]).toBe(cell);
    expect(flat(sizing).flexGrow).toBe(1);
    expect(flat(sizing).backgroundColor).toBeUndefined();
    expect(flat(cell).backgroundColor).toBe('red');
    expect(cell.props.accessibilityLabel).toBe('card');
    expect(screen.getByText('content')).toBeTruthy();
  });

  it('treats non-GridItem children as span 1 and skips null children', async () => {
    await render(
      <Grid testID="grid" cols={2}>
        <Text>one</Text>
        {null}
        {false}
        <Text>two</Text>
        <Text>three</Text>
      </Grid>,
    );
    expect(screen.queryAllByTestId(/^grid-row-\d+$/, hidden)).toHaveLength(2);
    expect(screen.getByText('three')).toBeTruthy();
  });

  it('clamps spans above cols', async () => {
    await render(
      <Grid testID="grid" cols={2}>
        <GridItem span={5} testID="big" />
      </Grid>,
    );
    expect(flat(screen.getByTestId('grid-cell-0')).flexGrow).toBe(2);
  });

  it('honors lastRow', async () => {
    await render(
      <Grid testID="grid" cols={3} lastRow="stretch">
        <GridItem testID="only" />
      </Grid>,
    );
    expect(hostChildren(screen.getByTestId('grid-row-0', hidden))).toHaveLength(1);
  });

  it('renders as a plain View outside a Grid', async () => {
    await render(
      <GridItem span={2} testID="loose">
        <Text>alone</Text>
      </GridItem>,
    );
    expect(screen.getByTestId('loose').props.span).toBeUndefined();
  });
});
