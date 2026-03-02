# Streamline Settings Replicable UI Components

## Reference Components from settings.js

### 1. Settings Navigation Button

```html
<button class="settings-nav-btn w-full text-left px-4 py-3 rounded-lg text-[24px] text-[#959595] hover:text-white hover:bg-[#2c4a7a] flex items-center">
    <span>Category Name</span>
</button>
```

**Active state:**
```html
<button class="settings-nav-btn w-full text-left px-4 py-3 rounded-lg text-[24px] text-white bg-[#2c4a7a] flex items-center">
```

---

### 2. Settings Subcategory Button

```html
<button class="settings-subnav-btn w-full text-left px-4 py-3 rounded-lg text-[20px] text-[#959595] hover:text-white hover:bg-[#2c4a7a] flex items-center" data-category="category-key">
    <span>Subcategory Name</span>
</button>
```

**Active state:**
```html
<button class="settings-subnav-btn w-full text-left px-4 py-3 rounded-lg text-[20px] bg-[#d7dee9] text-[var(--mimoja-blue)] flex items-center">
```

---

### 3. Settings Content Container

```html
<div class="flex flex-col gap-[60px] items-start relative w-full max-w-full overflow-x-hidden">
    <!-- Title -->
    <div class="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] not-italic relative text-[var(--text-primary)] text-[36px] text-center w-full">
        <p class="leading-[1.2]">Settings Title</p>
    </div>

    <!-- Divider -->
    <div class="h-0 relative w-full">
        <hr class="border-t border-[#c9c9c9] w-full" />
    </div>

    <!-- Setting Items -->
</div>
```

---

### 4. Setting Item - Input + Save Button

```html
<div class="flex flex-col items-start relative w-full max-w-full">
    <div class="flex flex-col gap-[30px] items-start relative w-full max-w-full">
        <div class="flex items-center justify-between relative w-full max-w-full">
            <div class="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative text-[#385a92] text-[30px]">
                <p id="setting-label">Setting Name</p>
            </div>
            <div class="flex items-center gap-4">
                <input type="number" id="settingInput"
                       class="bg-[#385a92] border-2 border-[#385a92] border-solid h-[62.88px] rounded-[10px] w-[150px] text-white text-[24px] p-2 text-center"
                       value="1.0" step="0.1" min="0" max="5">
                <button class="bg-[#385a92] h-[62.88px] rounded-[10px] w-[100px] text-white text-[24px] font-bold"
                        onclick="window.updateReaSetting('key', parseFloat(document.getElementById('settingInput').value))">
                    Save
                </button>
            </div>
        </div>
        <p class="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic relative text-[var(--text-primary)] text-[24px] w-full max-w-full break-words">
            Description text here
        </p>
    </div>
</div>
```

---

### 5. Setting Item - Select Dropdown

```html
<div class="flex items-center justify-between relative w-full max-w-full">
    <div class="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative text-[#385a92] text-[30px]">
        <p>Setting Name</p>
    </div>
    <select class="bg-[#385a92] border-2 border-[#385a92] border-solid h-[62.88px] rounded-[2617.374px] w-[250px] text-white text-[24px] p-2"
            onchange="window.updateReaSetting('key', this.value)">
        <option value="option1">Option 1</option>
        <option value="option2">Option 2</option>
    </select>
</div>
```

---

### 6. Setting Item - Segmented Buttons (3 options)

```html
<div class="flex items-center justify-between w-full max-w-[885px]">
    <button class="h-[120px] w-[295px] rounded-[10px] font-['Inter:Bold',sans-serif] font-bold text-[30px] flex items-center justify-center cursor-pointer transition-colors duration-200 bg-[var(--mimoja-blue)] text-white"
            onclick="window.updateReaSetting('gatewayMode', 'disabled')">
        Disabled
    </button>
    <button class="h-[120px] w-[295px] rounded-[10px] font-['Inter:Bold',sans-serif] font-bold text-[30px] flex items-center justify-center cursor-pointer transition-colors duration-200 bg-[var(--box-color)] border border-[var(--profile-button-outline-color)] text-[#b6c3d7]"
            onclick="window.updateReaSetting('gatewayMode', 'tracking')">
        Tracking
    </button>
    <button class="h-[120px] w-[295px] rounded-[10px] font-['Inter:Bold',sans-serif] font-bold text-[30px] flex items-center justify-center cursor-pointer transition-colors duration-200 bg-[var(--box-color)] border border-[var(--profile-button-outline-color)] text-[#b6c3d7]"
            onclick="window.updateReaSetting('gatewayMode', 'full')">
        Full
    </button>
</div>
```

---

### 7. Setting Item - Plus/Minus Stepper

```html
<div class="border border-[#c9c9c9] border-solid content-stretch flex flex-col gap-[30px] items-center px-[60px] py-[30px] relative shrink-0 w-[590px]">
    <p class="font-['Inter:Regular',sans-serif] font-normal leading-[1.2] text-[var(--text-primary)] text-[30px]">
        Setting Name
    </p>
    <div class="content-stretch flex gap-[20px] h-[72px] items-center justify-center relative shrink-0 w-full">
        <button class="w-[72px] h-[72px] bg-[var(--button-grey)] rounded-[20px] flex items-center justify-center"
                onclick="window.adjustSetting(-5)">
            <svg width="50" height="50" viewBox="0 0 50 50" fill="none">
                <path d="M10.416 25H39.5827" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        </button>
        <div class="text-center text-[var(--text-primary)] text-[24px] font-bold bg-transparent border-none flex items-center justify-center" style="width: 130px;">
            <input type="text" inputmode="numeric" pattern="[0-9]*" id="settingInput"
                   class="text-center text-[var(--text-primary)] text-[24px] font-bold bg-transparent border-none w-full"
                   value="25" onchange="window.updateDe1Setting('key', parseFloat(this.value))">
            <span class="ml-2">°C</span>
        </div>
        <button class="w-[72px] h-[72px] bg-[var(--button-grey)] rounded-[20px] flex items-center justify-center"
                onclick="window.adjustSetting(5)">
            <svg width="50" height="50" viewBox="0 0 50 50" fill="none">
                <path d="M24.9993 10.4165V39.5832M10.416 24.9998H39.5827" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        </button>
    </div>
    <p class="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] text-[var(--text-primary)] text-[24px] w-full text-center">
        Description text
    </p>
</div>
```

---

### 8. Toggle Switch

```html
<label class="relative inline-flex items-center cursor-pointer">
    <input type="checkbox" id="toggle-id" class="sr-only peer" onchange="handleToggle(this.checked)">
    <div class="w-11 h-6 bg-[var(--text-secondary)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#385a92]"></div>
</label>
```

---

### 9. Device List Card (Bluetooth)

```html
<div class="flex items-center justify-between bg-[var(--profile-button-background-color)] rounded-[10px] mb-3 shadow-sm">
    <div class="flex-1 min-w-0">
        <div class="flex items-center">
            <div class="w-3 h-3 rounded-full mr-3 bg-green-500"></div>
            <p class="text-[24px] text-[var(--text-primary)] truncate">Device Name</p>
        </div>
        <p class="text-[18px] text-[var(--text-secondary)] break-all">ID: device-id-123</p>
        <p class="text-[18px] text-green-500 capitalize">Status: connected</p>
        <p class="text-[18px] text-[var(--text-secondary)] capitalize">Type: machine</p>
    </div>
    <div class="flex gap-3 ml-4">
        <button class="bg-[#385a92] hover:bg-[#2c4a7a] h-[60px] rounded-[67.5px] w-[120px] text-white text-[18px] transition-colors duration-200 font-['Inter:Semi_Bold',sans-serif]"
                onclick="handleDeviceAction('device-id', 'disconnect')">
            Disconnect
        </button>
    </div>
</div>
```

---

### 10. Action Button (Scan/Check/Start)

```html
<button class="border-[var(--mimoja-blue)] text-[var(--mimoja-blue)] h-[62px] rounded-[67.5px] border w-[139px] text-[24px]"
        onclick="handleAction()">
    Scan
</button>
```

---

### 11. Search Input

```html
<div class="relative">
    <input type="text" id="settings-search" placeholder="Search settings..."
           class="w-full p-3 pl-12 rounded-lg border border-[var(--border-color)] bg-[var(--profile-button-background-color)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--mimoja-blue)]"
           aria-label="Search settings">
    <svg class="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[var(--text-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
</div>
```

---

### 12. Loading State

```html
<div class="flex flex-col gap-[60px] items-start relative w-full max-w-full overflow-x-hidden">
    <div class="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] not-italic relative text-[var(--text-primary)] text-[36px] text-center w-full">
        <p class="leading-[1.2]">Settings Title</p>
    </div>
    <div class="text-[var(--text-primary)] p-4 text-[24px] text-center w-full">Loading settings...</div>
</div>
```

---

### 13. Error State

```html
<div class="flex flex-col gap-[60px] items-start relative w-full max-w-full overflow-x-hidden">
    <div class="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] not-italic relative text-[var(--text-primary)] text-[36px] text-center w-full">
        <p class="leading-[1.2]">Settings Title</p>
    </div>
    <div class="text-red-500 p-4 text-[24px] text-center w-full">Failed to load settings: Error message</div>
    <button class="bg-[#385a92] h-[62.88px] rounded-[10px] w-[200px] text-white text-[24px] font-bold mx-auto mt-4" onclick="retryLoad()">Retry</button>
</div>
```

---

## Key Design Patterns

| Element | Specification |
|---------|---------------|
| **Primary Color** | `#385a92` (Mimoja Blue) |
| **Hover Color** | `#2c4a7a` |
| **Text Primary** | `var(--text-primary)` |
| **Text Secondary** | `#959595` |
| **Border Color** | `#c9c9c9` |
| **Button Height** | `62.88px` or `62px` |
| **Input Height** | `62.88px` |
| **Section Gap** | `60px` |
| **Item Gap** | `30px` |
| **Font Sizes** | Title: `36px`, Label: `30px`, Description: `24px` |
| **Border Radius** | Buttons: `10px` or `67.5px`, Inputs: `10px` or `2617.374px` (pill) |

---

## Settings Tree Structure

The navigation uses a hierarchical tree with 10 main categories:

1. Quick Adjustments (5 subcategories)
2. Bluetooth (2 subcategories)
3. Calibration (7 subcategories)
4. Machine (2 subcategories)
5. Maintenance (2 subcategories)
6. Skin (1 subcategory)
7. Language (1 subcategory)
8. Extensions (2 subcategories)
9. Miscellaneous (10 subcategories)
10. Updates (2 subcategories)
11. User Manual (2 subcategories)

This modular design allows for easy replication across other settings-heavy pages in the application.

---

# Action Plan: Update plugin.js UI to Match settings.js

## Overview

**Goal:** Update `/visulizer_REAPLUGIN/settings.reaplugin/plugin.js` to match the settings.js design patterns.

**Constraints:**
- ✅ No language settings needed
- ✅ No dark/light mode toggle (keep system theme detection only)
- ✅ All CSS must be inline in JS (no external CSS files)

---

## Phase 1: CSS Cleanup & Updates

### Step 1.1: Remove Legacy CSS Classes

**Delete these old/duplicate classes from the `<style>` block:**

- [ ] `.settings-container`
- [ ] `.settings-section`
- [ ] `.setting-item`
- [ ] `.setting-label`
- [ ] `.setting-control`
- [ ] Old `input[type="number"]`, `input[type="text"]`, `select` styles
- [ ] `.btn`, `.btn-primary`, `.btn-refresh`
- [ ] `.section`, `.settings-grid`
- [ ] `.header`, `.timestamp` (will be replaced)

### Step 1.2: Add max-width to Input Classes

**Update existing classes:**

```css
/* Add max-width to these existing classes */
.settings-input-primary {
    /* ... existing styles ... */
    max-width: 150px;  /* ADD THIS */
}

.settings-input-wide {
    /* ... existing styles ... */
    max-width: 250px;  /* ADD THIS */
}
```

### Step 1.3: Add Missing Component CSS

**Add these new classes to the `<style>` block:**

- [ ] Toggle Switch (checkbox style)
- [ ] Device Card (Bluetooth)
- [ ] Stepper (Plus/Minus buttons)
- [ ] Toast Notifications
- [ ] Header with CANCEL/SAVE buttons
- [ ] Loading State
- [ ] Error State with Retry

**Copy from the reference CSS provided in the conversation.**

---

## Phase 2: HTML Structure Updates

### Step 2.1: Update Header

**Replace the old header:**

```html
<!-- OLD - Remove this -->
<header class="header">
    <h1 id="page-title">REA Settings Dashboard</h1>
    <button class="btn btn-refresh" onclick="location.reload()">Refresh</button>
</header>
```

**With new header:**

```html
<!-- NEW - Add this -->
<header class="settings-header">
    <h1 id="page-title">REA Settings Dashboard</h1>
    <div class="header-actions">
        <button class="btn-cancel" onclick="window.closeSettings()">CANCEL</button>
        <button class="btn-save" onclick="saveAllSettings()">SAVE</button>
    </div>
</header>
```

### Step 2.2: Add Toast Container

**Add after `<body>` tag:**

```html
<div id="toast-container" class="toast-container"></div>
```

### Step 2.3: Remove Theme Toggle

**Find and remove:**
- [ ] Any theme toggle button HTML
- [ ] Any theme switch event listeners in JavaScript

**Keep:**
- ✅ `@media (prefers-color-scheme: dark)` CSS for system theme detection

### Step 2.4: Remove Language Settings Section

**Find and remove:**
- [ ] Any language selection dropdown
- [ ] Any i18n-related settings sections

---

## Phase 3: JavaScript Function Updates

### Step 3.1: Update showToast Function

**Replace existing toast function with:**

```javascript
function showToast(message, duration = 3000, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, duration);
}
```

### Step 3.2: Add Helper Functions

**Add these functions:**

```javascript
// Close settings and return to main page
window.closeSettings = function() {
    // Implementation to close/navigate away
    console.log('Closing settings...');
};

// Save all settings
window.saveAllSettings = async function() {
    showToast('Saving all settings...', 3000, 'info');
    // Implementation to save all modified settings
};

// Adjust stepper value
window.adjustSetting = function(change) {
    const input = document.getElementById('settingInput');
    if (input) {
        let newValue = parseFloat(input.value) + change;
        input.value = newValue.toFixed(1);
        input.dispatchEvent(new Event('change'));
    }
};
```

---

## Phase 4: Testing Checklist

### Visual Testing

- [ ] All inputs are 62.88px height
- [ ] All buttons match mimoja-blue color (#385a92)
- [ ] Section gaps are 60px, item gaps are 30px
- [ ] Font sizes: Title 36px, Label 30px, Description 24px
- [ ] Border radius matches (10px or 67.5px for pills)

### Functional Testing

- [ ] Save button works
- [ ] Cancel button works
- [ ] Toast notifications appear
- [ ] Input validation works (min/max/step)
- [ ] Toggle buttons change state correctly
- [ ] Stepper plus/minus buttons work

### Responsive Testing

- [ ] Layout works at 1920px width
- [ ] Layout works at 1280px width
- [ ] No horizontal scrolling
- [ ] Text wraps correctly

---

## Quick Reference: CSS Class Mapping

| Old Class | New Class | Notes |
|-----------|-----------|-------|
| `.btn` | `.settings-btn-primary` | Use for Save buttons |
| `.btn-refresh` | `.btn-scan` | Use for Scan actions |
| `.setting-item` | `.setting-row-flex` | Main row layout |
| `.setting-control` | `.setting-control-flex` | Control wrapper |
| `.section` | `.settings-section-flex` | Section container |
| `.settings-grid` | `.settings-flex-container` | Main container |

---

## Files to Modify

1. **Primary:** `/visulizer_REAPLUGIN/settings.reaplugin/plugin.js`
   - Update `generateSettingsHTML()` function
   - Replace entire `<style>` block
   - Update header HTML structure
   - Add new helper functions

2. **DO NOT MODIFY:**
   - `/visulizer_REAPLUGIN/settings.reaplugin/settings.css` (will be unused)
   - Any other plugin files

---

## Estimated Time

- **Phase 1 (CSS):** 30 minutes
- **Phase 2 (HTML):** 20 minutes
- **Phase 3 (JavaScript):** 30 minutes
- **Phase 4 (Testing):** 30 minutes

**Total: ~2 hours**

---

## Success Criteria

- [ ] UI matches settings.js design exactly
- [ ] No external CSS dependencies
- [ ] No theme toggle visible
- [ ] No language settings visible
- [ ] All components are reusable
- [ ] Dark mode works via system preference only

---

# Phase 5-8: Add Settings Tree Navigation Structure

## Overview

**Goal:** Transform `plugin.js` from a single-page scroll layout to a **two-panel navigation tree layout** matching `settings.js` design.

**Key Features:**
- Left panel: Main categories (11) + Subcategories (dynamic)
- Right panel: Settings content area
- Resizable panels
- Search functionality
- Active state highlighting

---

## Settings Tree Structure

```
1. Quick Adjustments
   ├── Flow Multiplier
   ├── Steam
   ├── Hot Water
   ├── Water Tank
   └── Flush

2. Bluetooth
   ├── Machine
   └── Scale

3. Calibration
   ├── Default load settings
   ├── Refill Kit
   ├── Voltage
   ├── Fan
   ├── Stop at weight
   ├── Slow start
   └── Steam

4. Machine
   ├── Fan Threshold
   └── USB Charger Mode

5. Maintenance
   ├── Machine Descaling
   └── Transport mode

6. Skin
   └── Theme

7. Language
   └── Select Language

8. Extensions
   ├── Visualizer
   └── Extension 2

9. Miscellaneous
   ├── Rea settings
   ├── Brightness
   ├── App Version
   ├── Units Settings
   ├── Font Size
   ├── Resolution
   ├── Smart Charging
   ├── Screen Saver
   └── Machine Advanced Settings

10. Updates
    ├── Firmware Update
    └── App Update

11. User Manual
    ├── Online Help
    └── Tutorials
```

---

## Phase 5: Add Settings Tree Data Structure

### Step 5.1: Create Settings Tree Object

Add this JavaScript object after the `state` declaration:

```javascript
const settingsTree = {
    'quickadjustments': {
        name: 'Quick Adjustments',
        subcategories: [
            { id: 'flowmultiplier', name: 'Flow Multiplier', settingsCategory: 'flowmultiplier' },
            { id: 'steam', name: 'Steam', settingsCategory: 'steam' },
            { id: 'hotwater', name: 'Hot Water', settingsCategory: 'hotwater' },
            { id: 'watertank', name: 'Water Tank', settingsCategory: 'watertank' },
            { id: 'flush', name: 'Flush', settingsCategory: 'flush' }
        ]
    },
    'bluetooth': {
        name: 'Bluetooth',
        subcategories: [
            { id: 'ble_machine', name: 'Machine', settingsCategory: 'ble_machine' },
            { id: 'ble_scale', name: 'Scale', settingsCategory: 'ble_scale' }
        ]
    },
    'calibration': {
        name: 'Calibration',
        subcategories: [
            { id: 'defaultloadsettings', name: 'Default load settings', settingsCategory: 'calibration' },
            { id: 'refillkit', name: 'Refill Kit', settingsCategory: 'refillkit' },
            { id: 'voltage', name: 'Voltage', settingsCategory: 'voltage' },
            { id: 'fan', name: 'Fan', settingsCategory: 'fan' },
            { id: 'stopatweight', name: 'Stop at weight', settingsCategory: 'stopatweight' },
            { id: 'slowstart', name: 'Slow start', settingsCategory: 'slowstart' },
            { id: 'steam', name: 'Steam', settingsCategory: 'steam' }
        ]
    },
    'machine': {
        name: 'Machine',
        subcategories: [
            { id: 'fanthreshold', name: 'Fan Threshold', settingsCategory: 'fanthreshold' },
            { id: 'usbchargermode', name: 'USB Charger Mode', settingsCategory: 'usbchargermode' }
        ]
    },
    'maintenance': {
        name: 'Maintenance',
        subcategories: [
            { id: 'machinedescaling', name: 'Machine Descaling', settingsCategory: 'maintenance' },
            { id: 'transportmode', name: 'Transport mode', settingsCategory: 'transportmode' }
        ]
    },
    'skin': {
        name: 'Skin',
        subcategories: [
            { id: 'theme', name: 'Theme', settingsCategory: 'appearance' }
        ]
    },
    'language': {
        name: 'Language',
        subcategories: [
            { id: 'selectlanguage', name: 'Select Language', settingsCategory: 'language' }
        ]
    },
    'extensions': {
        name: 'Extensions',
        subcategories: [
            { id: 'visualizer', name: 'Visualizer', settingsCategory: 'extensions' },
            { id: 'extension2', name: 'Extension 2', settingsCategory: 'extensions' }
        ]
    },
    'miscellaneous': {
        name: 'Miscellaneous',
        subcategories: [
            { id: 'reasettings', name: 'Rea settings', settingsCategory: 'rea' },
            { id: 'brightness', name: 'Brightness', settingsCategory: 'misc' },
            { id: 'appversion', name: 'App Version', settingsCategory: 'misc' },
            { id: 'unitssettings', name: 'Units Settings', settingsCategory: 'language' },
            { id: 'fontsize', name: 'Font Size', settingsCategory: 'appearance' },
            { id: 'resolution', name: 'Resolution', settingsCategory: 'appearance' },
            { id: 'smartcharging', name: 'Smart Charging', settingsCategory: 'de1' },
            { id: 'screensaver', name: 'Screen Saver', settingsCategory: 'misc' },
            { id: 'machineadvancedsettings', name: 'Machine Advanced Settings', settingsCategory: 'de1advanced' }
        ]
    },
    'updates': {
        name: 'Updates',
        subcategories: [
            { id: 'firmwareupdate', name: 'Firmware Update', settingsCategory: 'updates' },
            { id: 'appupdate', name: 'App Update', settingsCategory: 'updates' }
        ]
    },
    'usermanual': {
        name: 'User Manual',
        subcategories: [
            { id: 'onlinehelp', name: 'Online Help', settingsCategory: 'help' },
            { id: 'tutorials', name: 'Tutorials', settingsCategory: 'help' }
        ]
    }
};

let activeSettingsCategory = null;
```

---

## Phase 6: Update CSS for Two-Panel Layout

### Step 6.1: Add Navigation Panel CSS

Add these new CSS classes after the existing styles:

```css
/* ============================================
   Two-Panel Navigation Layout
   ============================================ */
.settings-layout {
    display: flex;
    height: calc(100vh - 150px);
    overflow: hidden;
}

/* Left Panel */
.left-panel {
    width: 400px;
    min-width: 300px;
    max-width: 600px;
    display: flex;
    flex-direction: column;
    border-right: 2px solid var(--low-contrast-white);
    background: var(--box-color);
    overflow: hidden;
}

/* Search Bar */
.search-container {
    padding: 20px;
    border-bottom: 2px solid var(--low-contrast-white);
}

.settings-search-input {
    width: 100%;
    padding: 12px 12px 12px 48px;
    border-radius: 8px;
    border: 2px solid var(--low-contrast-white);
    background: var(--profileselectorbg);
    color: var(--text-primary);
    font-size: 16px;
    font-family: 'Inter', sans-serif;
    position: relative;
}

.settings-search-input:focus {
    outline: none;
    border-color: var(--mimoja-blue);
    box-shadow: 0 0 0 2px var(--mimoja-blue);
}

/* Navigation Container */
.navigation-container {
    display: flex;
    flex: 1;
    overflow: hidden;
}

/* Main Categories Panel */
.main-categories-panel {
    width: 250px;
    min-width: 200px;
    overflow-y: auto;
    padding: 10px;
    background: var(--box-color);
}

.main-category-btn {
    width: 100%;
    text-align: left;
    padding: 12px 16px;
    margin-bottom: 4px;
    border-radius: 8px;
    font-size: 20px;
    font-weight: 600;
    font-family: 'Inter', sans-serif;
    color: var(--text-secondary);
    background: transparent;
    border: none;
    cursor: pointer;
    transition: all 0.2s;
}

.main-category-btn:hover {
    color: var(--white);
    background: #2c4a7a;
}

.main-category-btn.active {
    color: var(--white);
    background: #2c4a7a;
}

/* Subcategories Panel */
.subcategories-panel {
    width: 200px;
    min-width: 150px;
    overflow-y: auto;
    padding: 10px;
    background: var(--box-color);
    border-left: 1px solid var(--low-contrast-white);
}

.subcategory-btn {
    width: 100%;
    text-align: left;
    padding: 10px 14px;
    margin-bottom: 4px;
    border-radius: 6px;
    font-size: 16px;
    font-family: 'Inter', sans-serif;
    color: var(--text-secondary);
    background: transparent;
    border: none;
    cursor: pointer;
    transition: all 0.2s;
}

.subcategory-btn:hover {
    color: var(--white);
    background: #2c4a7a;
}

.subcategory-btn.active {
    background: var(--mimoja-blue);
    color: var(--white);
}

/* Panel Resizer */
.panel-resizer {
    width: 4px;
    background: var(--low-contrast-white);
    cursor: col-resize;
    transition: background 0.2s;
}

.panel-resizer:hover {
    background: var(--mimoja-blue);
}

/* Right Panel - Content Area */
.right-panel {
    flex: 1;
    overflow-y: auto;
    padding: 30px;
    background: var(--profile-button-background-color);
}

/* Scrollbar Styling */
.main-categories-panel::-webkit-scrollbar,
.subcategories-panel::-webkit-scrollbar,
.right-panel::-webkit-scrollbar {
    width: 8px;
}

.main-categories-panel::-webkit-scrollbar-track,
.subcategories-panel::-webkit-scrollbar-track,
.right-panel::-webkit-scrollbar-track {
    background: var(--box-color);
}

.main-categories-panel::-webkit-scrollbar-thumb,
.subcategories-panel::-webkit-scrollbar-thumb,
.right-panel::-webkit-scrollbar-thumb {
    background: var(--low-contrast-white);
    border-radius: 4px;
}

.main-categories-panel::-webkit-scrollbar-thumb:hover,
.subcategories-panel::-webkit-scrollbar-thumb:hover,
.right-panel::-webkit-scrollbar-thumb:hover {
    background: var(--mimoja-blue);
}
```

---

## Phase 7: Update HTML Structure

### Step 7.1: Replace Main Content Area

Replace the current `<main id="main-content">` section with:

```html
<div class="settings-layout">
    <!-- Left Panel -->
    <div class="left-panel">
        <!-- Search Bar -->
        <div class="search-container">
            <div style="position: relative;">
                <input type="text" 
                       id="settings-search" 
                       placeholder="Search settings..." 
                       class="settings-search-input"
                       aria-label="Search settings">
                <svg class="search-icon" style="position: absolute; left: 16px; top: 50%; transform: translateY(-50%); width: 20px; height: 20px; color: var(--text-primary);" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </div>
        </div>

        <!-- Navigation Container -->
        <div class="navigation-container">
            <!-- Main Categories -->
            <div class="main-categories-panel" id="main-categories-panel" aria-label="Settings Categories">
                <!-- Dynamically populated -->
            </div>

            <!-- Resizer -->
            <div class="panel-resizer" id="main-resizer" aria-hidden="true"></div>

            <!-- Subcategories -->
            <div class="subcategories-panel" id="subcategories-panel" aria-label="Subcategories">
                <!-- Dynamically populated -->
            </div>
        </div>
    </div>

    <!-- Resizer -->
    <div class="panel-resizer" id="left-panel-resizer" aria-hidden="true"></div>

    <!-- Right Panel - Content Area -->
    <div class="right-panel" id="settings-content-area" role="main" aria-label="Settings Content">
        <!-- Settings content will be dynamically loaded here -->
        <div class="flex flex-col items-center justify-center h-full text-center p-8">
            <p class="text-[var(--text-primary)] text-[28px]">Select a category from the menu</p>
        </div>
    </div>
</div>
```

---

## Phase 8: Add JavaScript Functions

### Step 8.1: Navigation Functions

Add these functions after the `generateSettingsHTML` function:

```javascript
// Render main categories
function renderMainCategories() {
    const panel = document.getElementById('main-categories-panel');
    if (!panel) return;

    let html = '<nav><ul style="list-style: none; padding: 0; margin: 0;">';
    
    for (const [key, category] of Object.entries(settingsTree)) {
        html += `
            <li>
                <button class="main-category-btn ${key === 'quickadjustments' ? 'active' : ''}" 
                        data-category="${key}"
                        onclick="handleMainCategoryClick('${key}', this)">
                    ${category.name}
                </button>
            </li>
        `;
    }
    
    html += '</ul></nav>';
    panel.innerHTML = html;
}

// Handle main category click
function handleMainCategoryClick(categoryKey, button) {
    // Update active state
    document.querySelectorAll('.main-category-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    button.classList.add('active');

    // Render subcategories
    renderSubcategories(categoryKey);
}

// Render subcategories
function renderSubcategories(categoryKey) {
    const panel = document.getElementById('subcategories-panel');
    const category = settingsTree[categoryKey];
    
    if (!panel || !category) return;

    let html = '<ul style="list-style: none; padding: 0; margin: 0;">';
    
    category.subcategories.forEach((subcat, index) => {
        html += `
            <li>
                <button class="subcategory-btn ${index === 0 ? 'active' : ''}" 
                        data-category="${subcat.settingsCategory}"
                        onclick="handleSubcategoryClick('${subcat.settingsCategory}', this, '${subcat.name}')">
                    ${subcat.name}
                </button>
            </li>
        `;
    });
    
    html += '</ul>';
    panel.innerHTML = html;

    // Auto-click first subcategory
    const firstBtn = panel.querySelector('.subcategory-btn');
    if (firstBtn) {
        firstBtn.click();
    }
}

// Handle subcategory click
function handleSubcategoryClick(settingsCategory, button, displayName) {
    // Update active state
    document.querySelectorAll('.subcategory-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    button.classList.add('active');

    // Render settings content
    renderSettingsContent(settingsCategory, displayName);
}

// Render settings content based on category
function renderSettingsContent(category, displayName) {
    const contentArea = document.getElementById('settings-content-area');
    if (!contentArea) return;

    // Show loading state
    contentArea.innerHTML = `
        <div class="settings-loading-state">
            <div class="settings-page-title">
                <p>${displayName}</p>
            </div>
            <div class="text-[var(--text-primary)] p-4 text-[24px] text-center w-full">Loading settings...</div>
        </div>
    `;

    // Here you would call the appropriate render function
    // For now, we'll use a placeholder
    setTimeout(() => {
        contentArea.innerHTML = `
            <div class="settings-flex-container">
                <div class="settings-page-title">
                    <p>${displayName}</p>
                </div>
                <div class="settings-divider"><hr /></div>
                <div class="setting-description">
                    <p>Settings content for ${displayName} will be displayed here.</p>
                </div>
            </div>
        `;
    }, 100);
}

// Initialize resizable panels
function initResizablePanels() {
    const mainResizer = document.getElementById('main-resizer');
    const leftPanelResizer = document.getElementById('left-panel-resizer');
    const mainCategoriesPanel = document.getElementById('main-categories-panel');
    const subcategoriesPanel = document.getElementById('subcategories-panel');
    const leftPanel = document.querySelector('.left-panel');
    const rightPanel = document.getElementById('settings-content-area');

    // Main categories / Subcategories resizer
    if (mainResizer && mainCategoriesPanel && subcategoriesPanel) {
        let isDragging = false;

        mainResizer.addEventListener('mousedown', (e) => {
            isDragging = true;
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';

            const startX = e.clientX;
            const startMainWidth = mainCategoriesPanel.offsetWidth;
            const startSubWidth = subcategoriesPanel.offsetWidth;

            function doDrag(e) {
                if (!isDragging) return;
                const dx = e.clientX - startX;
                const newMainWidth = startMainWidth + dx;
                const newSubWidth = startSubWidth - dx;

                if (newMainWidth > 150 && newSubWidth > 100) {
                    mainCategoriesPanel.style.width = `${newMainWidth}px`;
                    subcategoriesPanel.style.width = `${newSubWidth}px`;
                }
            }

            function stopDrag() {
                isDragging = false;
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
                document.removeEventListener('mousemove', doDrag);
                document.removeEventListener('mouseup', stopDrag);
            }

            document.addEventListener('mousemove', doDrag);
            document.addEventListener('mouseup', stopDrag);
        });
    }

    // Left panel / Right panel resizer
    if (leftPanelResizer && leftPanel && rightPanel) {
        let isDragging = false;

        leftPanelResizer.addEventListener('mousedown', (e) => {
            isDragging = true;
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';

            const startX = e.clientX;
            const startLeftWidth = leftPanel.offsetWidth;

            function doDrag(e) {
                if (!isDragging) return;
                const dx = e.clientX - startX;
                const newLeftWidth = startLeftWidth + dx;

                if (newLeftWidth > 300 && newLeftWidth < 800) {
                    leftPanel.style.width = `${newLeftWidth}px`;
                }
            }

            function stopDrag() {
                isDragging = false;
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
                document.removeEventListener('mousemove', doDrag);
                document.removeEventListener('mouseup', stopDrag);
            }

            document.addEventListener('mousemove', doDrag);
            document.addEventListener('mouseup', stopDrag);
        });
    }
}

// Initialize search functionality
function initSettingsSearch() {
    const searchInput = document.getElementById('settings-search');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();
        
        if (searchTerm === '') {
            // Restore original navigation
            renderMainCategories();
            return;
        }

        // Filter and search
        const results = [];
        
        for (const [key, category] of Object.entries(settingsTree)) {
            // Check if main category matches
            if (category.name.toLowerCase().includes(searchTerm)) {
                results.push({ type: 'category', key, name: category.name });
            }
            
            // Check subcategories
            category.subcategories.forEach(subcat => {
                if (subcat.name.toLowerCase().includes(searchTerm)) {
                    results.push({ 
                        type: 'subcategory', 
                        categoryKey: key, 
                        subcatKey: subcat.id,
                        settingsCategory: subcat.settingsCategory,
                        name: subcat.name 
                    });
                }
            });
        }

        // Display search results
        displaySearchResults(results, searchTerm);
    });
}

// Display search results
function displaySearchResults(results, searchTerm) {
    const mainPanel = document.getElementById('main-categories-panel');
    const subPanel = document.getElementById('subcategories-panel');
    
    if (!mainPanel || !subPanel) return;

    if (results.length === 0) {
        mainPanel.innerHTML = '<p style="padding: 20px; color: var(--text-secondary);">No results found</p>';
        subPanel.innerHTML = '';
        return;
    }

    // Group results by category
    const categoryResults = {};
    results.forEach(result => {
        if (result.type === 'category') {
            categoryResults[result.key] = { name: result.name, subcategories: [] };
        } else if (result.type === 'subcategory') {
            if (!categoryResults[result.categoryKey]) {
                categoryResults[result.categoryKey] = { 
                    name: settingsTree[result.categoryKey].name, 
                    subcategories: [] 
                };
            }
            categoryResults[result.categoryKey].subcategories.push(result);
        }
    });

    // Render main categories with results
    let mainHtml = '<nav><ul style="list-style: none; padding: 0; margin: 0;">';
    for (const [key, data] of Object.entries(categoryResults)) {
        const highlightedName = highlightMatch(data.name, searchTerm);
        mainHtml += `
            <li>
                <button class="main-category-btn active" 
                        data-category="${key}"
                        onclick="handleMainCategoryClick('${key}', this)">
                    ${highlightedName}
                </button>
            </li>
        `;
    }
    mainHtml += '</ul></nav>';
    mainPanel.innerHTML = mainHtml;

    // Auto-select first category's subcategories
    const firstCategory = Object.keys(categoryResults)[0];
    if (firstCategory && categoryResults[firstCategory].subcategories.length > 0) {
        let subHtml = '<ul style="list-style: none; padding: 0; margin: 0;">';
        categoryResults[firstCategory].subcategories.forEach(subcat => {
            const highlightedName = highlightMatch(subcat.name, searchTerm);
            subHtml += `
                <li>
                    <button class="subcategory-btn active" 
                            data-category="${subcat.settingsCategory}"
                            onclick="handleSubcategoryClick('${subcat.settingsCategory}', this, '${subcat.name}')">
                        ${highlightedName}
                    </button>
                </li>
            `;
        });
        subHtml += '</ul>';
        subPanel.innerHTML = subHtml;
    } else {
        subPanel.innerHTML = '';
    }
}

// Highlight matching text
function highlightMatch(text, searchTerm) {
    if (!searchTerm) return text;
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<mark style="background: #fef08a; color: #000; padding: 0 4px; border-radius: 2px;">$1</mark>');
}
```

### Step 8.2: Initialize Navigation on Page Load

Add this script at the end of the HTML, before `</body>`:

```html
<script>
    // Initialize navigation when DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
        renderMainCategories();
        initResizablePanels();
        initSettingsSearch();
        
        // Auto-click first category
        const firstCategoryBtn = document.querySelector('.main-category-btn');
        if (firstCategoryBtn) {
            firstCategoryBtn.click();
        }
    });
</script>
```

---

## Phase 9: Map Existing Settings to Tree Structure

### Step 9.1: Update renderSettingsContent Function

Replace the placeholder `renderSettingsContent` function with actual rendering logic that maps each category to the appropriate settings data:

```javascript
function renderSettingsContent(category, displayName) {
    const contentArea = document.getElementById('settings-content-area');
    if (!contentArea) return;

    let content = '';

    switch(category) {
        case 'flowmultiplier':
            content = renderFlowMultiplierSettings(reaSettings);
            break;
        case 'steam':
            content = renderSteamSettings(de1Settings);
            break;
        case 'hotwater':
            content = renderHotWaterSettings(de1Settings);
            break;
        case 'watertank':
            content = renderWaterTankSettings(de1Settings);
            break;
        case 'flush':
            content = renderFlushSettingsForm(de1Settings);
            break;
        case 'ble_machine':
            content = renderBluetoothMachineSettings();
            break;
        case 'ble_scale':
            content = renderBluetoothScaleSettings();
            break;
        case 'fanthreshold':
            content = renderFanThresholdSettings(de1Settings);
            break;
        case 'usbchargermode':
            content = renderUsbChargerModeSettings(de1Settings);
            break;
        case 'de1advanced':
            content = renderDe1AdvancedSettingsForm(de1AdvancedSettings);
            break;
        case 'rea':
            content = renderReaSettingsForm(reaSettings);
            break;
        case 'appearance':
            content = renderSkinSettings();
            break;
        case 'language':
            content = renderLanguageSettings();
            break;
        case 'extensions':
            content = renderExtensionsSettings();
            break;
        case 'updates':
            content = renderUpdatesSettings();
            break;
        case 'help':
            content = renderUserManualSettings();
            break;
        default:
            content = `<div class="settings-flex-container">
                <div class="settings-page-title"><p>${displayName}</p></div>
                <div class="setting-description">
                    <p>Settings content coming soon...</p>
                </div>
            </div>`;
    }

    contentArea.innerHTML = content;
}
```

---

## Testing Checklist for Navigation Tree

### Navigation Testing

- [ ] Main categories render correctly (11 categories)
- [ ] Subcategories update when clicking main categories
- [ ] Settings content loads when clicking subcategories
- [ ] Active states highlight correctly (blue for active, gray for inactive)
- [ ] First subcategory auto-selects when clicking main category

### Resizer Testing

- [ ] Main categories / Subcategories resizer works smoothly
- [ ] Left panel / Right panel resizer works smoothly
- [ ] Minimum widths are enforced (150px for main, 100px for sub)
- [ ] Cursor changes to col-resize on hover

### Search Testing

- [ ] Search filters categories and subcategories
- [ ] Matching text is highlighted in yellow
- [ ] Empty search restores original navigation
- [ ] "No results found" shows when no matches

### Accessibility Testing

- [ ] Keyboard navigation works (Tab, Enter, Arrow keys)
- [ ] ARIA labels are present on all interactive elements
- [ ] Screen readers can navigate the tree structure
- [ ] Focus states are visible

### Responsive Testing

- [ ] Layout works at 1920px width (default)
- [ ] Layout works at 1280px width
- [ ] Panels can be resized to fit smaller screens
- [ ] No horizontal scrolling

---

## Updated Estimated Time

- **Phase 1-4 (Basic UI):** ~2 hours (already completed)
- **Phase 5 (Data Structure):** 30 minutes
- **Phase 6 (CSS):** 45 minutes
- **Phase 7 (HTML):** 30 minutes
- **Phase 8 (JavaScript):** 1.5 hours
- **Phase 9 (Mapping):** 1 hour
- **Testing:** 1 hour

**Total: ~6.5 hours**

---

## Updated Success Criteria

- [ ] UI matches settings.js design exactly
- [ ] Two-panel navigation tree works correctly
- [ ] All 11 main categories display
- [ ] Subcategories update dynamically
- [ ] Settings content loads correctly
- [ ] Panel resizers work smoothly
- [ ] Search filters and highlights results
- [ ] No external CSS dependencies
- [ ] No theme toggle visible
- [ ] No language settings visible
- [ ] All components are reusable
- [ ] Dark mode works via system preference only
- [ ] Keyboard navigation works
- [ ] ARIA labels present for accessibility
