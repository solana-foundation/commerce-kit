import { defineConfig } from 'tsup';
import path from 'path';
import fs from 'fs';

// Create a more aggressive plugin that intercepts and replaces ui-primitives imports
const replaceUiPrimitivesPlugin = {
  name: 'replace-ui-primitives',
  setup(build) {
    // Intercept ui-primitives imports
    build.onResolve({ filter: /ui-primitives/ }, (args) => {
      return {
        path: path.resolve(__dirname, 'src/iframe-app/dialog-shim.tsx'),
        namespace: 'dialog-shim',
      };
    });
    
    // Load our shim for the namespace
    build.onLoad({ filter: /.*/, namespace: 'dialog-shim' }, async () => {
      const shimPath = path.resolve(__dirname, 'src/iframe-app/dialog-shim.tsx');
      const content = await fs.promises.readFile(shimPath, 'utf8');
      return {
        contents: content,
        loader: 'tsx',
      };
    });
  },
};

export default defineConfig({
  entry: ['src/iframe-app/index.tsx'],
  format: ['iife'],
  outDir: 'dist/iframe-app',
  clean: true,
  minify: true,
  noExternal: [/.*/], // Bundle everything including React
  globalName: 'CommerceIframe',
  platform: 'browser',
  target: 'es2020',
  esbuildOptions(options) {
    // Ensure we output a single self-contained file
    options.bundle = true;
    options.metafile = false;
    options.splitting = false;
    
    // Add our custom plugin first
    options.plugins = [replaceUiPrimitivesPlugin, ...(options.plugins || [])];
    
    // Add define to help with debugging
    options.define = {
      ...options.define,
      'process.env.NODE_ENV': '"production"',
    };
  },
});
