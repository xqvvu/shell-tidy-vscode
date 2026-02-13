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

  external: ["vscode"],
});
