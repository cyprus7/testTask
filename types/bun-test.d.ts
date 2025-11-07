// Minimal type declarations for Bun's test runner to satisfy TypeScript
// used in CI where `bun:test` may not have ambient types available.
declare module 'bun:test' {
    export function describe(name: string, fn: () => void | Promise<void>): void;
    export function it(name: string, fn: () => void | Promise<void>): void;
    export function test(name: string, fn: () => void | Promise<void>): void;
    export function expect<T = unknown>(value: T): {
        toBe(expected: unknown): void;
        toEqual(expected: unknown): void;
        toBeTruthy(): void;
        toBeFalsy(): void;
        toBeDefined(): void;
        toBeUndefined(): void;
        toHaveLength(len: number): void;
        toContain(item: unknown): void;
    };

    export const beforeAll: (fn: () => void | Promise<void>) => void;
    export const afterAll: (fn: () => void | Promise<void>) => void;
    export const beforeEach: (fn: () => void | Promise<void>) => void;
    export const afterEach: (fn: () => void | Promise<void>) => void;
}

declare module 'bun:test/spec' {
    export * from 'bun:test';
}
