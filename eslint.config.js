// ESLint flat config. Type-aware rules are off on purpose: the strict tsc run in
// `npm run typecheck` already covers types, and this keeps lint fast.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  { ignores: ['dist/', 'node_modules/', 'web-ext-artifacts/'] },
  js.configs.recommended,
  tseslint.configs.recommended,
  reactHooks.configs.flat.recommended,
  {
    files: ['src/**/*.{ts,tsx}', 'vite*.config.ts'],
    rules: {
      // `const { id: _id, ...rest } = rule` is the idiomatic way to drop a field.
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
);
