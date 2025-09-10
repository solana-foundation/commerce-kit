#!/usr/bin/env node

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

// Read the built iframe bundle and CSS
const iframeBundlePath = join(process.cwd(), 'dist/iframe/index.global.js');
const iframeCssPath = join(process.cwd(), 'dist/iframe/index.css');
const outputPath = join(process.cwd(), 'src/iframe-app/bundle.ts');
const declarationPath = join(process.cwd(), 'src/iframe-app/bundle.d.ts');

try {
  const bundleContent = readFileSync(iframeBundlePath, 'utf-8');
  let cssContent = '';
  try {
    cssContent = readFileSync(iframeCssPath, 'utf-8');
  } catch {}
  
  // Create the output directory if it doesn't exist
  mkdirSync(dirname(outputPath), { recursive: true });
  
  // Generate TypeScript file with the bundle as a constant
  const tsContent = `// This file is auto-generated. Do not edit manually.
// Generated from: dist/iframe/index.global.js

export const IFRAME_BUNDLE = ${JSON.stringify(bundleContent)};
export const IFRAME_STYLES = ${JSON.stringify(cssContent)};
`;

  // Generate TypeScript declaration file
  const declarationContent = `// This file is auto-generated. Do not edit manually.
// TypeScript declarations for iframe bundle

export declare const IFRAME_BUNDLE: string;
export declare const IFRAME_STYLES: string;
`;
  
  writeFileSync(outputPath, tsContent, 'utf-8');
  writeFileSync(declarationPath, declarationContent, 'utf-8');
  console.log('✅ Generated iframe bundle at:', outputPath);
  console.log('✅ Generated bundle declarations at:', declarationPath);
} catch (error) {
  console.error('❌ Failed to generate iframe bundle:', error);
  process.exit(1);
}
