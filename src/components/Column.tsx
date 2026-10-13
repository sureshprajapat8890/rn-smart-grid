import { forwardRef } from 'react';
import type { ViewRef } from '../types';
import { Stack, type StackProps } from './Stack';

export type ColumnProps = StackProps;

/** A `View` with `flexDirection: 'column'` and layout shorthands. */
export const Column = forwardRef<ViewRef, ColumnProps>(function Column(props, ref) {
  return <Stack ref={ref} {...props} direction="column" />;
});
