import type { DrawerHandleProps } from './types';

export function DrawerHandle({ className, style }: DrawerHandleProps) {
    return (
        <div
            className={className}
            style={{
                width: '40px',
                height: '4px',
                backgroundColor: 'rgba(0, 0, 0, 0.2)',
                borderRadius: '2px',
                margin: '12px auto 8px',
                flexShrink: 0,
                ...style,
            }}
            aria-hidden="true"
        />
    );
}

