export function renderSettingsPageStyles() {
  return `<style>
        /* ============================================
           Base Styles - Viewport Setup
           ============================================ */
        html, body {
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
        }

        /* ============================================
           Design System Variables
           ============================================ */
        :root {
            /* Core colors from Design System */
            --mimoja-blue: #385A92;
            --mimoja-blue-v2: #415996;
            --white: #FFFFFF;
            --button-grey: #EDEDED;
            --low-contrast-white: #959595;
            --success-green: #0CA581;
            --error-red: #e74c3c;
            --status-red-color: #DA515E;

            /* Theme-aware colors (light mode default) */
            --profile-button-outline-color: #c5cdda;
            --profile-button-background-color: #FFFFFF;
            --box-color: #f8f9fb;
            --profileselectorbg: #FFFFFF;
            --text-primary: #121212;
            --text-secondary: #51639c;
            --preset-label-selected-color: #777777;
            --status-green-color: #0CA581;

            /* Typography */
            --font-family-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            --font-family-mono: 'NotoSansMono', monospace;
        }

        /* Settings page specific layout styles */
        body {
            background: var(--bgmain-color);
            padding: 20px;
            line-height: 1.6;
            max-width: 1920px;
            max-height: 1200px;
            margin: 0 auto;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        h1 {
            color: var(--text-primary);
            margin-bottom: 10px;
            font-size: 2em;
            font-weight: 600;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }
        .timestamp {
            color: var(--text-primary);
            font-size: 0.9em;
        }
        .section {
            background: var(--profile-button-background-color);
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .section h2 {
            color: var(--text-primary);
            margin-bottom: 15px;
            font-size: 1.5em;
            font-weight: 600;
            border-bottom: 2px solid var(--mimoja-blue);
            padding-bottom: 10px;
        }
        .settings-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 15px;
        }
        .setting-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px;
            background: var(--box-color);
            border-radius: 6px;
            border-left: 3px solid var(--mimoja-blue);
        }
        .setting-label {
            font-weight: 600;
            color: var(--text-primary);
            flex: 1;
        }
        .setting-control {
            display: flex;
            gap: 8px;
            align-items: center;
        }
        input[type="number"], input[type="text"], select {
            border: 2px solid var(--low-contrast-white);
            border-radius: 4px;
            font-family: 'NotoSansMono', monospace;
            font-size: 14px;
            background: var(--profileselectorbg);
            color: var(--text-primary);
        }
        input[type="number"]:focus, input[type="text"]:focus, select:focus {
            outline: 3px solid var(--mimoja-blue);
            outline-offset: 2px;
            border-color: var(--mimoja-blue);
        }
        select {
            width: 140px;
            cursor: pointer;
        }
        .btn {
            padding: 6px 12px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            transition: background 0.2s, transform 0.1s;
            font-family: 'Inter', sans-serif;
        }
        .btn:focus {
            outline: 3px solid var(--text-primary);
            outline-offset: 2px;
        }
        .btn:active {
            transform: translateY(1px);
        }
        .btn-primary {
            background: var(--mimoja-blue);
            color: var(--white);
        }
        .btn-primary:hover, .btn-primary:focus {
            background: var(--mimoja-blue-v2);
        }
        .btn-refresh {
            background: var(--status-green-color);
            color: white;
        }
        .btn-refresh:hover, .btn-refresh:focus {
            background: #0a8a6c;
        }
        .skip-link {
            position: absolute;
            top: -40px;
            left: 0;
            background: var(--text-primary);
            color: var(--white);
            padding: 8px 16px;
            text-decoration: none;
            border-radius: 0 0 4px 0;
            z-index: 100;
        }
        .skip-link:focus {
            top: 0;
        }
        .error {
            background: #fee;
            border-left-color: var(--status-red-color);
            color: #c0392b;
            padding: 12px;
            border-radius: 6px;
        }
        .readonly {
            color: var(--preset-label-selected-color);
            font-family: 'NotoSansMono', monospace;
        }
        .success-toast,
        .error-toast {
            position: fixed;
            top: 20px;
            right: 20px;
            color: white;
            padding: 15px 20px;
            border-radius: 6px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            animation: slideIn 0.3s ease-out;
            z-index: 1000;
        }
        .success-toast { background: var(--status-green-color); }
        .error-toast { background: var(--status-red-color); }
        @keyframes slideIn {
            from { transform: translateX(400px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        .status-indicator {
            display: inline-block;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            margin-right: 8px;
        }
        .status-ok { background: var(--status-green-color); }
        .status-error { background: var(--status-red-color); }
        .visually-hidden {
            position: absolute;
            left: -10000px;
            width: 1px;
            height: 1px;
            overflow: hidden;
        }
        .settings-container {
            display: flex;
            flex-direction: column;
            gap: 60px;
            align-items: flex-start;
            position: relative;
            width: 100%;
            max-width: 100%;
            overflow-x: hidden;
        }
        .settings-flex-container {
            display: flex;
            flex-direction: column;
            gap: 60px;
            align-items: flex-start;
            position: relative;
            width: 100%;
            max-width: 100%;
            overflow-x: hidden;
            padding: 20px;
        }
        .settings-section-flex {
            display: flex;
            flex-direction: column;
            gap: 30px;
            align-items: flex-start;
            position: relative;
            width: 100%;
            max-width: 100%;
        }
        .settings-page-title {
            font-family: 'Inter', sans-serif;
            font-weight: 600;
            color: var(--text-primary);
            font-size: 36px;
            text-align: center;
            width: 100%;
            line-height: 1.2;
        }
        .settings-divider {
            width: 100%;
        }
        .settings-divider hr {
            border-top: 1px solid var(--low-contrast-white);
            width: 100%;
        }
        .setting-row-flex {
            display: flex;
            align-items: center;
            justify-content: space-between;
            position: relative;
            width: 100%;
            max-width: 885px;
        }
        .setting-row-flex-column {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: 20px;
            position: relative;
            width: 100%;
            max-width: 885px;
        }
        .setting-label-bold {
            font-family: 'Inter', sans-serif;
            font-weight: 700;
            color: var(--mimoja-blue);
            font-size: 30px;
            line-height: 1.2;
        }
        .setting-description {
            font-family: 'Inter', sans-serif;
            font-weight: 400;
            line-height: 1.4;
            position: relative;
            color: var(--text-primary);
            font-size: 24px;
            width: 100%;
            max-width: 100%;
            word-break: break-word;
        }
        .setting-control-flex {
            display: flex;
            gap: 12px;
            align-items: center;
            flex-wrap: wrap;
        }
        .settings-input-primary,
        .settings-input-wide {
            border: 2px solid var(--low-contrast-white);
            border-radius: 12px;
            background: var(--profileselectorbg);
            color: var(--text-primary);
            font-family: 'Inter', sans-serif;
            font-size: 20px;
            padding: 12px 16px;
        }
        .settings-input-primary {
            min-width: 120px;
        }
        .settings-input-wide {
            min-width: 220px;
        }
        .settings-btn-primary,
        .settings-btn-secondary,
        .settings-btn-danger,
        .settings-btn-wide {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border-radius: 22.5px;
            font-family: 'Inter', sans-serif;
            font-size: 20px;
            font-weight: 700;
            padding: 12px 24px;
            cursor: pointer;
            transition: background 0.2s, color 0.2s, transform 0.1s;
            border: 1px solid var(--mimoja-blue);
        }
        .settings-btn-primary {
            background: var(--mimoja-blue);
            color: var(--white);
        }
        .settings-btn-secondary,
        .settings-btn-wide {
            background: transparent;
            color: var(--mimoja-blue);
        }
        .settings-btn-danger {
            background: transparent;
            border-color: var(--status-red-color);
            color: var(--status-red-color);
        }
        .toggle-button-group {
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
        }
        .toggle-btn {
            border-radius: 22.5px;
            padding: 12px 24px;
            border: 1px solid var(--mimoja-blue);
            font-size: 18px;
            font-weight: 700;
            cursor: pointer;
            background: transparent;
            color: var(--mimoja-blue);
        }
        .toggle-btn.active {
            background: var(--mimoja-blue);
            color: var(--white);
        }
        .toggle-btn.inactive {
            background: transparent;
            color: var(--mimoja-blue);
        }
        .device-card {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: var(--profile-button-background-color);
            border: 1px solid var(--low-contrast-white);
            border-radius: 12px;
            padding: 16px;
            gap: 16px;
        }
        .device-info {
            display: flex;
            flex-direction: column;
            gap: 6px;
            flex: 1;
        }
        .device-header {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .device-name {
            font-size: 22px;
            font-weight: 700;
            color: var(--text-primary);
        }
        .device-detail {
            font-size: 16px;
            color: var(--text-secondary);
        }
        .btn-connect {
            border-radius: 18px;
            padding: 10px 18px;
            border: 1px solid var(--mimoja-blue);
            background: transparent;
            color: var(--mimoja-blue);
            font-weight: 700;
            cursor: pointer;
        }
        .toast-container {
            position: fixed;
            left: 50%;
            bottom: 20vh;
            transform: translateX(-50%);
            z-index: 1000;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 10px;
            pointer-events: none;
        }
        .modal-box {
            border-radius: 16px;
            padding: 24px;
        }
        .navigation-container {
            display: flex;
            flex: 1;
            overflow: hidden;
        }
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
        .main-category-btn:hover,
        .main-category-btn.active {
            color: var(--white);
            background: #2c4a7a;
        }
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
        .panel-resizer {
            width: 4px;
            background: var(--low-contrast-white);
            cursor: col-resize;
            transition: background 0.2s;
        }
        .panel-resizer:hover { background: var(--mimoja-blue); }
        .right-panel {
            flex: 1;
            overflow-y: auto;
            padding: 30px;
            background: var(--profile-button-background-color);
        }
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
    </style>`;
}

export function renderSettingsPageHead() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="REA Prime Settings Dashboard - Configure application and DE1 machine settings">
    <title>Settings</title>

    <link href="https://fonts.cdnfonts.com/css/noto-sans" rel="stylesheet">
    <link href="https://fonts.cdnfonts.com/css/inter" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/daisyui@5" rel="stylesheet" type="text/css" />

    ${renderSettingsPageStyles()}`;
}

export function renderSettingsPageLayout(timestamp = new Date().toLocaleString()) {
  return `</head>
<body class="max-w-[1920px] max-h-[1200px] mx-auto">
    <a href="#main-content" class="skip-link">Skip to main content</a>

    <div id="toast-container" class="toast-container"></div>

    <header class="relative flex justify-between items-center p-6 border-b border-base-300 bg-[var(--box-color)] h-[112px]">
        <h1 id="page-title" class="text-[28px] font-bold text-[var(--text-primary)] no-select" data-i18n-key="Settings">Settings</h1>
        <div class="flex items-center gap-[22px]">
            <button id="cancel-settings-btn" class="flex justify-center items-center min-h-0 w-[240px] h-[82.5px] px-[67.5px] py-[27px] border border-solid border-[var(--mimoja-blue)] text-[var(--mimoja-blue)] rounded-[67.5px] font-bold text-[24px]" data-i18n-key="Cancel" onclick="window.closeSettings()">CANCEL</button>
            <button id="save-settings-btn" class="bg-[var(--mimoja-blue)] text-white min-h-0 w-[240px] h-[82.5px] px-[67.5px] py-[27px] font-bold text-[24px] rounded-[67.5px]" data-i18n-key="Save" onclick="saveAllSettings()">SAVE</button>
        </div>
        <button id="fullscreen-toggle-btn" title="Toggle fullscreen" class="absolute -top-1 -right-1 w-12 h-12 flex items-center justify-center text-[var(--mimoja-blue)]" aria-label="Toggle Fullscreen" onclick="window.toggleFullscreen()">
            <svg class="enter-fullscreen-icon" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>
            <svg class="exit-fullscreen-icon" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style="display: none;"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/></svg>
        </button>
    </header>

    <div class="timestamp flex items-center gap-2 px-6 py-4" role="status" aria-live="polite" aria-atomic="true">
        <span class="status-indicator status-ok" role="img" aria-label="Settings loaded successfully"></span>
        Last updated: <span id="timestamp">${timestamp}</span>
    </div>

    <div class="flex h-[1088px]">
        <div id="left-panel" class="w-[796px] h-full flex flex-col border-r border-base-300 bg-[var(--box-color)]">
            <div class="p-6 border-b border-base-300">
                <div class="relative">
                    <input type="text" id="settings-search" placeholder="Search settings..." class="w-full p-3 pl-12 rounded-lg border border-[var(--border-color)] bg-[var(--profile-button-background-color)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--mimoja-blue)]" aria-label="Search settings">
                    <svg class="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[var(--text-primary)]" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
            </div>

            <div class="flex flex-grow overflow-hidden" id="settings-navigation-container">
                <div id="main-categories-panel" class="h-full overflow-y-auto p-2" style="width: 405px;" aria-label="Settings Categories"></div>
                <div id="sub-categories-separator" class="cursor-col-resize w-2 bg-gray-400 hover:bg-blue-500 h-full" aria-hidden="true"></div>
                <div id="sub-categories-panel" class="h-full overflow-y-auto p-2" style="width: 270px; background-color: var(--box-color-alt);" aria-label="Subcategories"></div>
            </div>
        </div>

        <div id="separator" class="cursor-col-resize w-2 bg-gray-300 hover:bg-blue-500 transition-colors z-10 h-full" aria-hidden="true"></div>

        <div id="right-panel" class="w-[1124px] flex-grow h-full flex flex-col bg-[var(--profile-button-background-color)] p-6 overflow-y-auto" role="main" aria-label="Settings Content">
            <div id="settings-content-area" class="flex-grow">
                <div class="flex flex-col items-center justify-center h-full text-center p-8">
                    <p class="text-[var(--text-primary)] text-[28px]" aria-live="polite">Loading Settings...</p>
                </div>
            </div>
        </div>
    </div>`;
}
