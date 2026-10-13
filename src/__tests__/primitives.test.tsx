import { createRef } from 'react';
import { Dimensions, Text, View } from 'react-native';
import { act, render, renderHook, screen } from '@testing-library/react-native';
import {
  Column,
  LayoutProvider,
  Row,
  Spacer,
  useBreakpoint,
  useResponsiveValue,
  type ViewRef,
} from '../index';
import { flat, hostChildren } from './helpers';

describe('Row / Column', () => {
  it('Row maps shorthand props to styles', async () => {
    await render(
      <Row
        testID="row"
        gap={8}
        align="center"
        justify="between"
        wrap
        padding={4}
        paddingX={10}
        fill
        style={{ backgroundColor: 'blue' }}
      >
        <Text>a</Text>
      </Row>,
    );
    expect(flat(screen.getByTestId('row'))).toEqual({
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'space-between',
      flex: 1,
      padding: 4,
      paddingHorizontal: 10,
      rowGap: 8,
      columnGap: 8,
      backgroundColor: 'blue',
    });
  });

  it('Column supports reverse, flex, paddingY and specific gaps', async () => {
    await render(
      <Column testID="col" reverse flex={2} paddingY={6} gap={2} rowGap={12} justify="evenly" />,
    );
    expect(flat(screen.getByTestId('col'))).toEqual({
      flexDirection: 'column-reverse',
      flex: 2,
      paddingVertical: 6,
      justifyContent: 'space-evenly',
      rowGap: 12,
      columnGap: 2,
    });
  });

  it('forwards refs and other View props', async () => {
    const ref = createRef<ViewRef>();
    await render(<Row ref={ref} testID="row" accessibilityLabel="toolbar" />);
    expect(ref.current).not.toBeNull();
    expect(screen.getByLabelText('toolbar')).toBeTruthy();
  });

  it('scales gap and padding with useScale', async () => {
    await render(
      <LayoutProvider spacing={8} useScale>
        <Column testID="col" gap={2} padding={1} />
      </LayoutProvider>,
    );
    const style = flat(screen.getByTestId('col'));
    expect(style.rowGap).toBe(16);
    expect(style.padding).toBe(8);
  });

  it('interleaves spacers instead of gap in margin mode', async () => {
    await render(
      <LayoutProvider gapStrategy="margin">
        <Row testID="row" gap={10}>
          <Text>a</Text>
          <Text>b</Text>
          <Text>c</Text>
        </Row>
      </LayoutProvider>,
    );
    const row = screen.getByTestId('row');
    expect(flat(row).columnGap).toBeUndefined();
    const kids = hostChildren(row);
    expect(kids).toHaveLength(5);
    expect(flat(kids[1]!).width).toBe(10);
  });
});

describe('Spacer', () => {
  it('fills remaining space without size', async () => {
    await render(
      <Row>
        <Spacer testID="s" />
      </Row>,
    );
    expect(flat(screen.getByTestId('s')).flex).toBe(1);
  });

  it('uses width inside a Row and height inside a Column', async () => {
    await render(
      <View>
        <Row>
          <Spacer testID="h" size={16} />
        </Row>
        <Column>
          <Spacer testID="v" size={16} />
        </Column>
        <Spacer testID="plain" size={4} />
      </View>,
    );
    expect(flat(screen.getByTestId('h'))).toEqual({ width: 16, flexShrink: 0 });
    expect(flat(screen.getByTestId('v'))).toEqual({ height: 16, flexShrink: 0 });
    expect(flat(screen.getByTestId('plain'))).toEqual({ height: 4, flexShrink: 0 });
  });
});

describe('useBreakpoint / useResponsiveValue', () => {
  afterEach(() =>
    act(() => {
      Dimensions.set({ window: { width: 750, height: 1334, scale: 2, fontScale: 2 } });
    }),
  );

  it('reports the active breakpoint and follows window changes', async () => {
    const { result } = await renderHook(() => useBreakpoint());
    expect(result.current).toBe('md');
    await act(() => {
      Dimensions.set({ window: { width: 1300, height: 800, scale: 2, fontScale: 1 } });
    });
    expect(result.current).toBe('xl');
  });

  it('resolves values with provider breakpoints', async () => {
    const { result } = await renderHook(() => useResponsiveValue({ base: 'phone', big: 'tablet' }), {
      wrapper: ({ children }) => <LayoutProvider breakpoints={{ big: 700 }}>{children}</LayoutProvider>,
    });
    expect(result.current).toBe('tablet');
  });
});
