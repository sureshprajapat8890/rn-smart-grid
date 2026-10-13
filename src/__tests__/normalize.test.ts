import { resetDevWarnings } from '../utils/env';
import { normalizeCols, normalizeOffset, normalizeSpan } from '../utils/normalize';

describe('normalizeCols', () => {
  let warn: jest.SpyInstance;
  beforeEach(() => {
    resetDevWarnings();
    warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => warn.mockRestore());

  it('passes valid integers through without warning', () => {
    expect(normalizeCols(4)).toBe(4);
    expect(warn).not.toHaveBeenCalled();
  });

  it.each([0, -3, NaN, Infinity, undefined, '3'])('clamps %p to 1 and warns', (value) => {
    expect(normalizeCols(value)).toBe(1);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('floors non-integers and warns', () => {
    expect(normalizeCols(3.7)).toBe(3);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('clamps values between 0 and 1 to 1', () => {
    expect(normalizeCols(0.5)).toBe(1);
  });

  it('warns once per distinct message', () => {
    normalizeCols(0);
    normalizeCols(0);
    expect(warn).toHaveBeenCalledTimes(1);
  });
});

describe('normalizeSpan / normalizeOffset', () => {
  it('clamps span into [1, cols]', () => {
    expect(normalizeSpan(undefined, 4)).toBe(1);
    expect(normalizeSpan(9, 4)).toBe(4);
    expect(normalizeSpan(2.6, 4)).toBe(2);
  });

  it('clamps offset into [0, max]', () => {
    expect(normalizeOffset(undefined, 3)).toBe(0);
    expect(normalizeOffset(5, 3)).toBe(3);
  });
});
