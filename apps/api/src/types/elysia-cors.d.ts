declare module '@elysiajs/cors' {
    // Minimal declaration to satisfy TypeScript. The runtime export is a factory
    // that returns an Elysia middleware plugin. We import the Elysia type so
    // the returned function is compatible with `.use()` without using `any`.
    import type { Elysia } from 'elysia';

    export function cors(): (app: Elysia) => Elysia;
}
