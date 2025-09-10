import { defineConfig } from 'tsup';
import path from 'path';
import fs from 'fs';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import type { Plugin, PluginBuild, OnResolveArgs, OnLoadArgs } from 'esbuild';

// Ensure a single React/ReactDOM instance is bundled to avoid React #525
const require = createRequire(import.meta.url);
let reactPath = '';
let reactJsxRuntimePath = '';
let reactJsxDevRuntimePath = '';
let reactDomPath = '';
let reactDomClientPath = '';
try {
  reactPath = require.resolve('react');
  reactJsxRuntimePath = require.resolve('react/jsx-runtime');
  reactJsxDevRuntimePath = require.resolve('react/jsx-dev-runtime');
  reactDomPath = require.resolve('react-dom');
  reactDomClientPath = require.resolve('react-dom/client');
} catch {
  // If resolution fails in some environments, leave empty and let esbuild resolve normally
}

// Pre-resolve the dialog shim path using ESM approach
const dialogShimPath = fileURLToPath(new URL('./src/iframe-app/dialog-shim.tsx', import.meta.url));

const singleReactPlugin: Plugin = {
  name: 'single-react',
  setup(build) {
    const map = new Map<string, string>([
      ['react', reactPath],
      ['react/jsx-runtime', reactJsxRuntimePath],
      ['react/jsx-dev-runtime', reactJsxDevRuntimePath],
      ['react-dom', reactDomPath],
      ['react-dom/client', reactDomClientPath],
    ]);

    build.onResolve({ filter: /^(react|react\/jsx-runtime|react\/jsx-dev-runtime|react-dom|react-dom\/client)$/ }, (args: OnResolveArgs) => {
      const resolved = map.get(args.path);
      if (resolved && resolved.length > 0) {
        return { path: resolved };
      }
      return undefined;
    });
  },
};

// Create a more aggressive plugin that intercepts and replaces ui-primitives imports
const replaceUiPrimitivesPlugin: Plugin = {
  name: 'replace-ui-primitives',
  setup(build: PluginBuild) {
    // Intercept ui-primitives imports
    build.onResolve({ filter: /ui-primitives/ }, (args: OnResolveArgs) => {
      return {
        path: dialogShimPath,
        namespace: 'dialog-shim',
      };
    });
    
    // Load our shim for the namespace
    build.onLoad({ filter: /.*/, namespace: 'dialog-shim' }, async (_args: OnLoadArgs) => {
      const content = await fs.promises.readFile(dialogShimPath, 'utf8');
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
  outDir: 'dist/iframe',
  clean: true,
  // Enable readable errors locally by building dev React when IFRAME_DEV=true
  minify: process.env.IFRAME_DEV === 'true' ? false : true,
  noExternal: [/.*/], // Bundle everything including React
  globalName: 'CommerceIframe',
  platform: 'browser',
  target: 'es2020',
  esbuildOptions(options) {
    // Ensure we output a single self-contained file
    options.bundle = true;
    options.metafile = false;
    options.splitting = false;
    
    // Add our custom plugins first
    options.plugins = [singleReactPlugin, replaceUiPrimitivesPlugin, ...(options.plugins || [])];
    
    // Add define to help with debugging
    options.define = {
      ...options.define,
      'process.env.NODE_ENV': process.env.IFRAME_DEV === 'true' ? '"development"' : '"production"',
    };
  },
});
