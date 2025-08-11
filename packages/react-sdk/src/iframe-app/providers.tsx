import React from 'react';

// Create a mock Dialog context that satisfies the ui-primitives requirements
const DialogContext = React.createContext({
  open: true,
  setOpen: () => {},
  onClose: () => window.parent.postMessage({ type: 'close' }, '*'),
});

// Mock DialogClose component that works without the real Dialog context
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

// Provider that wraps the modal content with necessary context
export function IframeProviders({ children }: { children: React.ReactNode }) {
  // Monkey patch the module resolution for ui-primitives
  React.useEffect(() => {
    // Override require/import for ui-primitives components
    const originalCreateElement = React.createElement;
    (React as any).createElement = function(type: any, props: any, ...children: any[]) {
      // If this is a DialogClose component, use our mock
      if (type && type.name === 'DialogClose') {
        return originalCreateElement(DialogClose, props, ...children);
      }
      return originalCreateElement.apply(React, [type, props, ...children]);
    };
  }, []);
  
  return (
    <DialogContext.Provider value={{
      open: true,
      setOpen: () => {},
      onClose: () => window.parent.postMessage({ type: 'close' }, '*'),
    }}>
      {children}
    </DialogContext.Provider>
  );
}

// Export a hook that can be used by components
export function useDialog() {
  return React.useContext(DialogContext);
}

// Export all Dialog components as stubs
export const Dialog = ({ children }: any) => children;
export const DialogTrigger = ({ children }: any) => children;
export const DialogPortal = ({ children }: any) => children;
export const DialogBackdrop = ({ children }: any) => children;
export const DialogContent = ({ children }: any) => children;

// Re-export everything to match ui-primitives structure
export default {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogBackdrop,
  DialogContent,
  DialogClose,
  useDialog
};
