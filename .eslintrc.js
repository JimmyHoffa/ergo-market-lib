// module.exports = {
//   extends: ["airbnb-base", "plugin:prettier/recommended"],
//   plugins: ["prettier"],
//   root: true,
//   parserOptions: {
//     project: "./tsconfig.eslint.json",
//   },
// };

const {
  configs: { recommended: typescriptEslintRecommended },
} = require("@typescript-eslint/eslint-plugin");
const {
  configs: { typescript: typescriptImports },
} = require("eslint-plugin-import");

module.exports = {
  extends: ["airbnb-base", "plugin:prettier/recommended"],
  plugins: ["prettier"],
  root: true,
  parserOptions: {
    project: "./tsconfig.eslint.json",
  },
  overrides: [
    {
      files: ["**/*.ts", "**/*.tsx"],
      env: {
        jest: true,
      },
      parser: "@typescript-eslint/parser",
      parserOptions: {
        project: "./tsconfig.json",
        ecmaVersion: 2018,
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
      plugins: ["@typescript-eslint"],
      ...typescriptImports,
      rules: {
        ...typescriptEslintRecommended.rules,
        "prettier/prettier": [
          "error",
          {
            singleQuote: true,
            printWidth: 120,
            arrowParents: "avoid",
            // trailingComma: 'none',
            endOfLine: "auto",
          },
        ],
        "class-methods-use-this": "off",
        "import/extensions": [
          "error",
          "ignorePackages",
          { ts: "never", js: "never", tsx: "never", jsx: "never" },
        ],
        "import/prefer-default-export": "off",
        "@typescript-eslint/no-explicit-any": "off",
      },
    },
  ],
};
