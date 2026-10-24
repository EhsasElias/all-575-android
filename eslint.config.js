import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import { defineConfig, globalIgnores } from 'eslint/config';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const layerImportMessage = 'Respect the layer direction: app -> features -> shared.';

export default defineConfig([
  globalIgnores([
    'dist',
    'android',
    'src/shared/api/schema.d.ts',
    'coverage',
    'playwright-report',
    'test-results',
  ]),

  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  reactHooks.configs.flat.recommended,
  jsxA11y.flatConfigs.strict,

  {
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      'no-console': 'error',
      'no-restricted-exports': ['error', { restrictDefaultExports: { direct: true } }],
      '@typescript-eslint/consistent-type-assertions': ['error', { assertionStyle: 'never' }],
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
    },
  },

  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'max-lines': ['error', { max: 250, skipBlankLines: true, skipComments: true }],
    },
  },

  {
    files: ['src/shared/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/features', '@/features/**', '@/app', '@/app/**'],
              message: layerImportMessage,
            },
          ],
        },
      ],
    },
  },

  {
    files: ['src/features/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['@/app', '@/app/**'], message: layerImportMessage },
            {
              group: ['@/features/*/**'],
              message: 'Import another feature only through its index file.',
            },
          ],
        },
      ],
    },
  },

  {
    files: ['**/*.{js,mjs}', '**/*.config.ts'],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['**/*.{js,mjs}'],
    extends: [tseslint.configs.disableTypeChecked],
  },
  {
    files: ['**/*.config.{js,ts}'],
    rules: { 'no-restricted-exports': 'off' },
  },

  prettier,
]);
