'use client';

import { memo } from 'react';
import type { ReactNode } from 'react';

export interface AccountDropdownProps {
    children: ReactNode;
    content: ReactNode;
}

export const AccountDropdown = memo<AccountDropdownProps>(({ children, content }) => {
    return (
        <div style={{ display: 'inline-block', position: 'relative' }}>
            {children}
            <div style={{ position: 'absolute', right: 0 }}>{content}</div>
        </div>
    );
});

AccountDropdown.displayName = 'AccountDropdown';
