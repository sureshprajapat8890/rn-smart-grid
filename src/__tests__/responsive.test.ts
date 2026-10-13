import {
  DEFAULT_BREAKPOINTS,
  getBreakpoint,
  isResponsiveObject,
  orderBreakpoints,
  resolveResponsive,
} from '../utils/responsive';

describe('getBreakpoint', () => {
  it.each([
    [0, 'base'],
    [359, 'base'],
    [360, 'sm'],
    [599, 'sm'],
    [600, 'md'],
    [900, 'lg'],
    [1600, 'xl'],
  ])('width %p → %p', (width, expected) => {
    expect(getBreakpoint(width, DEFAULT_BREAKPOINTS)).toBe(expected);
  });

  it('supports custom, unordered breakpoints', () => {
    const bps = { wide: 1000, phone: 0, tablet: 700 };
    expect(getBreakpoint(500, bps)).toBe('phone');
    expect(getBreakpoint(800, bps)).toBe('tablet');
    expect(getBreakpoint(1200, bps)).toBe('wide');
  });
});

describe('orderBreakpoints', () => {
  it('sorts by min width with base first', () => {
    expect(orderBreakpoints({ lg: 900, sm: 360, md: 600 })).toEqual(['base', 'sm', 'md', 'lg']);
  });
});

describe('resolveResponsive', () => {
  const cols = { base: 2, sm: 3, md: 4, lg: 6 };

  it('returns plain values unchanged', () => {
    expect(resolveResponsive(5, 'lg')).toBe(5);
  });

  it('picks the exact breakpoint', () => {
    expect(resolveResponsive(cols, 'base')).toBe(2);
    expect(resolveResponsive(cols, 'sm')).toBe(3);
    expect(resolveResponsive(cols, 'md')).toBe(4);
    expect(resolveResponsive(cols, 'lg')).toBe(6);
  });

  it('falls back to the nearest smaller breakpoint (mobile-first)', () => {
    expect(resolveResponsive(cols, 'xl')).toBe(6);
    expect(resolveResponsive({ base: 1, md: 3 }, 'lg')).toBe(3);
    expect(resolveResponsive({ base: 1, md: 3 }, 'sm')).toBe(1);
  });

  it('returns undefined when nothing at or below the breakpoint is defined', () => {
    expect(resolveResponsive({ md: 3 }, 'sm')).toBeUndefined();
  });

  it('treats unknown breakpoint names as base', () => {
    expect(resolveResponsive(cols, 'nope')).toBe(2);
  });

  it('uses custom breakpoint order', () => {
    const bps = { phone: 0, tablet: 700 };
    expect(resolveResponsive({ phone: 1, tablet: 3 }, 'tablet', bps)).toBe(3);
  });
});

describe('isResponsiveObject', () => {
  it('distinguishes objects from plain values', () => {
    expect(isResponsiveObject(3)).toBe(false);
    expect(isResponsiveObject({ base: 3 })).toBe(true);
    expect(isResponsiveObject(null as unknown as number)).toBe(false);
  });
});
