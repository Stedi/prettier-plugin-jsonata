export default [
  {
    env: {
      es6: true,
      node: true,
      jest: true,
    },
    parserOptions: {
      ecmaVersion: 2018,
      sourceType: "module",
      project: "./tsconfig.json",
    },
    parser: "@typescript-eslint/parser",
    plugins: ["@typescript-eslint"],
    extends: [
      "eslint:recommended",
      "plugin:@typescript-eslint/recommended",
    ],
    rules: {
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/no-unused-vars": "error",
      "@typescript-eslint/no-explicit-any": "error",
    },
    overrides: [],
  },
]