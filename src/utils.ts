export function isObject(obj: unknown): obj is Record<string | number, any> {
  return obj !== null && obj && typeof obj === 'object' && !Array.isArray(obj);
}

export function debounce<T extends Function>(wait = 0, fn: T, token = { cancelled: false }) {
  if (wait === 0) {
    return fn;
  }

  let timeout: ReturnType<typeof setTimeout> | undefined;

  return (((...args: any[]) => {
    const later = () => {
      timeout = undefined;

      // check if the fn call was cancelled.
      if (!token.cancelled) fn(...args);
    };

    // because we might want to use Node.js setTimout for SSR.
    clearTimeout(timeout as any);
    timeout = setTimeout(later, wait) as any;
  }) as any) as T;
}
