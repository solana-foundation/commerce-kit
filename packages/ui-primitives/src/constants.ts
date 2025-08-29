/**
 * Shared z-index constants for the overlay stacking system.
 * 
 * This ensures consistent layering across all overlay components:
 * - Backdrops appear behind content
 * - All content layers use the same z-index for consistent behavior
 * - Higher values are reserved for system-level overlays
 */
export const Z_INDEX = {
  /** 
   * Backdrop layer for modals and overlays.
   * Used by: DialogBackdrop
   */
  BACKDROP: 40,
  
  /** 
   * Content layer for overlays and interactive elements.
   * Used by: DialogContent, DropdownContent, and other overlay content
   */
  OVERLAY_CONTENT: 50,
} as const

/**
 * CSS custom properties for z-index values.
 * These can be used in CSS files or inline styles.
 */
export const Z_INDEX_CSS_VARS = {
  '--z-backdrop': Z_INDEX.BACKDROP.toString(),
  '--z-overlay-content': Z_INDEX.OVERLAY_CONTENT.toString(),
} as const
