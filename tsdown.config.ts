import { defineConfig } from "tsdown";

export default defineConfig({
  entry: [
    {
      index: "src/extension.ts",
    },
  ],

  format: "commonjs",
  target: "node18",

  inlineOnly: false,
  sourcemap: true,
  dts: false,
  minify: true,

  copy: [
    {
      from: "node_modules/@one-ini/wasm/one_ini_bg.wasm",
      to: "dist",
    },
  ],

  noExternal: ["editorconfig"],
  external: ["vscode"],
});
