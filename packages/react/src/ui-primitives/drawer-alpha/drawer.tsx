import { DrawerRoot } from './root';
import type { DrawerRootProps } from './types';

/**
 * Main Drawer component - wrapper around DrawerRoot
 */
export function Drawer(props: DrawerRootProps) {
    return <DrawerRoot {...props} />;
}
