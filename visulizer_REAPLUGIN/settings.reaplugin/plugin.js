var createPlugin = (function() {
  "use strict";
  const API_BASE_URL = "http://localhost:8080/api/v1";
  const STORAGE_KEYS = {
    presenceActiveHours: "settingsPresenceActiveHours"
  };
  const DEFAULT_REFRESH_INTERVAL = 5;
  const DEFAULT_MAIN_CATEGORY_KEY = "quickadjustments";
  const DEFAULT_DEVICE_STATE_CACHE = {
    devices: [],
    scanning: false,
    initialized: false
  };
  const INITIAL_SETTINGS_CACHE = {
    rea: null,
    de1: null,
    de1Advanced: null,
    appInfo: null,
    machineInfo: null,
    reaLoading: false,
    de1Loading: false,
    de1AdvancedLoading: false,
    appInfoLoading: false,
    machineInfoLoading: false,
    reaError: null,
    de1Error: null,
    de1AdvancedError: null,
    appInfoError: null,
    machineInfoError: null
  };
  const settingsTree = {
    quickadjustments: {
      name: "1. Quick Adjustments",
      subcategories: [
        { id: "flowmultiplier", name: "Flow Multiplier", settingsCategory: "flowmultiplier" },
        { id: "steam", name: "Steam", settingsCategory: "steam" },
        { id: "hotwater", name: "Hot Water", settingsCategory: "hotwater" },
        { id: "watertank", name: "Water Tank", settingsCategory: "watertank" },
        { id: "flush", name: "Flush", settingsCategory: "flush" }
      ]
    },
    bluetooth: {
      name: "2. Bluetooth",
      subcategories: [
        { id: "ble_machine", name: "1. Machine", settingsCategory: "ble_machine" },
        { id: "ble_scale", name: "2. Scale", settingsCategory: "ble_scale" }
      ]
    },
    calibration: {
      name: "3. Calibration",
      subcategories: [
        { id: "defaultloadsettings", name: "Default load settings", settingsCategory: "calibration" },
        { id: "refillkit", name: "Refill Kit", settingsCategory: "refillkit" },
        { id: "voltage", name: "Voltage", settingsCategory: "voltage" },
        { id: "fan", name: "Fan", settingsCategory: "fan" },
        { id: "stopatweight", name: "Stop at weight", settingsCategory: "stopatweight" },
        { id: "slowstart", name: "Slow start", settingsCategory: "slowstart" },
        { id: "steam_cal", name: "Steam", settingsCategory: "steam" }
      ]
    },
    machine: {
      name: "4. Machine",
      subcategories: [
        { id: "fanthreshold", name: "Fan Threshold", settingsCategory: "fanthreshold" },
        { id: "usbchargermode", name: "USB Charger Mode", settingsCategory: "usbchargermode" }
      ]
    },
    maintenance: {
      name: "5. Maintenance",
      subcategories: [
        { id: "machinedescaling", name: "Machine Descaling", settingsCategory: "maintenance" },
        { id: "transportmode", name: "Transport mode", settingsCategory: "transportmode" }
      ]
    },
    skin: {
      name: "6. Skin",
      subcategories: [
        { id: "skin1", name: "Theme", settingsCategory: "appearance" }
      ]
    },
    language: {
      name: "7. Language",
      subcategories: [
        { id: "selectlanguage", name: "Select Language", settingsCategory: "language" }
      ]
    },
    extensions: {
      name: "8. Extensions",
      subcategories: [
        { id: "extention1", name: "Visualizer", settingsCategory: "extensions" },
        { id: "extention2", name: "Extention 2", settingsCategory: "extensions" }
      ]
    },
    miscellaneous: {
      name: "9. Miscellaneous",
      subcategories: [
        { id: "reasettings", name: "Rea settings", settingsCategory: "rea" },
        { id: "brightness", name: "Brightness", settingsCategory: "brightness" },
        { id: "wakelock", name: "Wake Lock", settingsCategory: "wakelock" },
        { id: "presence", name: "Presence Detection", settingsCategory: "presence" },
        { id: "appversion", name: "App Version", settingsCategory: "updates" },
        { id: "unitssettings", name: "Units Settings", settingsCategory: "language" },
        { id: "fontsize", name: "Font Size", settingsCategory: "appearance" },
        { id: "resolution", name: "Resolution", settingsCategory: "appearance" },
        { id: "smartcharging", name: "Smart Charging", settingsCategory: "de1" },
        { id: "screensaver", name: "Screen Saver", settingsCategory: "misc" },
        { id: "machineadvancedsettings", name: "Machine Advanced Settings", settingsCategory: "de1advanced" }
      ]
    },
    updates: {
      name: "10. Updates",
      subcategories: [
        { id: "firmwareupdate", name: "Firmware Update", settingsCategory: "updates" },
        { id: "appupdate", name: "App Update", settingsCategory: "updates" }
      ]
    },
    usermanual: {
      name: "11. User Manual",
      subcategories: [
        { id: "onlinehelp", name: "Online Help", settingsCategory: "help" },
        { id: "tutorials", name: "Tutorials", settingsCategory: "help" }
      ]
    }
  };
  function createInitialSettingsCache() {
    return { ...INITIAL_SETTINGS_CACHE };
  }
  function getBrowserBootstrapData({
    reaSettings,
    de1Settings,
    de1AdvancedSettings,
    webUISkins,
    calibrationSettings,
    presenceSettings,
    appInfo,
    machineInfo,
    activeSettingsCategory,
    activeMainCategoryKey
  }) {
    return {
      settingsTree,
      reaSettings: reaSettings || {},
      de1Settings: de1Settings || {},
      de1AdvancedSettings: de1AdvancedSettings || {},
      webUISkins: webUISkins || [],
      calibrationSettings: calibrationSettings || {},
      presenceSettings: presenceSettings || {},
      appInfo: appInfo || null,
      machineInfo: machineInfo || null,
      activeSettingsCategory,
      activeMainCategoryKey,
      apiBaseUrl: API_BASE_URL,
      storageKeys: {
        presenceActiveHours: STORAGE_KEYS.presenceActiveHours
      },
      settingsCache: createInitialSettingsCache(),
      defaultDeviceStateCache: { ...DEFAULT_DEVICE_STATE_CACHE }
    };
  }
  function renderSettingsPageStyles() {
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
  function renderSettingsPageHead() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="REA Prime Settings Dashboard - Configure application and DE1 machine settings">
    <title>Settings</title>

    <link href="https://fonts.cdnfonts.com/css/noto-sans" rel="stylesheet">
    <link href="https://fonts.cdnfonts.com/css/inter" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"><\/script>
    <link href="https://cdn.jsdelivr.net/npm/daisyui@5" rel="stylesheet" type="text/css" />

    ${renderSettingsPageStyles()}`;
  }
  function renderSettingsPageLayout(timestamp = (/* @__PURE__ */ new Date()).toLocaleString()) {
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
  function renderVisualizerSettingsForm() {
    return '\n                        <div id="visualizer-form-container" class="w-full mt-6">\n                            <div class="grid grid-cols-4">\n                                <div class="col-span-3 flex flex-col gap-6">\n                                    <div class="flex flex-col gap-2">\n                                        <label for="visualizer-username" class="text-[var(--text-primary)] text-[24px]">Username:</label>\n                                        <input type="text" id="visualizer-username" class="w-full max-w-[500px] p-3 rounded-lg border border-[var(--border-color)] bg-[var(--profile-button-background-color)] text-[var(--text-primary)] text-[24px] focus:outline-none focus:ring-2 focus:ring-[var(--mimoja-blue)]" placeholder="Enter your Visualizer username">\n                                    </div>\n                                    <div class="flex flex-col gap-2">\n                                        <label for="visualizer-password" class="text-[var(--text-primary)] text-[24px]">Password:</label>\n                                        <input type="password" id="visualizer-password" class="w-full max-w-[500px] p-3 rounded-lg border border-[var(--border-color)] bg-[var(--profile-button-background-color)] text-[var(--text-primary)] text-[24px] focus:outline-none focus:ring-2 focus:ring-[var(--mimoja-blue)]" placeholder="Enter your Visualizer password">\n                                    </div>\n                                    <div class="flex items-center gap-4">\n                                        <label for="visualizer-auto-upload" class="text-[var(--text-primary)] text-[24px]">Auto-upload shots to Visualizer</label>\n                                        <input type="checkbox" id="visualizer-auto-upload" class="w-8 h-8">\n                                    </div>\n                                    <div class="flex items-center gap-4">\n                                        <label for="visualizer-min-duration" class="text-[var(--text-primary)] text-[24px]">Minimum Shot Duration (seconds):</label>\n                                        <input type="number" id="visualizer-min-duration" class="w-24 p-3 rounded-lg border border-[var(--border-color)] bg-[var(--profile-button-background-color)] text-[var(--text-primary)] text-[24px] focus:outline-none focus:ring-2 focus:ring-[var(--mimoja-blue)]" min="1" value="5">\n                                    </div>\n                                </div>\n                                <div class="col-span-1 col-end-5 flex justify-end">\n                                    <button id="save-visualizer-credentials" class=" w-[150px] h-[50px] pt-3 pb-[15px] border border-solid border-[var(--mimoja-blue)] text-[var(--mimoja-blue)] rounded-[22.5px]">\n                                        Save Credentials\n                                    </button>\n                                </div>\n                            </div>\n                        </div>\n';
  }
  function renderVisualizerSection() {
    return [
      '                <div class="flex flex-col gap-[60px] items-start relative w-full max-w-full overflow-x-hidden">',
      `                    <div class="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] not-italic relative text-[var(--text-primary)] text-[36px] text-center w-full">`,
      '                        <p class="leading-[1.2]">Extensions Settings</p>',
      "                    </div>",
      '                    <div class="flex flex-col items-start relative w-full max-w-full">',
      '                        <div class="flex flex-col gap-[30px] items-start relative w-full max-w-full">',
      '                            <div class="flex items-center justify-between relative w-full max-w-full">',
      `                                <div class="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative text-[#385a92] text-[30px]">`,
      '                                    <p class="leading-[1.2]">Visualizer</p>',
      `                                    <p class="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic relative text-[var(--text-primary)] text-[24px] w-full">`,
      "                        Enable or disable the Visualizer extension",
      "                    </p>",
      "                                </div>",
      '                                <select id="visualizer-enabled" class="bg-[#385a92] border-2 border-[#385a92] border-solid h-[62.88px] rounded-[2617.374px] w-[200px] text-white text-[24px] p-2">',
      '                                    <option value="true">Enabled</option>',
      '                                    <option value="false">Disabled</option>',
      "                                </select>",
      "                            </div>",
      '                             <div class="justify-between grid-cols-4 mt-2 w-full">',
      renderVisualizerSettingsForm(),
      "                    </div>",
      "                        </div>",
      "                    </div>",
      "                </div>"
    ].join("\n");
  }
  function formatDaysOfWeek(days) {
    if (!days || days.length === 0) {
      return "Every day";
    }
    const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return days.map((day) => dayNames[day - 1]).join(", ");
  }
  function buildPresenceSchedulesHtml(schedules) {
    return schedules.map((schedule) => '<div class="bg-[var(--profile-button-background-color)] rounded-lg p-4 flex items-center justify-between" data-schedule-id="' + schedule.id + '"><div class="flex-grow"><div class="text-[22px] font-semibold text-[var(--text-primary)]">' + schedule.time + " - " + formatDaysOfWeek(schedule.daysOfWeek) + '</div></div><div class="flex items-center gap-4"><input type="checkbox" class="toggle toggle-md toggle-primary" ' + (schedule.enabled ? "checked" : "") + ` onchange="handleScheduleToggle('` + schedule.id + `', this.checked)"><button class="settings-btn-danger" onclick="handleDeleteSchedule('` + schedule.id + `')">Delete</button></div></div>`).join("");
  }
  function buildPresenceActiveHoursHtml(activeHours) {
    return activeHours.map((activeHour) => '<div class="bg-[var(--profile-button-background-color)] rounded-lg p-4 flex items-center justify-between" data-active-hour-id="' + activeHour.id + '"><div class="flex-grow"><div class="text-[22px] font-semibold text-[var(--text-primary)]">' + activeHour.startTime + " - " + activeHour.endTime + " " + formatDaysOfWeek(activeHour.daysOfWeek) + '</div></div><div class="flex items-center gap-4"><input type="checkbox" class="toggle toggle-md toggle-primary" ' + (activeHour.enabled ? "checked" : "") + ` onchange="handleActiveHourToggle('` + activeHour.id + `', this.checked)"><button class="settings-btn-danger" onclick="handleDeleteActiveHour('` + activeHour.id + `')">Delete</button></div></div>`).join("");
  }
  function renderPresenceScheduleModal() {
    return `<dialog id="add-schedule-modal" class="modal"><div class="modal-box bg-[var(--box-color)] max-w-2xl"><h3 class="font-bold text-[24px] text-[var(--text-primary)] mb-4">Add Schedule</h3><div class="space-y-4"><div><label class="text-[20px] text-[var(--text-primary)] block mb-2">Wake Time</label><input type="time" id="schedule-time-input" class="settings-input-primary"></div><div><label class="text-[20px] text-[var(--text-primary)] block mb-2">Days of Week</label><div class="flex gap-2 flex-wrap"><label class="cursor-pointer text-[var(--text-primary)]"><input type="checkbox" value="1" class="checkbox checkbox-primary mr-1"> Mon</label><label class="cursor-pointer text-[var(--text-primary)]"><input type="checkbox" value="2" class="checkbox checkbox-primary mr-1"> Tue</label><label class="cursor-pointer text-[var(--text-primary)]"><input type="checkbox" value="3" class="checkbox checkbox-primary mr-1"> Wed</label><label class="cursor-pointer text-[var(--text-primary)]"><input type="checkbox" value="4" class="checkbox checkbox-primary mr-1"> Thu</label><label class="cursor-pointer text-[var(--text-primary)]"><input type="checkbox" value="5" class="checkbox checkbox-primary mr-1"> Fri</label><label class="cursor-pointer text-[var(--text-primary)]"><input type="checkbox" value="6" class="checkbox checkbox-primary mr-1"> Sat</label><label class="cursor-pointer text-[var(--text-primary)]"><input type="checkbox" value="7" class="checkbox checkbox-primary mr-1"> Sun</label></div></div></div><div class="modal-action"><button class="settings-btn-secondary" onclick="document.getElementById('add-schedule-modal').close()">Cancel</button><button class="settings-btn-primary" onclick="handleSaveSchedule()">Save</button></div></div></dialog>`;
  }
  function renderPresenceActiveHourModal() {
    return `<dialog id="add-active-hour-modal" class="modal"><div class="modal-box bg-[var(--box-color)] max-w-2xl"><h3 class="font-bold text-[24px] text-[var(--text-primary)] mb-4">Add Active Hours</h3><div class="space-y-4"><div><label class="text-[20px] text-[var(--text-primary)] block mb-2">Start Time</label><input type="time" id="active-hour-start-input" class="settings-input-primary"></div><div><label class="text-[20px] text-[var(--text-primary)] block mb-2">End Time</label><input type="time" id="active-hour-end-input" class="settings-input-primary"></div><div><label class="text-[20px] text-[var(--text-primary)] block mb-2">Days of Week</label><div class="flex gap-2 flex-wrap"><label class="cursor-pointer text-[var(--text-primary)]"><input type="checkbox" value="1" class="checkbox checkbox-primary mr-1"> Mon</label><label class="cursor-pointer text-[var(--text-primary)]"><input type="checkbox" value="2" class="checkbox checkbox-primary mr-1"> Tue</label><label class="cursor-pointer text-[var(--text-primary)]"><input type="checkbox" value="3" class="checkbox checkbox-primary mr-1"> Wed</label><label class="cursor-pointer text-[var(--text-primary)]"><input type="checkbox" value="4" class="checkbox checkbox-primary mr-1"> Thu</label><label class="cursor-pointer text-[var(--text-primary)]"><input type="checkbox" value="5" class="checkbox checkbox-primary mr-1"> Fri</label><label class="cursor-pointer text-[var(--text-primary)]"><input type="checkbox" value="6" class="checkbox checkbox-primary mr-1"> Sat</label><label class="cursor-pointer text-[var(--text-primary)]"><input type="checkbox" value="7" class="checkbox checkbox-primary mr-1"> Sun</label></div></div></div><div class="modal-action"><button class="settings-btn-secondary" onclick="document.getElementById('add-active-hour-modal').close()">Cancel</button><button class="settings-btn-primary" onclick="handleSaveActiveHour()">Save</button></div></div></dialog>`;
  }
  function renderPresenceSection({ presenceSettings = {}, activeHours = [] }) {
    const schedules = Array.isArray(presenceSettings.schedules) ? presenceSettings.schedules : [];
    const schedulesHtml = buildPresenceSchedulesHtml(schedules);
    const activeHoursHtml = buildPresenceActiveHoursHtml(activeHours);
    return [
      '                <div class="space-y-6 px-[60px] py-[80px]">',
      "                    <div>",
      '                        <h2 class="text-[28px] font-bold text-[var(--text-primary)] mb-4">Presence Detection</h2>',
      '                        <p class="text-[var(--text-primary)] text-[20px] mb-6 opacity-75">Automatically manage machine sleep/wake based on user presence and schedules.</p>',
      "                    </div>",
      '                    <div class="bg-[var(--box-color)] rounded-lg p-6">',
      '                        <div class="flex items-center justify-between mb-6">',
      "                            <div>",
      '                                <label class="text-[24px] font-semibold text-[var(--text-primary)]">Enable Presence Detection</label>',
      '                                <p class="text-[18px] text-[var(--text-primary)] opacity-75 mt-1">Track user presence to automatically sleep the machine</p>',
      "                            </div>",
      '                            <input type="checkbox" id="presence-enabled-toggle" class="toggle toggle-lg toggle-primary" ' + (presenceSettings.userPresenceEnabled ? "checked" : "") + ' onchange="handlePresenceToggle(this.checked)">',
      "                        </div>",
      '                        <div class="mt-6">',
      '                            <label class="text-[22px] font-semibold text-[var(--text-primary)] block mb-3">Sleep Timeout (minutes)</label>',
      '                            <input type="number" id="sleep-timeout-input" class="settings-input-primary" value="' + (presenceSettings.sleepTimeoutMinutes || 30) + '" min="1" max="120" onchange="handleSleepTimeoutChange(this.value)">',
      '                            <p class="text-[18px] text-[var(--text-primary)] opacity-75 mt-2">Minutes of inactivity before auto-sleep</p>',
      "                        </div>",
      "                    </div>",
      '                    <div class="bg-[var(--box-color)] rounded-lg p-6">',
      '                        <div class="flex items-center justify-between mb-4">',
      '                            <h3 class="text-[24px] font-semibold text-[var(--text-primary)]">Wake Schedules</h3>',
      '                            <button class="settings-btn-primary" onclick="handleAddSchedule()">Add Schedule</button>',
      "                        </div>",
      '                        <div class="space-y-3">',
      schedules.length > 0 ? schedulesHtml : '                            <p class="text-[var(--text-primary)] opacity-75 text-[18px]">No schedules configured</p>',
      "                        </div>",
      "                    </div>",
      '                    <div class="bg-[var(--box-color)] rounded-lg p-6">',
      '                        <div class="flex items-center justify-between mb-4">',
      "                            <div>",
      '                                <h3 class="text-[24px] font-semibold text-[var(--text-primary)]">Active Hours</h3>',
      '                                <p class="text-[18px] text-[var(--text-primary)] opacity-75 mt-1">Machine stays awake during these time windows</p>',
      "                            </div>",
      '                            <button class="settings-btn-primary" onclick="handleAddActiveHour()">Add Active Hours</button>',
      "                        </div>",
      '                        <div class="space-y-3">',
      activeHours.length > 0 ? activeHoursHtml : '                            <p class="text-[var(--text-primary)] opacity-75 text-[18px]">No active hours configured</p>',
      "                        </div>",
      "                    </div>",
      renderPresenceScheduleModal(),
      renderPresenceActiveHourModal(),
      "                </div>"
    ].join("\n");
  }
  function getDefaultSubcategory(settingsTree2, categoryKey) {
    var _a, _b, _c;
    return ((_c = (_b = (_a = settingsTree2 == null ? void 0 : settingsTree2[categoryKey]) == null ? void 0 : _a.subcategories) == null ? void 0 : _b[0]) == null ? void 0 : _c.settingsCategory) || null;
  }
  function buildSourceBootstrapScript(browserBootstrapData, settingsTree2) {
    return `
    const browserBootstrap = ${JSON.stringify(browserBootstrapData)};
    const settingsTree = ${JSON.stringify(settingsTree2)};

    function showToast(message, isError = false) {
      const toastContainer = document.getElementById('toast-container');
      if (!toastContainer) return;
      const toast = document.createElement('div');
      toast.className = isError ? 'error-toast' : 'success-toast';
      toast.textContent = message;
      toastContainer.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    }

    function getCategoryTitleLocal(category) {
      switch (category) {
        case 'rea': return 'REA Application Settings';
        case 'flowmultiplier': return 'Flow Multiplier Settings';
        case 'steam': return 'Steam Settings';
        case 'hotwater': return 'Hot Water Settings';
        case 'watertank': return 'Water Tank Settings';
        case 'flush': return 'Flush Settings';
        case 'fanthreshold': return 'Fan Threshold Settings';
        case 'usbchargermode': return 'USB Charger Mode Settings';
        case 'de1advanced': return 'Machine Advanced Settings';
        case 'brightness': return 'Screen Brightness';
        case 'wakelock': return 'Wake Lock Settings';
        case 'presence': return 'Presence Detection';
        case 'updates': return 'Updates Settings';
        default: return 'Settings';
      }
    }

    function getDefaultSubcategoryLocal(categoryKey) {
      return settingsTree?.[categoryKey]?.subcategories?.[0]?.settingsCategory || null;
    }

    function findSettingsSearchResultsLocal(searchTerm) {
      const results = [];
      for (const [key, category] of Object.entries(settingsTree || {})) {
        if (category.name.toLowerCase().includes(searchTerm)) {
          results.push({ type: 'category', key, name: category.name });
        }
        category.subcategories.forEach((subcat) => {
          if (subcat.name.toLowerCase().includes(searchTerm)) {
            results.push({
              type: 'subcategory',
              categoryKey: key,
              subcatKey: subcat.id,
              settingsCategory: subcat.settingsCategory,
              name: subcat.name,
            });
          }
        });
      }
      return results;
    }

    function buildSearchCategoryResultsLocal(results) {
      const categoryResults = {};
      results.forEach((result) => {
        if (result.type === 'category') {
          if (!categoryResults[result.key]) {
            categoryResults[result.key] = {
              name: result.name,
              subcategories: [],
              isSearchMatch: true,
            };
          }
          return;
        }
        if (!categoryResults[result.categoryKey]) {
          categoryResults[result.categoryKey] = {
            name: settingsTree[result.categoryKey].name,
            subcategories: [],
            isSearchMatch: false,
          };
        }
        categoryResults[result.categoryKey].subcategories.push(result);
      });
      return categoryResults;
    }

    function activateButtons(selector, button) {
      document.querySelectorAll(selector).forEach((btn) => btn.classList.remove('active'));
      if (button) button.classList.add('active');
    }

    function renderMainCategories(selectedKey = browserBootstrap.activeMainCategoryKey) {
      const panel = document.getElementById('main-categories-panel');
      if (!panel) return;
      browserBootstrap.activeMainCategoryKey = selectedKey;
      let html = '<nav><ul style="list-style: none; padding: 0; margin: 0;">';
      for (const [key, category] of Object.entries(settingsTree)) {
        html += '<li><button class="main-category-btn ' + (key === selectedKey ? 'active' : '') + '" data-category="' + key + '">' + category.name + '</button></li>';
      }
      html += '</ul></nav>';
      panel.innerHTML = html;
    }

    function renderSubcategories(categoryKey, selectedCategory = null) {
      const panel = document.getElementById('sub-categories-panel');
      const category = settingsTree[categoryKey];
      if (!panel || !category) return;
      const activeCategory = selectedCategory || getDefaultSubcategoryLocal(categoryKey);
      let html = '<ul style="list-style: none; padding: 0; margin: 0;">';
      category.subcategories.forEach((subcat) => {
        html += '<li><button class="subcategory-btn ' + (subcat.settingsCategory === activeCategory ? 'active' : '') + '" data-category="' + subcat.settingsCategory + '" data-label="' + subcat.name + '">' + subcat.name + '</button></li>';
      });
      html += '</ul>';
      panel.innerHTML = html;
      if (activeCategory) {
        browserBootstrap.activeSettingsCategory = activeCategory;
        renderActiveCategory(activeCategory, panel.querySelector('.subcategory-btn.active')?.dataset?.label || getCategoryTitleLocal(activeCategory));
      }
    }

    function renderActiveCategory(category, displayName) {
      const contentArea = document.getElementById('source-initial-content') || document.getElementById('settings-content-area');
      if (!contentArea) return;
      browserBootstrap.activeSettingsCategory = category;
      if (category === 'presence') {
        contentArea.innerHTML = document.getElementById('presence-template')?.innerHTML || '';
      } else if (category === 'extensions') {
        contentArea.innerHTML = document.getElementById('visualizer-template')?.innerHTML || '';
        setupVisualizerEventListeners();
      } else {
        contentArea.innerHTML = '<div class="settings-flex-container"><div class="settings-page-title"><p>' + (displayName || getCategoryTitleLocal(category)) + '</p></div><div class="settings-divider"><hr /></div><div class="setting-description"><p>Source migration placeholder for ' + (displayName || getCategoryTitleLocal(category)) + '.</p></div></div>';
      }
    }

    function handleMainCategoryClickImpl(categoryKey, button) {
      browserBootstrap.activeMainCategoryKey = categoryKey;
      activateButtons('.main-category-btn', button);
      renderSubcategories(categoryKey);
    }

    function handleSubcategoryClickImpl(settingsCategory, button) {
      browserBootstrap.activeSettingsCategory = settingsCategory;
      activateButtons('.subcategory-btn', button);
      renderActiveCategory(settingsCategory, button?.dataset?.label || getCategoryTitleLocal(settingsCategory));
    }

    window.handleMainCategoryClick = handleMainCategoryClickImpl;
    window.handleSubcategoryClick = handleSubcategoryClickImpl;

    function attachNavigationHandlers() {
      const mainPanel = document.getElementById('main-categories-panel');
      const subPanel = document.getElementById('sub-categories-panel');
      if (mainPanel) {
        mainPanel.addEventListener('click', (event) => {
          const button = event.target.closest('.main-category-btn');
          if (!button) return;
          handleMainCategoryClickImpl(button.dataset.category, button);
        });
      }
      if (subPanel) {
        subPanel.addEventListener('click', (event) => {
          const button = event.target.closest('.subcategory-btn');
          if (!button) return;
          handleSubcategoryClickImpl(button.dataset.category, button);
        });
      }
    }

      const searchTerm = value.toLowerCase().trim();
      if (!searchTerm) {
        renderMainCategories();
        renderSubcategories(browserBootstrap.activeMainCategoryKey || 'extensions');
        return;
      }
      const results = findSettingsSearchResultsLocal(searchTerm);
      const categoryResults = buildSearchCategoryResultsLocal(results);
      const mainPanel = document.getElementById('main-categories-panel');
      const subPanel = document.getElementById('sub-categories-panel');
      if (!mainPanel || !subPanel) return;
      if (results.length === 0) {
        mainPanel.innerHTML = '<p style="padding: 20px; color: var(--text-secondary);">No results found</p>';
        subPanel.innerHTML = '';
        return;
      }
      let mainHtml = '<nav><ul style="list-style: none; padding: 0; margin: 0;">';
      for (const [key, data] of Object.entries(categoryResults)) {
        mainHtml += '<li><button class="main-category-btn active" data-category="' + key + '">' + data.name + '</button></li>';
      }
      mainHtml += '</ul></nav>';
      mainPanel.innerHTML = mainHtml;
      const firstCategory = Object.keys(categoryResults)[0];
      if (firstCategory) renderSubcategories(firstCategory);
    }

    function getVisualizerElements() {
      return {
        saveButton: document.getElementById('save-visualizer-credentials'),
        usernameInput: document.getElementById('visualizer-username'),
        passwordInput: document.getElementById('visualizer-password'),
        autoUploadCheckbox: document.getElementById('visualizer-auto-upload'),
        minDurationInput: document.getElementById('visualizer-min-duration'),
        enabledSelect: document.getElementById('visualizer-enabled'),
        formContainer: document.getElementById('visualizer-form-container'),
      };
    }

    function setVisualizerFormVisibility(enabledSelect, formContainer) {
      if (!enabledSelect || !formContainer) return;
      formContainer.style.display = enabledSelect.value === 'false' ? 'none' : 'block';
    }

    async function verifyVisualizerCredentialsLocal(username, password) {
      const response = await fetch('http://localhost:8080/api/v1/plugins/visualizer.reaplugin/verifyCredentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      try {
        return await response.json();
      } catch {
        const errorText = await response.text();
        throw new Error(errorText || 'Invalid response format');
      }
    }

    async function saveVisualizerSettingsLocal(settingsPayload) {
      const response = await fetch('http://localhost:8080/api/v1/plugins/visualizer.reaplugin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsPayload),
      });
      if (response.ok) return {};
      const contentType = response.headers.get('content-type');
      let errorMessage = 'Failed to save visualizer settings';
      if (contentType && contentType.includes('application/json')) {
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          const errorText = await response.text();
          if (errorText) errorMessage = errorText;
        }
      } else {
        const errorText = await response.text();
        if (errorText) errorMessage = errorText;
      }
      throw new Error(errorMessage);
    }

    async function fetchVisualizerSavedSettingsLocal() {
      const response = await fetch('http://localhost:8080/api/v1/plugins/visualizer.reaplugin/settings');
      if (!response.ok) return null;
      try {
        return await response.json();
      } catch {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to load Visualizer settings: Invalid response format');
      }
    }

    function applyVisualizerSettingsToFormLocal(savedSettings, elements) {
      const { usernameInput, passwordInput, autoUploadCheckbox, minDurationInput, enabledSelect, formContainer } = elements;
      if (usernameInput) usernameInput.value = savedSettings && savedSettings.Username ? savedSettings.Username : '';
      if (passwordInput) passwordInput.value = '';
      if (autoUploadCheckbox && savedSettings && typeof savedSettings.AutoUpload !== 'undefined') {
        autoUploadCheckbox.checked = !!savedSettings.AutoUpload;
      }
      if (minDurationInput && savedSettings && typeof savedSettings.Length !== 'undefined') {
        minDurationInput.value = parseInt(savedSettings.Length, 10) || 5;
      }
      if (enabledSelect) {
        const storedEnabled = localStorage.getItem('visualizerEnabled');
        enabledSelect.value = storedEnabled !== null ? storedEnabled : 'true';
      }
      setVisualizerFormVisibility(enabledSelect, formContainer);
    }

    async function loadVisualizerSettings() {
      try {
        const savedSettings = await fetchVisualizerSavedSettingsLocal();
        applyVisualizerSettingsToFormLocal(savedSettings, getVisualizerElements());
      } catch (error) {
        console.error('Failed to load Visualizer settings:', error);
        showToast(error.message || 'Could not load Visualizer plugin settings', true);
      }
    }

    async function setupVisualizerEventListeners() {
      const elements = getVisualizerElements();
      const { saveButton, usernameInput, passwordInput, autoUploadCheckbox, minDurationInput, enabledSelect, formContainer } = elements;
      if (!saveButton) return;

      await loadVisualizerSettings();
      setVisualizerFormVisibility(enabledSelect, formContainer);

      if (enabledSelect) {
        enabledSelect.addEventListener('change', function() {
          localStorage.setItem('visualizerEnabled', this.value);
          setVisualizerFormVisibility(enabledSelect, formContainer);
        });
      }

      saveButton.addEventListener('click', async () => {
        const username = usernameInput.value.trim();
        const password = passwordInput.value;
        if (!username || !password) {
          showToast('Please enter both username and password', true);
          return;
        }

        try {
          const testResult = await verifyVisualizerCredentialsLocal(username, password);
          if (!testResult.valid) {
            showToast('Visualizer log-in failed, check credentials', true);
            return;
          }

          const settingsPayload = {
            Username: username,
            Password: password,
            AutoUpload: autoUploadCheckbox.checked,
            LengthThreshold: parseInt(minDurationInput.value, 10) || 5,
          };

          await saveVisualizerSettingsLocal(settingsPayload);
          showToast('Visualizer settings saved successfully', false);
        } catch (error) {
          console.error('Error during credential validation:', error);
          showToast('Error: ' + error.message, true);
        }
      });
    }

    function getPresenceScheduleModalElements() {
      return {
        dialog: document.getElementById('add-schedule-modal'),
        timeInput: document.getElementById('schedule-time-input'),
        dayCheckboxes: document.querySelectorAll('#add-schedule-modal input[type="checkbox"]'),
        checkedDayCheckboxes: document.querySelectorAll('#add-schedule-modal input[type="checkbox"]:checked'),
      };
    }

    function getPresenceActiveHourModalElements() {
      return {
        dialog: document.getElementById('add-active-hour-modal'),
        startInput: document.getElementById('active-hour-start-input'),
        endInput: document.getElementById('active-hour-end-input'),
        dayCheckboxes: document.querySelectorAll('#add-active-hour-modal input[type="checkbox"]'),
        checkedDayCheckboxes: document.querySelectorAll('#add-active-hour-modal input[type="checkbox"]:checked'),
      };
    }

    function resetPresenceScheduleModal(elements) {
      elements.timeInput.value = '';
      elements.dayCheckboxes.forEach((checkbox) => { checkbox.checked = false; });
    }

    function resetPresenceActiveHourModal(elements) {
      elements.startInput.value = '';
      elements.endInput.value = '';
      elements.dayCheckboxes.forEach((checkbox) => { checkbox.checked = false; });
    }

    window.handlePresenceToggle = function(enabled) {
      browserBootstrap.presenceSettings.userPresenceEnabled = enabled;
      showToast('Presence detection ' + (enabled ? 'enabled' : 'disabled'));
    };

    window.handleSleepTimeoutChange = function(value) {
      browserBootstrap.presenceSettings.sleepTimeoutMinutes = parseInt(value, 10) || 30;
      showToast('Sleep timeout updated');
    };

    window.handleAddSchedule = function() {
      getPresenceScheduleModalElements().dialog?.showModal();
    };

    window.handleSaveSchedule = function() {
      try {
        const elements = getPresenceScheduleModalElements();
        const timeInput = elements.timeInput.value;
        if (!timeInput) {
          throw new Error('Please select a time');
        }
        showToast('Schedule created');
        resetPresenceScheduleModal(elements);
        elements.dialog.close();
      } catch (error) {
        console.error('Error creating schedule:', error);
        showToast(error.message || 'Failed to create schedule', true);
      }
    };

    window.handleScheduleToggle = function(scheduleId, enabled) {
      showToast('Schedule ' + (enabled ? 'enabled' : 'disabled'));
    };

    window.handleDeleteSchedule = function(scheduleId) {
      if (!confirm('Are you sure you want to delete this schedule?')) return;
      showToast('Schedule deleted');
    };

    window.handleAddActiveHour = function() {
      getPresenceActiveHourModalElements().dialog?.showModal();
    };

    window.handleSaveActiveHour = function() {
      try {
        const elements = getPresenceActiveHourModalElements();
        const startTime = elements.startInput.value;
        const endTime = elements.endInput.value;
        if (!startTime || !endTime) {
          throw new Error('Please select start and end times');
        }
        if (startTime === endTime) {
          throw new Error('Start and end times must be different');
        }
        showToast('Active hours created');
        resetPresenceActiveHourModal(elements);
        elements.dialog.close();
      } catch (error) {
        console.error('Error creating active hours:', error);
        showToast(error.message || 'Failed to create active hours', true);
      }
    };

    window.handleActiveHourToggle = function(id, enabled) {
      showToast('Active hours ' + (enabled ? 'enabled' : 'disabled'));
    };

    window.handleDeleteActiveHour = function(id) {
      if (!confirm('Are you sure you want to delete this active hour?')) return;
      showToast('Active hours deleted');
    };

    document.addEventListener('DOMContentLoaded', async function() {
      const searchInput = document.getElementById('settings-search');
      if (searchInput) {
        searchInput.addEventListener('input', (e) => handleSearchInput(e.target.value));
      }
      attachNavigationHandlers();
      renderMainCategories(browserBootstrap.activeMainCategoryKey || 'extensions');
      renderSubcategories(browserBootstrap.activeMainCategoryKey || 'extensions', browserBootstrap.activeSettingsCategory || null);
      await setupVisualizerEventListeners();
    });

    console.log('settings plugin source page loaded', browserBootstrap);
  `;
  }
  function renderSettingsPage({
    reaSettings = {},
    de1Settings = {},
    de1AdvancedSettings = {},
    webUISkins = [],
    calibrationSettings = {},
    presenceSettings = {},
    appInfo = null,
    machineInfo = null,
    activeSettingsCategory = null,
    activeMainCategoryKey,
    activeHours = []
  }) {
    const browserBootstrapData = getBrowserBootstrapData({
      reaSettings,
      de1Settings,
      de1AdvancedSettings,
      webUISkins,
      calibrationSettings,
      presenceSettings,
      appInfo,
      machineInfo,
      activeSettingsCategory,
      activeMainCategoryKey
    });
    const initialCategory = activeSettingsCategory || getDefaultSubcategory(settingsTree, activeMainCategoryKey) || "extensions";
    const initialContent = initialCategory === "presence" ? renderPresenceSection({ presenceSettings, activeHours }) : renderVisualizerSection();
    return `${renderSettingsPageHead()}
${renderSettingsPageLayout((/* @__PURE__ */ new Date()).toLocaleString())}
<div id="source-initial-content" style="padding: 24px;">${initialContent}</div>
<script>
${buildSourceBootstrapScript(browserBootstrapData)}
<\/script>
</body>
</html>`;
  }
  function createPlugin2(host) {
    let activeSettingsCategory = null;
    let activeMainCategoryKey = DEFAULT_MAIN_CATEGORY_KEY;
    function log(msg) {
      host.log(`[settings] ${msg}`);
    }
    function renderSourcePage() {
      return renderSettingsPage({
        reaSettings: {},
        de1Settings: {},
        de1AdvancedSettings: {},
        webUISkins: [],
        calibrationSettings: {},
        presenceSettings: {},
        appInfo: null,
        machineInfo: null,
        activeSettingsCategory,
        activeMainCategoryKey,
        activeHours: []
      });
    }
    return {
      id: "settings.reaplugin",
      version: "0.1.0",
      onLoad(settings) {
        log(`Loaded with refresh interval: ${(settings == null ? void 0 : settings.RefreshInterval) ?? DEFAULT_REFRESH_INTERVAL}s`);
      },
      onUnload() {
        log("Unloaded");
      },
      onEvent(_event) {
      },
      __httpRequestHandler(request) {
        if (request.endpoint === "ui") {
          return {
            requestId: request.requestId,
            status: 200,
            headers: {
              "Content-Type": "text/html; charset=utf-8",
              "Cache-Control": "no-cache"
            },
            body: renderSourcePage()
          };
        }
        return {
          requestId: request.requestId,
          status: 404,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ error: "Endpoint not found" })
        };
      }
    };
  }
  return createPlugin2;
})();
