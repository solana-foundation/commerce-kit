"use client";

import React from 'react';
import { Dialog, DialogPortal, DialogBackdrop, DialogContent, DialogTrigger } from '../../../../ui-primitives/src/react';

interface ModalShellProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isolation?: 'none' | 'secure';
  trigger?: React.ReactNode;
  children: React.ReactNode;
}

export function ModalShell({ open, onOpenChange, isolation = 'none', trigger, children }: ModalShellProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger ? (
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
      ) : null}
      <DialogPortal>
        <DialogBackdrop onClick={() => onOpenChange(false)} />
        {isolation === 'secure' ? (
          // For secure mode, the children should already be the SecureIframeShell
          <DialogContent>
            {children}
          </DialogContent>
        ) : (
          <DialogContent>
            {children}
          </DialogContent>
        )}
      </DialogPortal>
    </Dialog>
  );
}


