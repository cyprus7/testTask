module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    parserOptions: {
        project: ['./tsconfig.json'],
        tsconfigRootDir: __dirname,
        sourceType: 'module'
    },
    plugins: ['@typescript-eslint', 'import'],
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/recommended-requiring-type-checking',
        'plugin:import/recommended',
        'plugin:import/typescript'
    ],
    env: {
        node: true,
        es2022: true
    },
    rules: {
        // Ban explicit any
        '@typescript-eslint/no-explicit-any': 'error',
        // Prefer explicit types on module boundaries
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        // Use TS-aware unused rules
        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
        // Ensure consistent imports for TypeScript
        'import/no-unresolved': 'off',
        // Allow flexibility for now on import ordering
        'import/order': 'off'
    }
};