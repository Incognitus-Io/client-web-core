import typescript from 'rollup-plugin-typescript2';
import { terser } from 'rollup-plugin-terser';
import eslint from '@rollup/plugin-eslint';

const esmOutput = {
  file: 'lib/esm/index.js',
  format: 'es',
  sourcemap: true,
  compact: true,
};
const cjsOutput = {
  file: 'lib/cjs/index.js',
  format: 'cjs',
  sourcemap: true,
  exports: 'auto',
};

export default {
  input: 'src/index.ts',
  output: [
    esmOutput,
    { ...esmOutput, file: 'lib/esm/index.min.js', plugins: [terser()] },
    cjsOutput,
    { ...cjsOutput, file: 'lib/cjs/index.min.js', plugins: [terser()] },
  ],
  plugins: [
    typescript({
      useTsconfigDeclarationDir: true,
      tsconfig: 'tsconfig.json',
    }),
    eslint({
      throwOnError: true,
      throwOnWarning: true,
    }),
  ],
  external: [],
};
