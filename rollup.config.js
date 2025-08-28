import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";

export default {
  input: "src/index.js", // tu archivo actual
  output: {
    file: "dist/index.js",
    format: "iife", // formato compatible con Wako (global)
    name: "wakoAddon" // nombre global (opcional)
  },
  plugins: [resolve(), commonjs()]
};
