import react from 'eslint-plugin-react';
import hooks from 'eslint-plugin-react-hooks';

export default [{
  files: ['**/*.{js,mjs}'],
  languageOptions: { ecmaVersion: 'latest', sourceType: 'module', parserOptions: { ecmaFeatures: { jsx: true } } },
  plugins: { react, 'react-hooks': hooks },
  rules: {
    'react/jsx-uses-react': 'error', 'react/jsx-uses-vars': 'error',
    'react-hooks/rules-of-hooks': 'error', 'react-hooks/exhaustive-deps': 'warn',
    'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' }],
    'no-constant-condition': ['error', { checkLoops: false }],
  },
}];
