#!/usr/bin/env bun

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

// Read the built iframe bundle
const iframeBundlePath = join(process.cwd(), 'dist/iframe-app/index.global.js');
const outputPath = join(process.cwd(), 'src/iframe-app/bundle.ts');

try {
  const bundleContent = readFileSync(iframeBundlePath, 'utf-8');
  
  // Create the output directory if it doesn't exist
  mkdirSync(dirname(outputPath), { recursive: true });
  
  // Generate TypeScript file with the bundle as a constant
  const tsContent = `// This file is auto-generated. Do not edit manually.
// Generated from: dist/iframe-app/index.global.js

export const IFRAME_BUNDLE = ${JSON.stringify(bundleContent)};
`;
  
  writeFileSync(outputPath, tsContent, 'utf-8');
  console.log('✅ Generated iframe bundle at:', outputPath);
} catch (error) {
  console.error('❌ Failed to generate iframe bundle:', error);
  process.exit(1);
}
