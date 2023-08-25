module.exports = {
  extends: '../../config/eslint.cjs',
  rules: {
    '@typescript-eslint/no-use-before-define': 'off',
    'no-invalid-this': 'off',
    'no-restricted-syntax': 'off',
  },
  overrides: [
    {
      files: ['test/util.ts', 'test/tester/**/*.ts'],
      rules: {
        'no-console': 'off',
      },
    },
  ],
}
