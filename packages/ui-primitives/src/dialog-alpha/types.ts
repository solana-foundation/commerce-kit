import { ReactNode } from 'react';

export interface DialogState {
  isOpen: boolean;
  isTransitioning: boolean;
}

export interface DialogContextType {
  isOpen: boolean;
  isTransitioning: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

export interface DialogRootProps {
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  modal?: boolean;
}

export interface DialogTriggerProps {
  children: ReactNode;
  asChild?: boolean;
}

export interface DialogContentProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  labelledById?: string;
  describedById?: string;
  autoFocus?: boolean;
}

export interface DialogBackdropProps {
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export interface DialogCloseProps {
  children: ReactNode;
  asChild?: boolean;
} 