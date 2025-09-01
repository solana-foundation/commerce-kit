#!/usr/bin/env node

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

// Read the built iframe bundle and CSS
const iframeBundlePath = join(process.cwd(), 'dist/iframe/index.global.js');
const iframeCssPath = join(process.cwd(), 'dist/iframe/index.css');
const outputPath = join(process.cwd(), 'src/iframe-app/bundle.ts');

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
// Generated from: dist/iframe-app/index.global.js

export const IFRAME_BUNDLE = ${JSON.stringify(bundleContent)};
export const IFRAME_STYLES = ${JSON.stringify(cssContent)};
`;
  
  writeFileSync(outputPath, tsContent, 'utf-8');
  console.log('✅ Generated iframe bundle at:', outputPath);

  // Read template files
  const ckTemplatePath = join(process.cwd(), 'src/iframe-app/templates/ck.html');
  const ckHtml = readFileSync(ckTemplatePath, 'utf-8');

  // Write HTML files
  const ckHtmlPath = join(process.cwd(), 'dist/iframe/ck.html');
  const cktipHtmlPath = join(process.cwd(), 'dist/iframe/cktip.html');
  
  writeFileSync(ckHtmlPath, ckHtml, 'utf-8');
  writeFileSync(cktipHtmlPath, ckHtml, 'utf-8'); // Same template for both
  
  console.log('✅ Generated CDN HTML files:');
  console.log('  - ck.html (iframe endpoint)');
  console.log('  - cktip.html (button widget endpoint)');
} catch (error) {
  console.error('❌ Failed to generate iframe bundle:', error);
  process.exit(1);
}
