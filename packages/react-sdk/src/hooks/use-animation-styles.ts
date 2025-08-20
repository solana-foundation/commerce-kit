/**
 * Animation Styles Hook
 * Manages injection of animation styles
 */

import { useEffect } from 'react';
import { ANIMATION_STYLES } from '../constants/tip-modal';

const STYLE_ID = 'sc-tip-modal-anim';

export function useAnimationStyles() {
  useEffect(() => {
    if (typeof document !== 'undefined' && !document.getElementById(STYLE_ID)) {
      const styleEl = document.createElement('style');
      styleEl.id = STYLE_ID;
      styleEl.textContent = ANIMATION_STYLES;
      document.head.appendChild(styleEl);
    }
  }, []);
}
