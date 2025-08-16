import React from 'react';

// Create the Dialog context with default values
const DialogContext = React.createContext({
  open: true,
  setOpen: () => {},
  onOpenChange: () => {},
  onClose: () => {},
  modal: true,
});

// Hook that always returns a valid context
export function useDialog() {
  try {
    const context = React.useContext(DialogContext);
    return context || {
      open: true,
      setOpen: () => {},
      onOpenChange: () => {},
      onClose: () => window.parent.postMessage({ type: 'close' }, '*'),
      modal: true,
    };
  } catch {
    // If context fails, return default
    return {
      open: true,
      setOpen: () => {},
      onOpenChange: () => {},
      onClose: () => window.parent.postMessage({ type: 'close' }, '*'),
      modal: true,
    };
  }
}

// Provider component
export const DialogProvider = ({ children }: any) => {
  const contextValue = React.useMemo(() => ({
    open: true,
    setOpen: () => {},
    onOpenChange: () => {},
    onClose: () => window.parent.postMessage({ type: 'close' }, '*'),
    modal: true,
  }), []);

  return (
    <DialogContext.Provider value={contextValue}>
      {children}
    </DialogContext.Provider>
  );
};

// Dialog components that work without real context
export const Dialog = ({ children }: any) => <DialogProvider>{children}</DialogProvider>;
export const DialogTrigger = ({ children }: any) => children;
export const DialogPortal = ({ children }: any) => children;
export const DialogBackdrop = ({ children }: any) => children;
export const DialogContent = ({ children }: any) => children;

export const DialogClose = ({ children, asChild, ...props }: any) => {
  const handleClick = () => window.parent.postMessage({ type: 'close' }, '*');
  
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      ...props,
      onClick: handleClick
    });
  }
  
  return <button {...props} onClick={handleClick}>{children}</button>;
};

// Export as both named and default exports to cover all import styles
const dialogExports = {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogBackdrop,
  DialogContent,
  DialogClose,
  DialogProvider,
  useDialog,
};

export default dialogExports;
