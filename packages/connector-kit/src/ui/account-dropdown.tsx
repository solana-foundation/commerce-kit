'use client';

import React, { memo } from 'react';

export interface AccountDropdownProps {
    children: React.ReactNode;
    content: React.ReactNode;
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
