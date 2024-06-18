module.exports = {
    env: {
        node: true
    },
    parser: '@typescript-eslint/parser',
    parserOptions: {
        tsconfigRootDir: __dirname,
        sourceType: 'module'
    },
    plugins: ['@typescript-eslint', 'prettier', 'import', 'react', 'react-hooks'],
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:prettier/recommended',
        'plugin:import/errors',
        'plugin:import/warnings',
        'plugin:import/typescript',
        'plugin:react/recommended',
        'plugin:react-hooks/recommended'
    ],
    rules: {
        'prettier/prettier': 'error',
        'import/no-unresolved': 'error',
        'import/order': [
            'error',
            {
                groups: [['builtin', 'external', 'internal']],
                'newlines-between': 'always'
            }
        ],
        'react/prop-types': 'off',
        '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/no-explicit-any': 'off'
    },
    settings: {
        react: {
            version: 'detect'
        },
        'import/resolver': {
            typescript: {
                alwaysTryTypes: true,
                project: ['./tsconfig.json', './packages/*/tsconfig.json']
            }
        }
    },
    ignorePatterns: ['dist/', 'node_modules/']
};
