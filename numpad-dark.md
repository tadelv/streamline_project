# Numpad Dark UI Implementation Summary

## Overview
This file documents the recent changes applied to the Streamline project to implement a full-screen, dark themed numeric keypad entry modal based on Figma design `node-id=398:744`.

## Files involved
- `src/css/numpad-modal.css`
- `src/modules/numpad-modal.js`
- `src/css/main.css` (theme token enhancements)

## Key design goals
- Port Figma dark modal appearance using existing CSS architecture.
- Avoid introducing React/Tailwind dependency; stay in vanilla JS + CSS.
- Reuse existing Inter type tokens and variable theme colors.
- Mirror Figma node structure:
  - top row: `DOSE`, `CANCEL`, `CONFIRM`
  - center input value with large font and cursor
  - previous value chip grid (multiple presets)
  - numeric keypad in 3x4 layout
  - delete button as trash/icon (existing SVG)

## Styling details
### 1. Modal overlay
- `background-color: rgba(0,0,0,0.75)`
- `backdrop-filter: blur(6px)`
- center justified content (`display: flex; justify-content: center; align-items: center`)
- fade transition and active state.

### 2. Modal container
- dark base: `#101217`
- border: `1px solid rgba(255,255,255,0.12)`
- rounded corners: `24px`
- padding and max size boundaries: `max-width: min(95vw,880px)` / `max-height: min(95vh,900px)`

### 3. Header
- Title `DOSE` styled as Inter bold, 40px, white.
- Action buttons:
  - `CANCEL`: transparent dark background + border
  - `CONFIRM`: #385A92 background

### 4. Value display
- Input box with border `2px solid #385A92`
- Value text: Inter 800, 84px, white
- Cursor animated blink

### 5. Previous values
- grid 4 columns, 2 rows, dark button cards
- hover and active style tinted background

### 6. Numpad keys
- background #1F2234, on hover #2b3048, on press #3c4671
- white text, 36px, very bold
- `.` and `delete` extra emphasis weight
- delete button red #DA515E

### 7. Theme tokens added in `main.css`
- `--off-white: #E8E8E8`
- `--low-contrast-white: #959595`
- `--dark-gray: #121212`
- `--duller-dark-blue: #415996`

## JS Behavior
- Kept existing logic in `numpad-modal.js` including:
  - `shouldUseNumpad()` mobile fallback
  - state tracking: `currentValue`, `previousValues`, `currentFieldType`
  - `openModal()`/`closeModal()`/`handleConfirm()`
  - field configs for `dose-in`, `drink-out`, `temperature`, `grind`
- Updated modal DOM to include new header actions and aesthetic container HTML.
- Maintains keyboard prevention behavior for touch-based environments.

## Next steps
- Hook `numpad-modal.js` into the existing page scavenging CSS variable mode in dark theme.
- Add integration tests for UI events (`1`, `del`, `confirm`, history value pins).

## Notes
- The actual file content in repository may be reverted; this summary describes the intended design update process.
