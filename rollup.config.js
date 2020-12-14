import typescript from 'rollup-plugin-typescript2';
import { terser } from 'rollup-plugin-terser';
import eslint from '@rollup/plugin-eslint';
import stripCode from 'rollup-plugin-strip-code';

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
    stripCode({
      start_comment: 'test-code',
      end_comment: 'end-test-code',
    }),
    eslint({
      throwOnError: true,
      throwOnWarning: true,
    }),
    typescript({
      useTsconfigDeclarationDir: true,
      tsconfig: 'tsconfig.json',
    }),
  ],
  external: [],
};
