import { defineConfig, globalIgnores } from 'eslint/config';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import prettierConfig from 'eslint-config-prettier';
import preact from 'eslint-config-preact';
import { flatConfigs } from 'eslint-plugin-import';
import globals from 'globals';
import tsParser from '@typescript-eslint/parser';
import js from '@eslint/js';
import vitest from '@vitest/eslint-plugin';

export default defineConfig([
  globalIgnores([
    '**/node_modules/',
    '**/dist/',
    '**/build/',
    '**/src-tauri/',
    '**/*.config.js',
    '**/coverage/',
  ]),
  ...preact,
  js.configs.recommended,
  ...typescriptEslint.configs['flat/recommended'],
  prettierConfig,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },

      parser: tsParser,
      ecmaVersion: 'latest',
      sourceType: 'module',

      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },

    plugins: {
      import: flatConfigs.recommended.plugins.import,
    },

    rules: {
      '@typescript-eslint/explicit-function-return-type': 'warn',

      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],

      'import/no-cycle': 'error',

      'no-console': [
        'warn',
        {
          allow: ['warn', 'error'],
        },
      ],
    },
  },
  {
    files: ['src/engine/**/*.ts'],

    rules: {
      'import/no-restricted-paths': [
        'error',
        {
          zones: [
            {
              target: 'src/engine',
              from: ['src/features', 'src/design-system', 'src/adapters', 'src/app'],
              message:
                'engine/ must never import from features/, design-system/, adapters/, or app/ (per module-boundaries.md)',
            },
            {
              target: 'src/engine',
              from: ['preact', 'preact/hooks', '@tauri-apps/api'],
              message:
                'engine/ must not import Preact or Tauri (per module-boundaries.md)',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/persistence/**/*.ts'],

    rules: {
      'import/no-restricted-paths': [
        'error',
        {
          zones: [
            {
              target: 'src/persistence',
              from: ['src/adapters', 'src/features', 'src/design-system', 'src/app'],
              message:
                'persistence/ defines contracts only; adapters/ implements them (per module-boundaries.md)',
            },
            {
              target: 'src/persistence',
              from: ['preact', '@tauri-apps/api'],
              message: 'persistence/ must not import Preact or Tauri',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/features/**/*.tsx'],

    rules: {
      'import/no-restricted-paths': [
        'error',
        {
          zones: [
            {
              target: 'src/features',
              from: ['src/persistence', 'src/adapters'],
              message:
                'features/ never talks to persistence/adapters directly; goes through app/dataLayer (per module-boundaries.md)',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/__tests__/**', '**/*.test.ts', '**/*.test.tsx'],
    plugins: { vitest },

    languageOptions: {
      globals: {
        ...vitest.environments.env.globals,
      },
    },

    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
]);
