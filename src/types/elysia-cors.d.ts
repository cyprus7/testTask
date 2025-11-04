declare module '@elysiajs/cors' {
    // Minimal declaration to satisfy TypeScript. The runtime export is a factory
    // that returns an Elysia middleware. Keep this file small to avoid leaking
    // `any` widely — it's a narrow shim for the external package.
    export function cors(): unknown;
}
