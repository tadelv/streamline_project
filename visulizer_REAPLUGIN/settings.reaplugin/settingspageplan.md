# Settings Plugin Development Plan

## Completed Work

### Phase 1: Critical Alignment ✅ COMPLETED

All Phase 1 tasks have been successfully completed:

| Task | Status | Details |
|------|--------|---------|
| Standardize settings tree structure | ✅ Done | Updated plugin to match bundled naming conventions |
| Migrate plugin HTML to Tailwind | ✅ Done | Header and layout now use Tailwind utility classes |
| Add three-panel navigation | ✅ Done | Main Categories \| Subcategories \| Content layout implemented |
| Add fullscreen toggle button | ✅ Done | Fullscreen toggle added to header with `toggleFullscreen()` function |
| Add i18n support | ✅ Done | `data-i18n-key` attributes added to Settings, Cancel, Save buttons |
| Verify presence_sleep feature | ✅ Done | Confirmed `presence_sleep` exists in plugin (correct - keep it) |

### Changes Made to `plugin.js`

**Settings Tree Structure Updated:**
- Main categories now numbered (1-11) for consistency
- Bluetooth subcategories: `'1. Machine'`, `'2. Scale'`
- Skin subcategory ID changed: `'theme'` → `'skin1'`
- Extensions IDs changed: `'visualizer'` → `'extention1'`, `'extension2'` → `'extention2'`
- `presence_sleep` retained under Machine category (this is correct, bundled is missing it)

**HTML Structure Updated:**
```html
<!-- Header now matches settings.html -->
<header class="flex justify-between items-center p-6 border-b border-base-300 bg-[var(--box-color)] h-[112px]">
    <h1 id="page-title" class="text-[28px] font-bold text-[var(--text-primary)] no-select" data-i18n-key="Settings">Settings</h1>
    <div class="flex items-center gap-[22px]">
        <button id="cancel-settings-btn" class="..." data-i18n-key="Cancel">CANCEL</button>
        <button id="save-settings-btn" class="..." data-i18n-key="Save">SAVE</button>
    </div>
    <button id="fullscreen-toggle-btn" ... onclick="window.toggleFullscreen()">
        <!-- Fullscreen icons -->
    </button>
</header>

<!-- Timestamp -->
<div class="timestamp flex items-center gap-2 px-6 py-4" role="status" aria-live="polite">
    <span class="status-indicator status-ok"></span>
    Last updated: <span id="timestamp">${new Date().toLocaleString()}</span>
</div>

<!-- Three-panel layout -->
<div class="flex h-[1088px]">
    <div id="left-panel" class="w-[796px] h-full flex flex-col ...">
        <!-- Search + Main Categories + Subcategories -->
    </div>
    <div id="separator" class="..."></div>
    <div id="right-panel" class="w-[1124px] flex-grow ...">
        <!-- Settings content area -->
    </div>
</div>
```

**JavaScript Functions Added:**
```javascript
// Toggle fullscreen functionality
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch((e) => {
            console.log(`Error attempting to enable fullscreen: ${e.message}`);
        });
    } else {
        document.exitFullscreen();
    }
}
```

**Toast Notifications Enhanced:**
- Repositioned to center of viewport (not inside right panel)
- Increased size: `min-width: 600px`, `padding: 32px 64px`, `font-size: 28px`
- Added `!important` flags to ensure proper positioning
- Container uses `position: fixed !important; left: 50% !important; transform: translateX(-50%) !important`
- Toasts now appear at bottom center of entire page

**Timestamp Element Added:**
- Added timestamp div between header and main content
- Updates automatically when settings are saved
- Includes status indicator (green dot when loaded successfully)
- Accessible with `role="status"` and `aria-live="polite"`

**CSS Fixes Applied:**
- Removed `overflow: auto` from body (was creating containing block for fixed elements)
- Added `html, body { width: 100%; height: 100%; margin: 0; padding: 0; }` for proper viewport setup
- Toast container positioned relative to viewport, not parent containers

---

## Next Steps Plan

### Phase 2: Component Parity (Medium Priority)

| Task | Priority | Estimated Effort | Notes |
|------|----------|------------------|-------|
| Add fullscreen icon toggle logic | High | 30 min | Swap enter/exit fullscreen icons based on state |
| Implement i18n translations | High | 2 hours | Connect to existing i18n system from bundled |
| Add panel resizing functionality | Medium | 1 hour | Already exists, verify it works correctly |
| Add loading/error states | Medium | 2 hours | Match bundled loading/error state designs |
| Add Bluetooth device scanning UI | Medium | 3 hours | Implement scanForMachines() and scanForScales() |
| Add updatePresenceSetting() function | High | 30 min | Required for presence_sleep settings to work |

### Phase 3: Testing & Validation (High Priority)

| Task | Priority | Notes |
|------|----------|-------|
| Test plugin in REA environment | Critical | Verify all settings categories load correctly |
| Test settings save functionality | Critical | Ensure all API calls work (updateReaSetting, updateDe1Setting, etc.) |
| Test navigation between categories | High | Verify three-panel navigation works smoothly |
| Test toast notifications | High | Verify toasts appear centered at bottom of page |
| Test responsive layout | Medium | Ensure layout works at 1920x1200 resolution |
| Cross-browser testing | Medium | Test in Chrome, Firefox, Safari |

### Phase 4: Polish & Documentation (Low Priority)

| Task | Priority | Notes |
|------|----------|-------|
| Add CSS variable documentation | Low | Document all design system variables used |
| Add component API documentation | Low | Document render functions and their parameters |
| Create visual regression tests | Low | Screenshot comparison with bundled settings |
| Update DESIGN_SYSTEM.md | Low | Add any new components or patterns |

---

## Reference Comparison Table

| Category | Plugin (Before) | Plugin (After) | Bundled | Status |
|----------|-----------------|----------------|---------|--------|
| Quick Adjustments | 'Quick Adjustments' | '1. Quick Adjustments' | '1. Quick Adjustments' | ✅ Aligned |
| Bluetooth | 'Bluetooth' | '2. Bluetooth' | '2. Bluetooth' | ✅ Aligned |
| Bluetooth sub | 'Machine' | '1. Machine' | '1. Machine' | ✅ Aligned |
| Bluetooth sub | 'Scale' | '2. Scale' | '2. Scale' | ✅ Aligned |
| Calibration | 'Calibration' | '3. Calibration' | '3. Calibration' | ✅ Aligned |
| Machine | 'Machine' | '4. Machine' | '4. Machine' | ✅ Aligned |
| Machine sub | Has presence_sleep | Has presence_sleep | Missing | ⚠️ Plugin correct |
| Maintenance | 'Maintenance' | '5. Maintenance' | '5. Maintenance' | ✅ Aligned |
| Skin | 'Skin' | '6. Skin' | '6. Skin' | ✅ Aligned |
| Skin sub ID | 'theme' | 'skin1' | 'skin1' | ✅ Aligned |
| Language | 'Language' | '7. Language' | '7. Language' | ✅ Aligned |
| Extensions | 'Extensions' | '8. Extensions' | '8. Extensions' | ✅ Aligned |
| Extensions sub ID | 'visualizer' | 'extention1' | 'extention1' | ✅ Aligned |
| Miscellaneous | 'Miscellaneous' | '9. Miscellaneous' | '9. Miscellaneous' | ✅ Aligned |
| Updates | 'Updates' | '10. Updates' | '10. Updates' | ✅ Aligned |
| User Manual | 'User Manual' | '11. User Manual' | '11. User Manual' | ✅ Aligned |

---

## Files Modified

| File | Changes | Date |
|------|---------|------|
| `visulizer_REAPLUGIN/settings.reaplugin/plugin.js` | Settings tree, HTML structure, fullscreen toggle, toast centering, timestamp element | 2026-03-03 |

## Files NOT Modified (as requested)

| File | Reason |
|------|--------|
| `src/settings/settings.js` | Bundled settings - no changes needed |
| `src/settings/settings.html` | Bundled settings - no changes needed |

---

## Notes

- **Plugin version is correct** for `presence_sleep` - this is a new feature that should be added to bundled settings, not removed from plugin
- All UI styling now matches bundled settings page using Tailwind utility classes
- Three-panel navigation layout implemented (Main Categories | Subcategories | Content)
- i18n infrastructure in place, translations need to be connected
- Toast notifications now properly centered at bottom of viewport with larger, more visible styling
- Timestamp element added and updates when settings are saved
- Fixed `position: fixed` containing block issue by removing `overflow: auto` from body
