const normalizeIndex = (length: number, index: number): number => {
  if (index < 0) {
    return Math.max(length + index, 0);
  }

  return index;
};

const installAtPolyfill = (): void => {
  if (typeof Array.prototype.at !== 'function') {
    Object.defineProperty(Array.prototype, 'at', {
      value: function at<T>(this: T[], index: number): T | undefined {
        const normalizedIndex = normalizeIndex(this.length, Number(index) || 0);
        return this[normalizedIndex];
      },
      writable: true,
      configurable: true,
    });
  }

  if (typeof String.prototype.at !== 'function') {
    Object.defineProperty(String.prototype, 'at', {
      value: function at(this: string, index: number): string | undefined {
        const normalizedIndex = normalizeIndex(this.length, Number(index) || 0);
        return this.charAt(normalizedIndex) || undefined;
      },
      writable: true,
      configurable: true,
    });
  }
};

const installFindLastPolyfill = (): void => {
  const arrayPrototype = Array.prototype as typeof Array.prototype & {
    findLast?: unknown;
  };

  if (typeof arrayPrototype.findLast === 'function') return;

  Object.defineProperty(arrayPrototype, 'findLast', {
    value: function findLast<T>(
      this: T[],
      predicate: (value: T, index: number, array: T[]) => boolean,
      thisArg?: unknown,
    ): T | undefined {
      for (let index = this.length - 1; index >= 0; index -= 1) {
        const value = this[index];
        if (predicate.call(thisArg, value, index, this)) {
          return value;
        }
      }

      return undefined;
    },
    writable: true,
    configurable: true,
  });
};

export const ensurePdfJsBrowserPolyfills = (): void => {
  installAtPolyfill();
  installFindLastPolyfill();
};
