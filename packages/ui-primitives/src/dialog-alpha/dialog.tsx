import React from 'react';
import { DialogRoot } from './root';
import { DialogTrigger } from './trigger';
import { DialogPortal } from './portal';
import { DialogContent } from './content';
import { DialogBackdrop } from './backdrop';
import { DialogClose } from './close';
import type { DialogRootProps } from './types';

// Main compound component
export function Dialog({ children, open, onOpenChange }: DialogRootProps) {
  return (
    <DialogRoot open={open} onOpenChange={onOpenChange}>
      {children}
    </DialogRoot>
  );
}

// Attach subcomponents for compound pattern
Dialog.Root = DialogRoot;
Dialog.Trigger = DialogTrigger;
Dialog.Portal = DialogPortal;
Dialog.Content = DialogContent;
Dialog.Backdrop = DialogBackdrop;
Dialog.Close = DialogClose; 