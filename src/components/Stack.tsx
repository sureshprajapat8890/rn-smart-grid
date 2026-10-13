import { Children, forwardRef, useMemo, type ReactNode } from 'react';
import { View, type ViewProps, type ViewStyle } from 'react-native';
import { useLayoutConfig } from '../context/LayoutProvider';
import { AxisContext, type Axis } from '../context/AxisContext';
import { useSpace } from '../hooks/useSpace';
import type { FlexAlign, FlexJustify, ViewRef } from '../types';
import { alignMap, heightStyle, justifyMap } from '../utils/styles';

export interface StackProps extends ViewProps {
  /** Space between children on both axes. */
  gap?: number;
  /** Space between lines (rows). Overrides `gap`. */
  rowGap?: number;
  /** Space between columns. Overrides `gap`. */
  columnGap?: number;
  /** `alignItems`. */
  align?: FlexAlign;
  /** `justifyContent`. */
  justify?: FlexJustify;
  /** Reverse the main axis (`row-reverse` / `column-reverse`). */
  reverse?: boolean;
  /** `flex` value. */
  flex?: number;
  /** Shorthand for `flex: 1`. */
  fill?: boolean;
  padding?: number;
  /** Horizontal padding. */
  paddingX?: number;
  /** Vertical padding. */
  paddingY?: number;
  children?: ReactNode;
}

interface InternalStackProps extends StackProps {
  direction: Axis;
  wrap?: boolean;
}

type Mutable<T> = { -readonly [K in keyof T]: T[K] };

function widthStyle(width: number): ViewStyle {
  return { width };
}

/** Shared implementation of `Row` and `Column`. */
export const Stack = forwardRef<ViewRef, InternalStackProps>(function Stack(
  {
    direction,
    wrap,
    gap,
    rowGap,
    columnGap,
    align,
    justify,
    reverse,
    flex,
    fill,
    padding,
    paddingX,
    paddingY,
    style,
    children,
    ...rest
  },
  ref,
) {
  const space = useSpace();
  const { gapStrategy } = useLayoutConfig();
  const useMargins = gapStrategy === 'margin';

  const resolvedRowGap = rowGap ?? gap;
  const resolvedColumnGap = columnGap ?? gap;
  const mainGap = space((direction === 'row' ? resolvedColumnGap : resolvedRowGap) ?? 0);

  const computed = useMemo<ViewStyle>(() => {
    const s: Mutable<ViewStyle> = {
      flexDirection: reverse ? `${direction}-reverse` : direction,
    };
    if (wrap) s.flexWrap = 'wrap';
    if (align) s.alignItems = alignMap[align];
    if (justify) s.justifyContent = justifyMap[justify];
    if (fill) s.flex = 1;
    if (flex !== undefined) s.flex = flex;
    if (padding !== undefined) s.padding = space(padding);
    if (paddingX !== undefined) s.paddingHorizontal = space(paddingX);
    if (paddingY !== undefined) s.paddingVertical = space(paddingY);
    if (!useMargins) {
      if (resolvedRowGap !== undefined) s.rowGap = space(resolvedRowGap);
      if (resolvedColumnGap !== undefined) s.columnGap = space(resolvedColumnGap);
    }
    return s;
  }, [
    direction,
    reverse,
    wrap,
    align,
    justify,
    fill,
    flex,
    padding,
    paddingX,
    paddingY,
    resolvedRowGap,
    resolvedColumnGap,
    useMargins,
    space,
  ]);

  const gapSpacer = useMemo(
    () => (direction === 'row' ? widthStyle(mainGap) : heightStyle(mainGap)),
    [direction, mainGap],
  );

  // Margin fallback: interleave fixed spacers along the main axis. Cross-axis
  // gaps of wrapped rows are not emulated.
  let content = children;
  if (useMargins && mainGap > 0) {
    const items = Children.toArray(children);
    content = items.flatMap((child, i) =>
      i === 0 ? [child] : [<View key={`gap-${i}`} style={gapSpacer} />, child],
    );
  }

  return (
    <AxisContext.Provider value={direction}>
      <View ref={ref} {...rest} style={[computed, style]}>
        {content}
      </View>
    </AxisContext.Provider>
  );
});
