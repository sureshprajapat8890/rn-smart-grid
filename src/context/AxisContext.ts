import { createContext, useContext } from 'react';

export type Axis = 'row' | 'column';

/** Main axis of the nearest `Row` / `Column`, read by `Spacer`. */
export const AxisContext = createContext<Axis>('column');
AxisContext.displayName = 'AxisContext';

export function useAxis(): Axis {
  return useContext(AxisContext);
}
