/**
 * React integration for UI Primitives
 * Selective exports to avoid bundling issues
 */

// React components for browser environments

export { Dialog } from '../dialog-alpha/dialog';
export { DialogRoot } from '../dialog-alpha/root';
export { DialogTrigger } from '../dialog-alpha/trigger';
export { DialogContent } from '../dialog-alpha/content';
export { DialogBackdrop } from '../dialog-alpha/backdrop';
export { DialogClose } from '../dialog-alpha/close';
export { DialogPortal } from '../dialog-alpha/portal';
export { DialogProvider, useDialog } from '../dialog-alpha/context';
export type { DialogContextType, DialogState } from '../dialog-alpha/types';

// Note: DialogPortal is excluded due to react-dom bundling issues 