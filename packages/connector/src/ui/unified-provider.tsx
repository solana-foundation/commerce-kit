'use client';

import type { ReactNode, ComponentType } from 'react';
import { ConnectorProvider } from './connector-provider';
import type { ConnectorConfig } from '../lib/connector-client';

interface ProviderDescriptor<Props extends Record<string, unknown>> {
    component: ComponentType<Props>;
    props?: Props;
}

export interface UnifiedProviderProps {
    children: ReactNode;
    connectorConfig?: ConnectorConfig;
    // Optional additional providers to wrap around children
    providers?: ProviderDescriptor<Record<string, unknown>>[];
}

export function UnifiedProvider({
    children,
    connectorConfig,
    providers = [],
}: UnifiedProviderProps) {
    // Start with connector provider as the base
    let content = <ConnectorProvider config={connectorConfig}>{children}</ConnectorProvider>;

    // Wrap with additional providers in reverse order
    // so they nest properly (first provider is outermost)
    for (let i = providers.length - 1; i >= 0; i--) {
        const p = providers[i];
        if (!p) continue;
        const Provider = p.component;
        const props = p.props ?? {};
        content = <Provider {...props}>{content}</Provider>;
    }

    return content;
}

// Export with practical names
export { UnifiedProvider as AppProvider };
export { UnifiedProvider as WalletProvider };
