import { memo, useMemo } from 'react';
import { View, type ViewProps } from 'react-native';
import { useAxis } from '../context/AxisContext';
import { useSpace } from '../hooks/useSpace';
import { baseStyles } from '../utils/styles';

export interface SpacerProps extends ViewProps {
  /**
   * Fixed size along the parent's main axis (width in a `Row`, height in a
   * `Column` or plain `View`). Omit to fill remaining space (`flex: 1`).
   */
  size?: number;
}

/** Flexible filler, or a fixed gap when `size` is set. */
export const Spacer = memo(function Spacer({ size, style, ...rest }: SpacerProps) {
  const axis = useAxis();
  const space = useSpace();
  const px = size === undefined ? undefined : space(size);
  const sizeStyle = useMemo(
    () =>
      px === undefined
        ? baseStyles.fill
        : axis === 'row'
          ? { width: px, flexShrink: 0 }
          : { height: px, flexShrink: 0 },
    [axis, px],
  );
  return <View {...rest} style={[sizeStyle, style]} />;
});
