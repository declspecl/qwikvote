/** @type {import("eslint").Linter.Config} */
import baseConfig from "@remindy/eslint/base";

export default [
    ...baseConfig,
    {
        ignores: ["layers/**", "cdk.out/**", "dist/**"],
    },
];
