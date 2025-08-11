"use client";

import React from 'react';
import { Dialog, DialogPortal, DialogBackdrop, DialogContent, DialogTrigger } from '../../../../ui-primitives/src/react';
import { IframeDialogContent } from './iframe-dialog-content';

interface ModalShellProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isolation?: 'none' | 'iframe';
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
        {isolation === 'iframe' ? (
          <IframeDialogContent onRequestClose={() => onOpenChange(false)}>
            {children}
          </IframeDialogContent>
        ) : (
          <DialogContent>
            {children}
          </DialogContent>
        )}
      </DialogPortal>
    </Dialog>
  );
}


