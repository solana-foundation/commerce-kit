# CSS Architecture for React SDK

This document outlines the modular CSS architecture for the React SDK package.

## Directory Structure

```
src/styles/
├── index.css                    # Main entry point - import this file
├── reset.css                    # Base reset/normalize styles
├── tokens/
│   ├── colors.css              # Color design tokens
│   ├── spacing.css             # Spacing and sizing tokens
│   ├── typography.css          # Typography tokens
│   └── shadows.css             # Shadow and elevation tokens
├── utilities/
│   ├── animations.css          # Keyframes and animation utilities
│   ├── layout.css              # Flexbox, grid, and layout utilities
│   └── interactions.css        # Hover, focus, active state utilities
├── components/
│   ├── buttons.css             # All button variants and states
│   ├── inputs.css              # Input fields and form elements
│   ├── modal.css               # Modal container and step animations
│   ├── payment-methods.css     # Payment method selection components
│   ├── qr-code.css            # QR code display and states
│   ├── wallet.css             # Wallet connection UI
│   ├── merchant-pill.css      # Merchant address display component
│   ├── currency-selector.css  # Currency dropdown component
│   └── header.css             # Modal header component
└── themes/
    └── default.css             # Default theme variables and overrides
```

## Usage

### In Your Component Files
```typescript
// Import the complete stylesheet
import '../styles/index.css';

// Or import specific modules if you need granular control
import '../styles/components/buttons.css';
import '../styles/tokens/colors.css';
```

### Custom Themes
Override CSS custom properties to customize the appearance:

```css
:root {
  --color-primary: #your-brand-color;
  --color-secondary: #your-accent-color;
  --border-radius: 0.5rem;
  --font-family: "Your Font", system-ui, sans-serif;
}
```

## Design Tokens

### Colors
- `--color-primary`: Main brand color (#9945FF)
- `--color-secondary`: Accent color (#14F195)
- `--color-text`: Primary text color (#111827)
- `--color-background`: Background color (#ffffff)

### Spacing
- `--space-xs` through `--space-2xl`: Consistent spacing scale
- `--padding-button`: Standard button padding
- `--gap-md`: Standard gap between elements

### Typography
- `--font-family`: System font stack with fallbacks
- `--font-size-*`: Semantic font sizes (xs, sm, base, lg, xl, 2xl)
- `--font-weight-*`: Semantic font weights (normal, medium, semibold)

## Component Classes

### Buttons
- `.ck-button`: Base button class
- `.ck-trigger-button`: Trigger/CTA button
- `.ck-action-button`: Full-width action button
- `.ck-amount-button`: Amount selection button

### Layout
- `.ck-payment-methods-grid`: Payment method layout
- `.ck-amounts-grid`: Amount selection grid
- `.ck-form-section`: Form section container

### States
- `.selected`: Selected state for interactive elements
- `.active`: Active step or state
- `.processing`: Loading/processing state
- `.error`: Error state

## Benefits

1. **Modularity**: Import only what you need
2. **Maintainability**: Easy to find and update specific styles
3. **Consistency**: Shared design tokens prevent drift
4. **Performance**: Better tree-shaking and caching
5. **Theming**: Easy to create alternative themes
6. **Developer Experience**: Clear organization and naming

## Migration from Legacy styles.css

The previous monolithic `styles.css` file has been broken down into this modular structure. The old file is available as `styles.css.old` for reference.

### Breaking Changes
None - all existing class names and CSS custom properties are preserved.

### Advantages Over Legacy
- Better organization and maintainability
- Easier to customize specific components
- Reduced bundle size when tree-shaking is enabled
- Clear separation of concerns
- Better development experience with focused files

## Build Integration

For optimal performance, consider:
1. PostCSS processing for vendor prefixes and optimization
2. CSS purging to remove unused styles
3. Critical CSS extraction for above-the-fold content
4. CSS custom property fallbacks for older browser support
