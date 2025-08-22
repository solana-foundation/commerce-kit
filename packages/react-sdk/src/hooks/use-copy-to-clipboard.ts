import { useState } from 'react';

interface UseCopyToClipboardReturn {
  copied: boolean;
  isHovered: boolean;
  setIsHovered: (hovered: boolean) => void;
  copyToClipboard: (text: string) => Promise<void>;
}

export function useCopyToClipboard(): UseCopyToClipboardReturn {
  const [copied, setCopied] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setIsHovered(false);
      setTimeout(() => {
        setCopied(false);
        setIsHovered(false);
      }, 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setIsHovered(false);
      setTimeout(() => {
        setCopied(false);
        setIsHovered(false);
      }, 2000);
    }
  };

  return {
    copied,
    isHovered,
    setIsHovered,
    copyToClipboard
  };
}
