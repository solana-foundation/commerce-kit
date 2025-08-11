"use client";

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface IframeDialogContentProps {
  children: React.ReactNode;
  onRequestClose?: () => void;
  widthPx?: number; // desired content width in px (not exceeding 90vw)
  borderRadius?: string; // CSS radius string
  background?: string; // iframe body background
}

/**
 * IframeDialogContent renders its children into a sandboxed iframe using React portals.
 * It preserves React context across the portal and auto-sizes height to fit content.
 */
export function IframeDialogContent({
  children,
  onRequestClose,
  widthPx = 500,
  borderRadius = '12px',
  background = 'transparent',
}: IframeDialogContentProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null);
  const [contentHeight, setContentHeight] = useState<number>(0);

  // Initialize iframe document, mount node, listeners
  useEffect(() => {
    const iframe = iframeRef.current as HTMLIFrameElement | null;
    if (!iframe) return;

    function setup(node: HTMLIFrameElement) {
      const doc = node.contentDocument as Document | null;
      const win = node.contentWindow as (Window & typeof globalThis) | null;
      if (!doc || !win) return;

      // Base document/body styles
      doc.documentElement.style.height = '100%';
      doc.body.style.margin = '0';
      doc.body.style.height = '100%';
      doc.body.style.background = background;

      // Inject a strict CSP for the iframe document
      try {
        const existing = doc.querySelector('meta[http-equiv="Content-Security-Policy"]');
        if (!existing) {
          const csp = doc.createElement('meta');
          csp.httpEquiv = 'Content-Security-Policy';
          // Note: frame-ancestors is ignored in <meta> (must be set via HTTP header) per MDN.
          // Keep other restrictions to harden the iframe doc used by the portal.
          csp.content = "default-src 'none'; script-src 'self'; base-uri 'none'; img-src data: blob: https:; style-src 'unsafe-inline'; font-src data:; connect-src https: wss:";
          doc.head.appendChild(csp);
        }
      } catch {}

      // Mount node
      const root = doc.createElement('div');
      doc.body.appendChild(root);
      setMountNode(root);

      // Close on Escape pressed inside the iframe
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onRequestClose?.();
      };
      doc.addEventListener('keydown', handleKeyDown);

      // Auto-size to content
      const resize = () => {
        const nextHeight = Math.min(
          root.scrollHeight || doc.body.scrollHeight || 0,
          Math.floor(window.innerHeight * 0.9)
        );
        setContentHeight(nextHeight);
      };
      const ResizeObs: typeof ResizeObserver | undefined = (win as unknown as { ResizeObserver?: typeof ResizeObserver }).ResizeObserver || (window as unknown as { ResizeObserver?: typeof ResizeObserver }).ResizeObserver;
      const resizeObserver = ResizeObs ? new ResizeObs(resize) : null;
      resizeObserver?.observe(root);

      const MutObs: typeof MutationObserver | undefined = (win as unknown as { MutationObserver?: typeof MutationObserver }).MutationObserver || (window as unknown as { MutationObserver?: typeof MutationObserver }).MutationObserver;
      const mutationObserver = MutObs ? new MutObs(resize) : null;
      mutationObserver?.observe(root, { childList: true, subtree: true, attributes: true });

      // Initial focus and first resize
      doc.body.tabIndex = -1;
      doc.body.focus();
      resize();

      return () => {
        doc.removeEventListener('keydown', handleKeyDown);
        resizeObserver?.disconnect();
        mutationObserver?.disconnect();
        try {
          if (root.parentNode) root.parentNode.removeChild(root);
        } catch {}
      };
    }

    // If iframe already loaded, set up immediately; otherwise wait for load
    if (iframe.contentDocument && iframe.contentDocument.readyState === 'complete') {
      return setup(iframe);
    }

    const onLoad = () => { setup(iframe); };
    iframe.addEventListener('load', onLoad, { once: true } as any);
    return () => iframe.removeEventListener('load', onLoad as any);
  }, [background, onRequestClose]);

  // Compute visual width (cap at 90vw like DialogContent)
  const effectiveWidth = typeof window === 'undefined' ? widthPx : Math.min(widthPx, Math.floor(window.innerWidth * 0.9));

  return (
    <div
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 50,
        maxWidth: '90vw',
        maxHeight: '90vh',
        // Let Backdrop handle outside clicks; iframe itself is the dialog surface
      }}
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
    >
      <iframe
        ref={iframeRef}
        title="Commerce Modal"
        style={{
          width: effectiveWidth,
          height: contentHeight || 'auto',
          display: 'block',
          border: 'none',
          borderRadius,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          background: 'transparent',
          overflow: 'hidden',
        }}
        referrerPolicy="no-referrer"
        sandbox="allow-scripts allow-forms allow-popups allow-same-origin"
      />
      {mountNode ? createPortal(children, mountNode) : null}
    </div>
  );
}


