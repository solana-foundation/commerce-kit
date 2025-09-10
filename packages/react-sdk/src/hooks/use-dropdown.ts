/**
 * useDropdown Hook
 * Reusable dropdown/select state management
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { RefObject } from 'react';

interface UseDropdownOptions {
  initialOpen?: boolean;
  closeOnSelect?: boolean;
  closeOnClickOutside?: boolean;
}

interface UseDropdownReturn<T = any, E extends HTMLElement = HTMLElement> {
  isOpen: boolean;
  selectedValue: T | null;
  open: () => void;
  close: () => void;
  toggle: () => void;
  select: (value: T) => void;
  clear: () => void;
  ref: RefObject<E | null>;
}

export function useDropdown<T = any, E extends HTMLElement = HTMLElement>({
  initialOpen = false,
  closeOnSelect = true,
  closeOnClickOutside = true
}: UseDropdownOptions = {}): UseDropdownReturn<T, E> {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [selectedValue, setSelectedValue] = useState<T | null>(null);
  const ref = useRef<E | null>(null);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const select = useCallback((value: T) => {
    setSelectedValue(value);
    if (closeOnSelect) {
      setIsOpen(false);
    }
  }, [closeOnSelect]);

  const clear = useCallback(() => {
    setSelectedValue(null);
  }, []);

  // Handle click outside
  useEffect(() => {
    if (!closeOnClickOutside || !isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, closeOnClickOutside]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return {
    isOpen,
    selectedValue,
    open,
    close,
    toggle,
    select,
    clear,
    ref,
  };
}
