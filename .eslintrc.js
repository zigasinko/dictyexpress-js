module.exports = {
    env: {
        browser: true,
        jest: true,
    },
    // Specifies the ESLint parser. Allows ESLint to understand TypeScript syntax.
    parser: '@typescript-eslint/parser',
    // Allows us to use rules within our codebase.
    plugins: ['@typescript-eslint', 'prettier'],
    extends: [
        /* Config rules specified mostly from airbnb-config-typescript GitHub:
         * https://github.com/iamturns/eslint-config-airbnb-typescript and
         * https://blog.geographer.fr/eslint-guide.*/

        // Enable airbnb typescript rules with support for React, React Hooks, TSX,..
        'airbnb-typescript',
        // Add configuration for React Hooks (not automatically enabled via airbnb).
        'airbnb/hooks',
        // TypeScript-specific recommended rules, such as Missing return type on function.
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/recommended-requiring-type-checking',
        /* Uses eslint-config-prettier to disable ESLint rules from
         * @typescript-eslint/eslint-plugin that would conflict with prettier.*/
        'prettier/@typescript-eslint',
        // Disable rules from the react plugin (in airbnb) that conflict with prettier.
        'prettier/react',
        /* Enables eslint-plugin-prettier and eslint-config-prettier.
         * This will display prettier errors as ESLint errors. Make sure this is
         * always the last configuration in the extends array.*/
        'plugin:prettier/recommended',
    ],
    parserOptions: {
        project: ['./tsconfig.json'],
        // Allows for the parsing of modern ECMAScript features.
        ecmaVersion: 2020,
        // Allows for the use of imports.
        sourceType: 'module',
        ecmaFeatures: {
            // Allows for the parsing of JSX.
            jsx: true,
        },
    },
    ignorePatterns: ['.eslintrc.js', 'package-lock.json', 'node_modules', 'build'],
    rules: {
        // .tsx files can include JSX.
        'react/jsx-filename-extension': ['error', { extensions: ['.tsx'] }],
        // Ensure consistent use of file extension within import path.
        'import/extensions': [
            'error',
            'never',
            {
                svg: 'always',
                woff: 'always',
                css: 'always',
                png: 'always',
                jpg: 'always',
                ico: 'always',
            },
        ],
        'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
        'prettier/prettier': 'error',
        'react/require-default-props': 'off',
        'no-void': ['error', { allowAsStatement: true }],
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-unsafe-return': 'off',
        'import/prefer-default-export': 'off',
        '@typescript-eslint/ban-ts-comment': 'off',
        '@typescript-eslint/restrict-template-expressions': ['error', { allowAny: true }],
        'react-hooks/exhaustive-deps': [
            'warn',
            {
                additionalHooks: '(useReport|useStateWithEffect)',
            },
        ],
    },
    settings: {
        'import/resolver': {
            node: {
                extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
                moduleDirectory: ['node_modules', 'src'],
                paths: ['src'],
            },
        },
    },
};
