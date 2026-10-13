import { forwardRef } from 'react';
import type { ViewRef } from '../types';
import { Stack, type StackProps } from './Stack';

export interface RowProps extends StackProps {
  /** Wrap children onto multiple lines. */
  wrap?: boolean;
}

/** A `View` with `flexDirection: 'row'` and layout shorthands. Follows RTL automatically. */
export const Row = forwardRef<ViewRef, RowProps>(function Row(props, ref) {
  return <Stack ref={ref} {...props} direction="row" />;
});
