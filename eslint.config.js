import antfu from '@antfu/eslint-config';

export default antfu({
  typescript: true,
  formatters: true,
  stylistic: {
    semi: true,
  },
}, {
  rules: {
    'brace-style': ['error', '1tbs', { allowSingleLine: true }],
  },
});
