/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: [
    "next/core-web-vitals",
    "@typescript-eslint/recommended"
  ],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module"
  },
  rules: {
    "@typescript-eslint/no-unused-vars": [
      "error",
      { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }
    ],
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/prefer-const": "error",
    "prefer-const": "off" // Let @typescript-eslint handle this
  },
  ignorePatterns: [
    "dist/**",
    "build/**",
    "out/**",
    ".next/**",
    "node_modules/**"
  ]
}