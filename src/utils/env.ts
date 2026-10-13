declare const __DEV__: boolean | undefined;
declare const process: { env?: Record<string, string | undefined> } | undefined;

export function isDev(): boolean {
  if (typeof __DEV__ !== 'undefined') return !!__DEV__;
  return typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production';
}

const warned = new Set<string>();

/** Dev-only `console.warn`, printed once per distinct message. */
export function devWarn(message: string): void {
  if (!isDev() || warned.has(message)) return;
  warned.add(message);
  console.warn(`[rn-smart-grid] ${message}`);
}

/** Test helper: forget which warnings were already printed. */
export function resetDevWarnings(): void {
  warned.clear();
}
