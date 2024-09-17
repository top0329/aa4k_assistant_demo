module.exports = {
  extends: [
    '@cybozu/eslint-config/globals/kintone.js',
    '@cybozu/eslint-config/lib/base.js',
    '@cybozu/eslint-config/lib/kintone.js',
    '@cybozu/eslint-config/lib/prettier.js',
  ],
  rules: {
    'sort-imports': [
      'error',
      {
        endOfLineState: 'auto',
      },
    ],
    'prettier/prettier': ['error', { singleQuote: true }],
    'space-before-function-paren': 0,
    'object-curly-spacing': 0,
  },
};
