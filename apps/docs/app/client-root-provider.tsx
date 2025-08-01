'use client';

import { RootProvider } from 'fumadocs-ui/provider';
import type { ReactNode } from 'react';

export function ClientRootProvider({ children }: { children: ReactNode }) {
  return <RootProvider>{children}</RootProvider>;
} 