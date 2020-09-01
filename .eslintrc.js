module.exports = {
  parser: "babel-eslint",
  env: {
    browser: true,
    es6: true,
    node: true,
  },
  extends: ["eslint:recommended", "plugin:react/recommended"],
  globals: {
    Atomics: "readonly",
    SharedArrayBuffer: "readonly",
  },
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 11,
    sourceType: "module",
  },
  plugins: ["react"],
  rules: {
    "react/react-in-jsx-scope": "off",
    "react/no-children-prop": "off",
    "no-unused-expressions": "off",
    "no-console": ["warn", { allow: ["warn", "error"] }],
    "no-case-declarations": "off",
    "react/display-name": "off",
    "react/prop-types": ["error", { skipUndeclared: true }],
  },
  settings: {
    react: {
      version: "detect",
    },
  },
}
