import { forwardRef } from 'react';
import { View, type ViewProps } from 'react-native';
import type { ViewRef } from '../types';

export interface GridItemProps extends ViewProps {
  /** Columns the item spans. Default 1, clamped to the grid's `cols`. */
  span?: number;
  /** Empty columns before the item. Default 0. */
  offset?: number;
}

/**
 * A cell of a `Grid`. Inside a `Grid` its `span` / `offset` drive packing and
 * its other props (style, testID, accessibility…) are applied to the cell.
 * Rendered anywhere else it is a plain `View`.
 */
export const GridItem = forwardRef<ViewRef, GridItemProps>(function GridItem(
  { span: _span, offset: _offset, ...rest },
  ref,
) {
  return <View ref={ref} {...rest} />;
});
