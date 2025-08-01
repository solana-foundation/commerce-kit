/**
 * Commerce SDK UI Primitives
 * Framework-agnostic, SSR-safe, performance-focused UI primitives
 * Built on dialog-alpha implementation
 */

// Core dialog components (from dialog-alpha) - only used exports
export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogBackdrop,
  DialogClose,
  DialogProvider
} from './dialog-alpha';

// DialogPortal from react integration
export { DialogPortal } from './react/index';

// Core tabs components (from tabs-alpha) - only used exports  
export {
  TabsRoot,
  TabsList,
  TabsTab,
  TabsPanel
} from './tabs-alpha'; 