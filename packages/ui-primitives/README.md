# UI Primitives

Framework-agnostic UI primitives built with vanilla JavaScript and HTML. These components work with any frontend framework (React, Vue, Angular, Svelte) or with plain HTML.

## Installation

```bash
pnpm add @solana-commerce/ui-primitives
```

## Dialog Primitive

A lightweight wrapper around the native `<dialog>` element that adds scroll locking, click-outside-to-close support, and smooth transitions.

### Basic Usage

```html
<!-- Include the styles -->
<link rel="stylesheet" href="node_modules/@solana-commerce/ui-primitives/dist/dialog/styles.css">

<!-- Include the script -->
<script type="module" src="node_modules/@solana-commerce/ui-primitives/dist/dialog/index.js"></script>

<!-- Trigger button -->
<button command="show-modal" commandfor="example-dialog">
  Open Dialog
</button>

<!-- Dialog -->
<dialog-wrapper>
  <dialog id="example-dialog">
    <dialog-backdrop></dialog-backdrop>
    <dialog-panel>
      <h2>Dialog Title</h2>
      <p>Dialog content goes here.</p>
      <button command="close" commandfor="example-dialog">
        Close
      </button>
    </dialog-panel>
  </dialog>
</dialog-wrapper>
```

### API

#### `<dialog-wrapper>`

Wrapper around the native `<dialog>` element used to manage the open state and transitions.

**Attributes:**
- `open` - Boolean attribute that indicates whether the dialog is open or closed

**Events:**
- `open` - Dispatched when the dialog is opened
- `close` - Dispatched when the dialog is closed

**Methods:**
- `show()` - Shows the dialog in modal mode
- `hide(options?)` - Hides the dialog

#### `<dialog-backdrop>`

The visual backdrop behind your dialog panel. Supports transition data attributes.

#### `<dialog-panel>`

The main content area of your dialog. Clicking outside of this will trigger the dialog to close.

### Command Attributes

Use `command` and `commandfor` attributes to control dialogs:

- `command="show-modal"` - Opens the dialog
- `command="close"` - Closes the dialog
- `commandfor="dialog-id"` - Targets the dialog with the specified ID

### Transitions

The dialog supports CSS transitions using data attributes:

- `data-closed` - Present before transitioning in, and when transitioning out
- `data-enter` - Present when transitioning in
- `data-leave` - Present when transitioning out
- `data-transition` - Present when transitioning in or out

### Styling

Include the default styles or create your own:

```css
dialog-backdrop[data-closed] {
  opacity: 0;
}

dialog-panel[data-closed] {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.95);
}
``` 