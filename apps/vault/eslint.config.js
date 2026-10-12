import sharedConfig from "@nimble/shared-config/eslint-nextjs";

export default [
  ...sharedConfig,
  { ignores: [".velite/**", "playwright-report/**", "test-results/**"] },
];
