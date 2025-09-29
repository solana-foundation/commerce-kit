/**
 * Dialog Alpha - Simplified Dialog Implementation for Solana Commerce SDK
 * Based on the modular dialog system but streamlined for our use case
 */

export { DialogRoot } from '../dialog-alpha/root';
export { DialogTrigger } from '../dialog-alpha/trigger';
export { DialogPortal } from '../dialog-alpha/portal';
export { DialogContent } from '../dialog-alpha/content';
export { DialogBackdrop } from '../dialog-alpha/backdrop';
export { DialogClose } from '../dialog-alpha/close';
export { DialogProvider, useDialog } from '../dialog-alpha/context';

// Compound component for easier usage
export { Dialog } from '../dialog-alpha/dialog';

// Types
export type { DialogContextType, DialogState } from '../dialog-alpha/types';
