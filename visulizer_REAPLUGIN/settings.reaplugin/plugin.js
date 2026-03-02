/* settings.reaplugin
 *
 * Contract:
 * - This file must define a function named 'createPlugin'
 * - Factory function receives 'host' object as parameter
 * - Returns a plugin object with onLoad, onUnload, onEvent methods
 */

// Standard factory function - receives host object from PluginManager
function createPlugin(host) {
  "use strict";

  let state = {
    refreshInterval: 5,
  };

  // Settings Tree Structure for Navigation
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
            { id: 'steam_cal', name: 'Steam', settingsCategory: 'steam' }
        ]
    },
    'machine': {
        name: 'Machine',
        subcategories: [
            { id: 'fanthreshold', name: 'Fan Threshold', settingsCategory: 'fanthreshold' },
            { id: 'usbchargermode', name: 'USB Charger Mode', settingsCategory: 'usbchargermode' },
            { id: 'presence_sleep', name: 'Presence & Sleep', settingsCategory: 'presence_sleep' }
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

  function log(msg) {
    host.log(`[settings] ${msg}`);
  }

  /**
   * Fetch Bridge / Rea application settings
   */
  async function fetchReaSettings() {
    try {
      const res = await fetch("http://localhost:8080/api/v1/settings");
      if (!res.ok) {
        log(`Failed to fetch REA settings: ${res.status}`);
        return null;
      }
      return await res.json();
    } catch (e) {
      log(`Error fetching REA settings: ${e.message}`);
      return null;
    }
  }

  /**
   * Fetch available WebUI skins
   */
  async function fetchWebUISkins() {
    try {
      const res = await fetch("http://localhost:8080/api/v1/webui/skins");
      if (!res.ok) {
        log(`Failed to fetch WebUI skins: ${res.status}`);
        return null;
      }
      return await res.json();
    } catch (e) {
      log(`Error fetching WebUI skins: ${e.message}`);
      return null;
    }
  }

  /**
   * Fetch machine settings
   */
  async function fetchDe1Settings() {
    try {
      const res = await fetch("http://localhost:8080/api/v1/machine/settings");
      if (!res.ok) {
        log(`Failed to fetch machine settings: ${res.status}`);
        return null;
      }
      return await res.json();
    } catch (e) {
      log(`Error fetching machine settings: ${e.message}`);
      return null;
    }
  }

  /**
   * Fetch machine calibration settings
   */
  async function fetchCalibrationSettings() {
    try {
      const res = await fetch("http://localhost:8080/api/v1/machine/calibration");
      if (!res.ok) {
        log(`Failed to fetch calibration settings: ${res.status}`);
        return null;
      }
      return await res.json();
    } catch (e) {
      log(`Error fetching calibration settings: ${e.message}`);
      return null;
    }
  }

  /**
   * Fetch presence & wake schedule settings
   */
  async function fetchPresenceSettings() {
    try {
      const res = await fetch("http://localhost:8080/api/v1/presence/settings");
      if (!res.ok) {
        log(`Failed to fetch presence settings: ${res.status}`);
        return null;
      }
      return await res.json();
    } catch (e) {
      log(`Error fetching presence settings: ${e.message}`);
      return null;
    }
  }

  /**
   * Fetch machine advanced settings
   */
  async function fetchDe1AdvancedSettings() {
    try {
      const res = await fetch("http://localhost:8080/api/v1/machine/settings/advanced");
      if (!res.ok) {
        log(`Failed to fetch machine advanced settings: ${res.status}`);
        return null;
      }
      return await res.json();
    } catch (e) {
      log(`Error fetching machine advanced settings: ${e.message}`);
      return null;
    }
  }

  /**
   * Generate HTML page with all settings (with editable controls)
   */
  function generateSettingsHTML(reaSettings, de1Settings, de1AdvancedSettings, webUISkins, calibrationSettings, presenceSettings) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="REA Prime Settings Dashboard - Configure application and DE1 machine settings">
    <title>Settings</title>
    
    <!-- Google Fonts CDN -->
    <link href="https://fonts.cdnfonts.com/css/noto-sans" rel="stylesheet">
    <link href="https://fonts.cdnfonts.com/css/inter" rel="stylesheet">
    
    <style>
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

            /* Typography */
            --font-family-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            --font-family-mono: 'NotoSansMono', monospace;
        }
        
        /* Settings page specific layout styles */
        body {
            background: var(--bgmain-color);
            padding: 20px;
            line-height: 1.6;
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
            padding: 6px 10px;
            border: 2px solid var(--low-contrast-white);
            border-radius: 4px;
            font-family: 'NotoSansMono', monospace;
            font-size: 14px;
            width: 120px;
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
        
        /* Toast notifications */
        .success-toast {
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--status-green-color);
            color: white;
            padding: 15px 20px;
            border-radius: 6px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            animation: slideIn 0.3s ease-out;
            z-index: 1000;
        }
        
        .error-toast {
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--status-red-color);
            color: white;
            padding: 15px 20px;
            border-radius: 6px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            animation: slideIn 0.3s ease-out;
            z-index: 1000;
        }
        
        @keyframes slideIn {
            from { transform: translateX(400px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        /* Status indicator */
        .status-indicator {
            display: inline-block;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            margin-right: 8px;
        }
        
        .status-ok {
            background: var(--status-green-color);
        }
        
        .status-error {
            background: var(--status-red-color);
        }
        
        /* Accessibility */
        .visually-hidden {
            position: absolute;
            left: -10000px;
            width: 1px;
            height: 1px;
            overflow: hidden;
        }
        
        /* New flexbox layout classes (matching settings.js design) */
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
        
        .settings-section {
            display: flex;
            flex-direction: column;
            gap: 30px;
            align-items: flex-start;
            position: relative;
            width: 100%;
            max-width: 100%;
        }
        
        .setting-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            position: relative;
            width: 100%;
            max-width: 885px;
        }
        
        .setting-label-bold {
            display: flex;
            flex-direction: column;
            font-family: 'Inter', sans-serif;
            font-weight: 700;
            justify-content: center;
            line-height: 0;
            not-italic: true;
            position: relative;
            color: var(--mimoja-blue);
            font-size: 30px;
        }
        
        .setting-label-bold p {
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
        
        .divider {
            height: 0;
            position: relative;
            width: 100%;
        }
        
        .divider hr {
            border-top: 1px solid var(--low-contrast-white);
            width: 100%;
        }
        
        .settings-title {
            display: flex;
            flex-direction: column;
            font-family: 'Inter', sans-serif;
            font-weight: 600;
            justify-content: center;
            line-height: 0;
            not-italic: true;
            position: relative;
            color: var(--text-primary);
            font-size: 36px;
            text-align: center;
            width: 100%;
        }
        
        .settings-title p {
            line-height: 1.2;
        }
        
        /* ============================================
           NEW FLEXBOX LAYOUT (settings.js parity)
           ============================================ */
        
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
        
        .setting-label-bold p {
            line-height: 1.2;
        }
        
        .setting-description {
            font-family: 'Inter', sans-serif;
            font-weight: 400;
            line-height: 1.4;
            color: var(--text-primary);
            font-size: 24px;
            width: 100%;
            max-width: 100%;
            word-break: break-word;
        }
        
        .settings-divider {
            height: 0;
            position: relative;
            width: 100%;
        }
        
        .settings-divider hr {
            border-top: 1px solid #c9c9c9;
            width: 100%;
        }
        
        .settings-input-primary {
            background: var(--mimoja-blue);
            border: 2px solid var(--mimoja-blue);
            border-style: solid;
            height: 62.88px;
            border-radius: 10px;
            width: 150px;
            color: var(--white);
            font-size: 24px;
            padding: 8px;
            text-align: center;
            font-family: 'Inter', sans-serif;
            max-width: 150px;
        }
        
        .settings-input-primary:focus {
            outline: 3px solid var(--white);
            outline-offset: 2px;
        }
        
        .settings-input-wide {
            background: var(--mimoja-blue);
            border: 2px solid var(--mimoja-blue);
            border-style: solid;
            height: 62.88px;
            border-radius: 2617.374px;
            width: 250px;
            color: var(--white);
            font-size: 24px;
            padding: 8px;
            font-family: 'Inter', sans-serif;
            max-width: 250px;
        }
        
        .settings-input-wide:focus {
            outline: 3px solid var(--white);
            outline-offset: 2px;
        }
        
        .settings-input-text {
            background: var(--mimoja-blue);
            border: 2px solid var(--mimoja-blue);
            border-style: solid;
            height: 62.88px;
            border-radius: 10px;
            width: 200px;
            color: var(--white);
            font-size: 24px;
            padding: 8px;
            font-family: 'Inter', sans-serif;
        }
        
        .settings-input-text:focus {
            outline: 3px solid var(--white);
            outline-offset: 2px;
        }
        
        .settings-btn-primary {
            background: var(--mimoja-blue);
            height: 62.88px;
            border-radius: 10px;
            width: 100px;
            color: var(--white);
            font-size: 24px;
            font-weight: 700;
            border: none;
            cursor: pointer;
            transition: background 0.2s, transform 0.1s;
            font-family: 'Inter', sans-serif;
            max-width: 100px;
        }
        
        .settings-btn-primary:hover {
            background: var(--mimoja-blue-v2);
        }
        
        .settings-btn-primary:active {
            transform: translateY(1px);
        }
        
        .settings-btn-primary:focus {
            outline: 3px solid var(--white);
            outline-offset: 2px;
        }
        
        .settings-btn-wide {
            background: var(--mimoja-blue);
            height: 62.88px;
            border-radius: 10px;
            width: 200px;
            color: var(--white);
            font-size: 24px;
            font-weight: 700;
            border: none;
            cursor: pointer;
            transition: background 0.2s, transform 0.1s;
            font-family: 'Inter', sans-serif;
        }
        
        .settings-btn-wide:hover {
            background: var(--mimoja-blue-v2);
        }
        
        .setting-control-flex {
            display: flex;
            align-items: center;
            gap: 16px;
        }
        
        .toggle-button-group {
            display: flex;
            align-items: center;
            justify-content: space-between;
            width: 100%;
            max-width: 885px;
            gap: 16px;
        }
        
        .toggle-btn {
            height: 120px;
            width: 295px;
            border-radius: 10px;
            font-family: 'Inter', sans-serif;
            font-weight: 700;
            font-size: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: background 0.2s, color 0.2s;
            border: 2px solid transparent;
        }
        
        .toggle-btn.active {
            background: var(--mimoja-blue);
            color: var(--white);
        }
        
        .toggle-btn.inactive {
            background: var(--box-color);
            border-color: var(--profile-button-outline-color);
            color: #b6c3d7;
        }
        
        .settings-loading-state,
        .settings-error-state {
            display: flex;
            flex-direction: column;
            gap: 60px;
            align-items: flex-start;
            position: relative;
            width: 100%;
            max-width: 100%;
            overflow-x: hidden;
        }
        
        .settings-error-text {
            color: var(--error-red);
            padding: 16px;
            font-size: 24px;
            text-align: center;
            width: 100%;
        }

        /* ============================================
           Toast Notifications
           ============================================ */
        .toast-container {
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 10000;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 12px;
        }

        .toast {
            padding: 16px 24px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideIn 0.3s ease-out;
            min-width: 300px;
            text-align: center;
            font-size: 18px;
            font-weight: 600;
            font-family: 'Inter', sans-serif;
        }

        .toast-success {
            background: var(--success-green);
            color: var(--white);
        }

        .toast-error {
            background: var(--status-red-color);
            color: var(--white);
        }

        .toast-info {
            background: var(--mimoja-blue);
            color: var(--white);
        }

        @keyframes slideIn {
            from {
                transform: translateY(100px);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }

        /* ============================================
           Header (Settings.js Pattern)
           ============================================ */
        .settings-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px;
            border-bottom: 2px solid var(--low-contrast-white);
            background: var(--box-color);
            margin-bottom: 20px;
        }

        .settings-header h1 {
            font-size: 28px;
            font-weight: 700;
            color: var(--text-primary);
            margin: 0;
        }

        .header-actions {
            display: flex;
            gap: 22px;
            align-items: center;
        }

        .btn-cancel {
            background: transparent;
            border: 2px solid var(--mimoja-blue);
            color: var(--mimoja-blue);
            height: 82.5px;
            width: 240px;
            border-radius: 67.5px;
            font-size: 24px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s;
            font-family: 'Inter', sans-serif;
        }

        .btn-cancel:hover {
            background: var(--mimoja-blue);
            color: var(--white);
        }

        .btn-save {
            background: var(--mimoja-blue);
            color: var(--white);
            height: 82.5px;
            width: 240px;
            border-radius: 67.5px;
            font-size: 24px;
            font-weight: 700;
            border: none;
            cursor: pointer;
            transition: all 0.2s;
            font-family: 'Inter', sans-serif;
        }

        .btn-save:hover {
            background: var(--mimoja-blue-v2);
        }

        /* ============================================
           Device Card (Bluetooth)
           ============================================ */
        .device-card {
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: var(--profile-button-background-color);
            border-radius: 10px;
            margin-bottom: 12px;
            padding: 16px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .device-info {
            flex: 1;
            min-width: 0;
        }

        .device-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 8px;
        }

        .device-status-dot {
            width: 12px;
            height: 12px;
            border-radius: 50%;
        }

        .device-status-dot.connected {
            background-color: #22c55e;
        }

        .device-status-dot.disconnected {
            background-color: #ef4444;
        }

        .device-name {
            font-size: 24px;
            color: var(--text-primary);
            font-weight: 600;
        }

        .device-detail {
            font-size: 18px;
            color: var(--text-secondary);
            margin: 4px 0;
        }

        .device-status-text {
            font-size: 18px;
            font-weight: 600;
        }

        .device-status-text.connected {
            color: #22c55e;
        }

        .device-status-text.disconnected {
            color: #ef4444;
        }

        .btn-connect {
            background: var(--mimoja-blue);
            color: var(--white);
            height: 60px;
            border-radius: 67.5px;
            width: 120px;
            font-size: 18px;
            font-weight: 600;
            border: none;
            cursor: pointer;
            transition: all 0.2s;
            font-family: 'Inter', sans-serif;
            margin-left: 16px;
        }

        .btn-connect:hover {
            background: var(--mimoja-blue-v2);
        }

        /* ============================================
           Stepper (Plus/Minus)
           ============================================ */
        .stepper-container {
            border: 2px solid #c9c9c9;
            border-radius: 10px;
            padding: 30px 60px;
            display: flex;
            flex-direction: column;
            gap: 30px;
            align-items: center;
            width: 590px;
        }

        .stepper-controls {
            display: flex;
            gap: 20px;
            height: 72px;
            align-items: center;
            justify-content: center;
            width: 100%;
        }

        .stepper-button {
            width: 72px;
            height: 72px;
            background: var(--button-grey);
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: background 0.2s;
            border: none;
        }

        .stepper-button:hover {
            background: var(--low-contrast-white);
        }

        .stepper-button svg {
            stroke: var(--text-primary);
        }

        .stepper-input-container {
            text-align: center;
            font-size: 24px;
            font-weight: 700;
            color: var(--text-primary);
            width: 130px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: transparent;
            border: none;
        }

        .stepper-input {
            background: transparent;
            border: none;
            text-align: center;
            font-size: 24px;
            font-weight: 700;
            color: var(--text-primary);
            width: 100%;
            padding: 0;
            font-family: 'Inter', sans-serif;
        }

        .stepper-input:focus {
            outline: none;
        }

        .stepper-unit {
            margin-left: 8px;
            white-space: nowrap;
            font-size: 24px;
            color: var(--text-primary);
        }

        /* ============================================
           Toggle Switch (Checkbox)
           ============================================ */
        .toggle-switch {
            position: relative;
            display: inline-flex;
            align-items: center;
            cursor: pointer;
        }

        .toggle-switch input {
            opacity: 0;
            width: 0;
            height: 0;
            position: absolute;
        }

        .toggle-slider {
            width: 44px;
            height: 24px;
            background-color: var(--text-secondary);
            border-radius: 24px;
            position: relative;
            transition: 0.2s;
        }

        .toggle-slider:before {
            position: absolute;
            content: "";
            height: 20px;
            width: 20px;
            left: 2px;
            bottom: 2px;
            background-color: white;
            border-radius: 50%;
            transition: 0.2s;
        }

        .toggle-switch input:checked + .toggle-slider {
            background-color: var(--mimoja-blue);
        }

        .toggle-switch input:checked + .toggle-slider:before {
            transform: translateX(20px);
        }

        /* ============================================
           Scan Button
           ============================================ */
        .btn-scan {
            border: 2px solid var(--mimoja-blue);
            color: var(--mimoja-blue);
            height: 62px;
            border-radius: 67.5px;
            width: 139px;
            font-size: 24px;
            font-weight: 600;
            background: transparent;
            cursor: pointer;
            transition: all 0.2s;
            font-family: 'Inter', sans-serif;
        }

        .btn-scan:hover {
            background: var(--mimoja-blue);
            color: var(--white);
        }

        /* ============================================
           Read-only Value
           ============================================ */
        .readonly-value {
            color: var(--preset-label-selected-color);
            font-family: var(--font-family-mono);
            font-size: 24px;
        }

        /* ============================================
           Two-Panel Navigation Layout
           ============================================ */
        .settings-layout {
            display: flex;
            height: calc(100vh - 200px);
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
    </style>
</head>
<body>
    <a href="#main-content" class="skip-link">Skip to main content</a>
    
    <!-- Toast Container -->
    <div id="toast-container" class="toast-container"></div>
    
    <!-- Header -->
    <header class="settings-header">
        <h1 id="page-title">Settings</h1>
        <div class="header-actions">
            <button class="btn-cancel" onclick="window.closeSettings()">CANCEL</button>
            <button class="btn-save" onclick="saveAllSettings()">SAVE</button>
        </div>
    </header>
    
    <div class="timestamp" role="status" aria-live="polite" aria-atomic="true" style="padding: 20px;">
        <span class="status-indicator ${reaSettings && de1Settings ? 'status-ok' : 'status-error'}"
              role="img"
              aria-label="${reaSettings && de1Settings ? 'Settings loaded successfully' : 'Error loading settings'}"></span>
        Last updated: <span id="timestamp">${new Date().toLocaleString()}</span>
    </div>

    <!-- Two-Panel Navigation Layout -->
    <div class="settings-layout">
        <!-- Left Panel -->
        <div class="left-panel">
            <!-- Search Bar -->
            <div class="search-container">
                <input type="text" 
                       id="settings-search" 
                       placeholder="Search settings..." 
                       class="settings-search-input"
                       aria-label="Search settings">
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
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; text-align: center; padding: 30px;">
                <p style="color: var(--text-primary); font-size: 28px;">Select a category from the menu</p>
            </div>
        </div>
    </div>

    <script>
        // Settings Tree Structure for Navigation (embedded for template scope)
        const settingsTree = ${JSON.stringify(settingsTree)};

        // Embedded settings data for browser runtime access
        const reaSettings = ${JSON.stringify(reaSettings || {})};
        const de1Settings = ${JSON.stringify(de1Settings || {})};
        const de1AdvancedSettings = ${JSON.stringify(de1AdvancedSettings || {})};
        const webUISkins = ${JSON.stringify(webUISkins || [])};
        const calibrationSettings = ${JSON.stringify(calibrationSettings || {})};
        const presenceSettings = ${JSON.stringify(presenceSettings || {})};

        // Update calibration setting function
        async function updateCalibrationSetting(key, value) {
            try {
                const payload = {};
                payload[key] = value;

                const response = await fetch('http://localhost:8080/api/v1/machine/calibration', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                if (response.ok || response.status === 202) {
                    showToast('Calibration setting updated successfully', false);
                    document.getElementById('timestamp').textContent = new Date().toLocaleString();
                } else {
                    const error = await response.text();
                    showToast('Failed to update calibration setting: ' + error, true);
                }
            } catch (e) {
                showToast('Error updating calibration setting: ' + e.message, true);
            }
        }

        // Update REA setting function
        async function updateReaSetting(key, value) {
            try {
                const payload = {};
                payload[key] = value;

                const response = await fetch('http://localhost:8080/api/v1/settings', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    showToast('REA setting updated successfully', false);
                    document.getElementById('timestamp').textContent = new Date().toLocaleString();
                } else {
                    const error = await response.text();
                    showToast('Failed to update REA setting: ' + error, true);
                }
            } catch (e) {
                showToast('Error updating REA setting: ' + e.message, true);
            }
        }

        // Update DE1 machine setting function
        async function updateDe1Setting(key, value) {
            try {
                const payload = {};
                payload[key] = value;

                const response = await fetch('http://localhost:8080/api/v1/machine/settings', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                if (response.ok || response.status === 202) {
                    showToast('Machine setting updated successfully', false);
                    document.getElementById('timestamp').textContent = new Date().toLocaleString();
                } else {
                    const error = await response.text();
                    showToast('Failed to update machine setting: ' + error, true);
                }
            } catch (e) {
                showToast('Error updating machine setting: ' + e.message, true);
            }
        }

        // Show toast notification function
        function showToast(message, isError = false) {
            const toastContainer = document.getElementById('toast-container');
            if (!toastContainer) return;

            const toast = document.createElement('div');
            toast.className = isError ? 'error-toast' : 'success-toast';
            toast.textContent = message;
            toastContainer.appendChild(toast);

            // Auto-remove after 3 seconds
            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transition = 'opacity 0.3s';
                setTimeout(() => {
                    toast.remove();
                }, 300);
            }, 3000);
        }

        // Render main categories
        function renderMainCategories() {
            const panel = document.getElementById('main-categories-panel');
            if (!panel) return;

            let html = '<nav><ul style="list-style: none; padding: 0; margin: 0;">';

            for (const [key, category] of Object.entries(settingsTree)) {
                html += \`
                    <li>
                        <button class="main-category-btn \${key === 'quickadjustments' ? 'active' : ''}" 
                                data-category="\${key}"
                                onclick="handleMainCategoryClick('\${key}', this)">
                            \${category.name}
                        </button>
                    </li>
                \`;
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
                html += \`
                    <li>
                        <button class="subcategory-btn \${index === 0 ? 'active' : ''}" 
                                data-category="\${subcat.settingsCategory}"
                                onclick="handleSubcategoryClick('\${subcat.settingsCategory}', this, '\${subcat.name}')">
                            \${subcat.name}
                        </button>
                    </li>
                \`;
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
            contentArea.innerHTML = \`
                <div class="settings-loading-state">
                    <div class="settings-page-title">
                        <p>\${displayName}</p>
                    </div>
                    <div style="color: var(--text-primary); padding: 16px; font-size: 24px; text-align: center; width: 100%;">Loading settings...</div>
                </div>
            \`;

            // Render actual settings content based on category
            setTimeout(() => {
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
                    case 'presence_sleep':
                        content = renderPresenceSettings(presenceSettings);
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
                    case 'calibration':
                        content = renderCalibrationSettings();
                        break;
                    case 'refillkit':
                        content = renderCalibrationSettings();
                        break;
                    case 'voltage':
                        content = renderCalibrationSettings();
                        break;
                    case 'fan':
                        content = renderFanThresholdSettings(de1Settings);
                        break;
                    case 'stopatweight':
                        content = renderCalibrationSettings();
                        break;
                    case 'slowstart':
                        content = renderCalibrationSettings();
                        break;
                    case 'maintenance':
                        content = renderMaintenanceSettings();
                        break;
                    case 'transportmode':
                        content = renderMaintenanceSettings();
                        break;
                    case 'misc':
                        content = renderMiscellaneousSettings();
                        break;
                    case 'de1':
                        content = renderMiscellaneousSettings();
                        break;
                    default:
                        content = \`
                            <div class="settings-flex-container">
                                <div class="settings-page-title">
                                    <p>\${displayName}</p>
                                </div>
                                <div class="settings-divider"><hr /></div>
                                <div class="setting-description">
                                    <p>Settings content for \${displayName} coming soon.</p>
                                </div>
                            </div>
                        \`;
                }
                
                contentArea.innerHTML = content;
            }, 100);
        }

        // Render Flow Multiplier settings
        function renderFlowMultiplierSettings(settings) {
            if (!settings) {
                return \`
                    <div class="settings-flex-container">
                        <div class="settings-page-title">
                            <p>Flow Multiplier Settings</p>
                        </div>
                        <div class="settings-error-text">Failed to load flow multiplier settings</div>
                    </div>
                \`;
            }

            return \`
                <div class="settings-flex-container">
                    <div class="settings-page-title">
                        <p>Flow Multiplier Settings</p>
                    </div>
                    <div class="settings-divider"><hr /></div>
                    <div class="settings-section-flex">
                        <div class="setting-row-flex">
                            <div class="setting-label-bold">
                                <p id="weight-flow-multiplier-label">Weight Flow Multiplier</p>
                            </div>
                            <div class="setting-control-flex">
                                <input type="number" id="weightFlowMultiplierInput" aria-labelledby="weight-flow-multiplier-label" class="settings-input-primary"
                                       value="\${settings.weightFlowMultiplier !== undefined ? settings.weightFlowMultiplier : 1.0}"
                                       step="0.1" min="0" max="5">
                                <button class="settings-btn-primary" aria-label="Save weight flow multiplier setting"
                                        onclick="updateReaSetting('weightFlowMultiplier', parseFloat(document.getElementById('weightFlowMultiplierInput').value))">
                                    Save
                                </button>
                            </div>
                        </div>
                        <p class="setting-description">
                            Multiplier for projected weight calculation. Higher values stop shots earlier.
                        </p>
                    </div>
                    <div class="settings-divider"><hr /></div>
                    <div class="settings-section-flex">
                        <div class="setting-row-flex">
                            <div class="setting-label-bold">
                                <p id="volume-flow-multiplier-label">Volume Flow Multiplier (s)</p>
                            </div>
                            <div class="setting-control-flex">
                                <input type="number" id="volumeFlowMultiplierInput" aria-labelledby="volume-flow-multiplier-label" class="settings-input-primary"
                                       value="\${settings.volumeFlowMultiplier !== undefined ? settings.volumeFlowMultiplier : 0.3}"
                                       step="0.05" min="0" max="2">
                                <button class="settings-btn-primary"
                                        onclick="updateReaSetting('volumeFlowMultiplier', parseFloat(document.getElementById('volumeFlowMultiplierInput').value))">
                                    Save
                                </button>
                            </div>
                        </div>
                        <p class="setting-description">
                            Look-ahead time in seconds for projected volume calculation. Accounts for system lag.
                        </p>
                    </div>
                </div>
            \`;
        }

        // Render REA settings form
        function renderReaSettingsForm(settings) {
            if (!settings) {
                return \`
                    <div class="settings-flex-container">
                        <div class="settings-page-title">
                            <p>Bridge Application Settings</p>
                        </div>
                        <div class="settings-error-text">Failed to load REA settings</div>
                    </div>
                \`;
            }

            return \`
                <div class="settings-flex-container">
                    <div class="settings-page-title">
                        <p>Bridge Application Settings</p>
                    </div>
                    <div class="settings-divider"><hr /></div>
                    
                    <!-- Gateway Mode -->
                    <div class="settings-section-flex">
                        <div class="setting-row-flex-column">
                            <div class="setting-label-bold">
                                <p id="gateway-mode-label">Gateway Mode</p>
                            </div>
                            <div class="toggle-button-group" role="group" aria-labelledby="gateway-mode-label">
                                <button class="toggle-btn \${settings.gatewayMode === 'disabled' ? 'active' : 'inactive'}"
                                        aria-pressed="\${settings.gatewayMode === 'disabled'}"
                                        onclick="updateReaSetting('gatewayMode', 'disabled')">
                                    Disabled
                                </button>
                                <button class="toggle-btn \${settings.gatewayMode === 'tracking' ? 'active' : 'inactive'}"
                                        aria-pressed="\${settings.gatewayMode === 'tracking'}"
                                        onclick="updateReaSetting('gatewayMode', 'tracking')">
                                    Tracking
                                </button>
                                <button class="toggle-btn \${settings.gatewayMode === 'full' ? 'active' : 'inactive'}"
                                        aria-pressed="\${settings.gatewayMode === 'full'}"
                                        onclick="updateReaSetting('gatewayMode', 'full')">
                                    Full
                                </button>
                            </div>
                        </div>
                        <p class="setting-description">
                            Controls how the gateway monitors and controls the espresso machine
                        </p>
                    </div>
                    
                    <div class="settings-divider"><hr /></div>
                    
                    <!-- Log Level -->
                    <div class="settings-section-flex">
                        <div class="setting-row-flex">
                            <div class="setting-label-bold">
                                <p id="log-level-label">Log Level</p>
                            </div>
                            <div class="setting-control-flex">
                                <select id="logLevelSelect" class="settings-input-wide"
                                        aria-labelledby="log-level-label"
                                        onchange="updateReaSetting('logLevel', this.value)">
                                    <option value="ALL" \${settings.logLevel === 'ALL' ? 'selected' : ''}>ALL</option>
                                    <option value="FINEST" \${settings.logLevel === 'FINEST' ? 'selected' : ''}>FINEST</option>
                                    <option value="FINER" \${settings.logLevel === 'FINER' ? 'selected' : ''}>FINER</option>
                                    <option value="FINE" \${settings.logLevel === 'FINE' ? 'selected' : ''}>FINE</option>
                                    <option value="CONFIG" \${settings.logLevel === 'CONFIG' ? 'selected' : ''}>CONFIG</option>
                                    <option value="INFO" \${settings.logLevel === 'INFO' ? 'selected' : ''}>INFO</option>
                                    <option value="WARNING" \${settings.logLevel === 'WARNING' ? 'selected' : ''}>WARNING</option>
                                    <option value="SEVERE" \${settings.logLevel === 'SEVERE' ? 'selected' : ''}>SEVERE</option>
                                    <option value="SHOUT" \${settings.logLevel === 'SHOUT' ? 'selected' : ''}>SHOUT</option>
                                    <option value="OFF" \${settings.logLevel === 'OFF' ? 'selected' : ''}>OFF</option>
                                </select>
                            </div>
                        </div>
                        <p class="setting-description">
                            Controls the verbosity of Bridge application logging
                        </p>
                    </div>
                    
                    <div class="settings-divider"><hr /></div>
                    
                    <!-- Scale Power Mode -->
                    <div class="settings-section-flex">
                        <div class="setting-row-flex">
                            <div class="setting-label-bold">
                                <p>Scale Power Mode</p>
                            </div>
                            <div class="setting-control-flex">
                                <select class="settings-input-wide"
                                        onchange="updateReaSetting('scalePowerMode', this.value)">
                                    <option value="disabled" \${settings.scalePowerMode === 'disabled' ? 'selected' : ''}>Disabled</option>
                                    <option value="displayOff" \${settings.scalePowerMode === 'displayOff' ? 'selected' : ''}>Display Off</option>
                                    <option value="disconnect" \${settings.scalePowerMode === 'disconnect' ? 'selected' : ''}>Disconnect</option>
                                </select>
                            </div>
                        </div>
                        <p class="setting-description">
                            Automatic scale power management when machine sleeps
                        </p>
                    </div>
                </div>
            \`;
        }

        // Render Steam settings
        function renderSteamSettings(settings) {
            if (!settings) {
                return \`
                    <div class="settings-flex-container">
                        <div class="settings-page-title">
                            <p>Steam Settings</p>
                        </div>
                        <div class="settings-error-text">Failed to load DE1 settings</div>
                    </div>
                \`;
            }

            return \`
                <div class="settings-flex-container">
                    <div class="settings-page-title">
                        <p>Steam Settings</p>
                    </div>
                    <div class="settings-divider"><hr /></div>
                    <div class="settings-section-flex">
                        <div class="setting-row-flex">
                            <div class="setting-label-bold">
                                <p>Steam Purge Mode</p>
                            </div>
                            <div class="setting-control-flex">
                                <select class="settings-input-wide"
                                        onchange="updateDe1Setting('steamPurgeMode', parseInt(this.value))">
                                    <option value="0" \${settings.steamPurgeMode === 0 ? 'selected' : ''}>Normal</option>
                                    <option value="1" \${settings.steamPurgeMode === 1 ? 'selected' : ''}>Two Tap Stop</option>
                                </select>
                            </div>
                        </div>
                        <p class="setting-description">
                            Steam purge mode - normal or two tap stop
                        </p>
                    </div>
                </div>
            \`;
        }

        // Render Hot Water settings
        function renderHotWaterSettings(settings) {
            if (!settings) {
                return \`
                    <div class="settings-flex-container">
                        <div class="settings-page-title">
                            <p>Hot Water Settings</p>
                        </div>
                        <div class="settings-error-text">Failed to load DE1 settings</div>
                    </div>
                \`;
            }

            return \`
                <div class="settings-flex-container">
                    <div class="settings-page-title">
                        <p>Hot Water Settings</p>
                    </div>
                    <div class="settings-divider"><hr /></div>
                    <div class="settings-section-flex">
                        <div class="setting-row-flex">
                            <div class="setting-label-bold">
                                <p>Hot Water Flow (ml/s)</p>
                            </div>
                            <div class="setting-control-flex">
                                <input type="number" id="hotWaterFlowInput" class="settings-input-primary"
                                       value="\${settings.hotWaterFlow !== undefined ? settings.hotWaterFlow : 2.5}"
                                       step="0.1" min="0" max="10">
                                <button class="settings-btn-primary"
                                        onclick="updateDe1Setting('hotWaterFlow', parseFloat(document.getElementById('hotWaterFlowInput').value))">
                                    Save
                                </button>
                            </div>
                        </div>
                        <p class="setting-description">
                            Flow rate for hot water dispensing
                        </p>
                    </div>
                </div>
            \`;
        }

        // Render Water Tank settings
        function renderWaterTankSettings(settings) {
            if (!settings) {
                return \`
                    <div class="settings-flex-container">
                        <div class="settings-page-title">
                            <p>Water Tank Settings</p>
                        </div>
                        <div class="settings-error-text">Failed to load DE1 settings</div>
                    </div>
                \`;
            }

            return \`
                <div class="settings-flex-container">
                    <div class="settings-page-title">
                        <p>Water Tank Settings</p>
                    </div>
                    <div class="settings-divider"><hr /></div>
                    <div class="settings-section-flex">
                        <div class="setting-row-flex">
                            <div class="setting-label-bold">
                                <p>Tank Temperature (°C)</p>
                            </div>
                            <div class="setting-control-flex">
                                <input type="number" id="tankTempInput" class="settings-input-primary"
                                       value="\${settings.tankTemp !== undefined ? settings.tankTemp : 80}"
                                       step="1" min="0" max="100">
                                <button class="settings-btn-primary"
                                        onclick="updateDe1Setting('tankTemp', parseInt(document.getElementById('tankTempInput').value))">
                                    Save
                                </button>
                            </div>
                        </div>
                        <p class="setting-description">
                            Set the water tank temperature in degrees Celsius
                        </p>
                    </div>
                </div>
            \`;
        }

        // Render Flush settings form
        function renderFlushSettingsForm(settings) {
            if (!settings) {
                return \`
                    <div class="settings-flex-container">
                        <div class="settings-page-title">
                            <p>Flush Settings</p>
                        </div>
                        <div class="settings-error-text">Failed to load DE1 settings</div>
                    </div>
                \`;
            }

            return \`
                <div class="settings-flex-container">
                    <div class="settings-page-title">
                        <p>Flush Settings</p>
                    </div>
                    <div class="settings-divider"><hr /></div>
                    <div class="settings-section-flex">
                        <div class="setting-row-flex">
                            <div class="setting-label-bold">
                                <p>Flush Temperature (°C)</p>
                            </div>
                            <div class="setting-control-flex">
                                <input type="number" id="flushTempInput" class="settings-input-primary"
                                       value="\${settings.flushTemp !== undefined ? settings.flushTemp : ''}"
                                       step="0.1" min="0" max="100">
                                <button class="settings-btn-primary"
                                        onclick="updateDe1Setting('flushTemp', parseFloat(document.getElementById('flushTempInput').value))">
                                    Save
                                </button>
                            </div>
                        </div>
                        <p class="setting-description">
                            Target temperature for automatic flush cycles
                        </p>
                    </div>
                    <div class="settings-divider"><hr /></div>
                    <div class="settings-section-flex">
                        <div class="setting-row-flex">
                            <div class="setting-label-bold">
                                <p>Flush Flow (ml/s)</p>
                            </div>
                            <div class="setting-control-flex">
                                <input type="number" id="flushFlowInput" class="settings-input-primary"
                                       value="\${settings.flushFlow !== undefined ? settings.flushFlow : ''}"
                                       step="0.1" min="0" max="10">
                                <button class="settings-btn-primary"
                                        onclick="updateDe1Setting('flushFlow', parseFloat(document.getElementById('flushFlowInput').value))">
                                    Save
                                </button>
                            </div>
                        </div>
                        <p class="setting-description">
                            Flow rate for automatic flush cycles
                        </p>
                    </div>
                </div>
            \`;
        }

        // Render Fan Threshold settings
        function renderFanThresholdSettings(settings) {
            if (!settings) {
                return \`
                    <div class="settings-flex-container">
                        <div class="settings-page-title">
                            <p>Fan Threshold Settings</p>
                        </div>
                        <div class="settings-error-text">Failed to load DE1 settings</div>
                    </div>
                \`;
            }

            return \`
                <div class="settings-flex-container">
                    <div class="settings-page-title">
                        <p>Fan Threshold Settings</p>
                    </div>
                    <div class="settings-divider"><hr /></div>
                    <div class="settings-section-flex">
                        <div class="setting-row-flex">
                            <div class="setting-label-bold">
                                <p id="fan-threshold-label">Fan Threshold (°C)</p>
                            </div>
                            <div class="setting-control-flex">
                                <input type="number" id="fanThresholdInput" aria-labelledby="fan-threshold-label" class="settings-input-primary"
                                       value="\${settings.fan !== undefined ? settings.fan : ''}"
                                       step="1" min="0" max="100">
                                <button class="settings-btn-primary" aria-label="Save fan threshold setting"
                                        onclick="updateDe1Setting('fan', parseInt(document.getElementById('fanThresholdInput').value))">
                                    Save
                                </button>
                            </div>
                        </div>
                        <p class="setting-description">
                            Temperature threshold at which the cooling fan turns on
                        </p>
                    </div>
                </div>
            \`;
        }

        // Render USB Charger Mode settings
        function renderUsbChargerModeSettings(settings) {
            if (!settings) {
                return \`
                    <div class="settings-flex-container">
                        <div class="settings-page-title">
                            <p>USB Charger Mode Settings</p>
                        </div>
                        <div class="settings-error-text">Failed to load DE1 settings</div>
                    </div>
                \`;
            }

            return \`
                <div class="settings-flex-container">
                    <div class="settings-page-title">
                        <p>USB Charger Mode Settings</p>
                    </div>
                    <div class="settings-divider"><hr /></div>
                    <div class="settings-section-flex">
                        <div class="setting-row-flex">
                            <div class="setting-label-bold">
                                <p>USB Charger Mode</p>
                            </div>
                            <div class="setting-control-flex">
                                <select class="settings-input-wide"
                                        onchange="updateDe1Setting('usb', this.value)">
                                    <option value="enable" \${settings.usb ? 'selected' : ''}>Enabled</option>
                                    <option value="disable" \${!settings.usb ? 'selected' : ''}>Disabled</option>
                                </select>
                            </div>
                        </div>
                        <p class="setting-description">
                            Controls whether the USB port provides power for charging devices
                        </p>
                    </div>
                </div>
            \`;
        }

        // Render Presence & Sleep settings
        function renderPresenceSettings(settings) {
            if (!settings) {
                return \`
                    <div class="settings-flex-container">
                        <div class="settings-page-title">
                            <p>Presence & Sleep Settings</p>
                        </div>
                        <div class="settings-error-text">Failed to load presence settings</div>
                    </div>
                \`;
            }

            return \`
                <div class="settings-flex-container">
                    <div class="settings-page-title">
                        <p>Presence & Sleep Settings</p>
                    </div>
                    <div class="settings-divider"><hr /></div>
                    <div class="settings-section-flex">
                        <div class="setting-row-flex">
                            <div class="setting-label-bold">
                                <p>Presence Detection</p>
                            </div>
                            <div class="setting-control-flex">
                                <select class="settings-input-wide" id="presence-enabled">
                                    <option value="true" \${settings.enabled === true ? 'selected' : ''}>Enabled</option>
                                    <option value="false" \${settings.enabled === false ? 'selected' : ''}>Disabled</option>
                                </select>
                                <button class="settings-btn-primary"
                                        onclick="updatePresenceSetting('enabled', document.getElementById('presence-enabled').value === 'true')">
                                    Save
                                </button>
                            </div>
                        </div>
                        <p class="setting-description">
                            Enable or disable presence detection for automatic wake/sleep
                        </p>
                    </div>
                    <div class="settings-divider"><hr /></div>
                    <div class="settings-section-flex">
                        <div class="setting-row-flex">
                            <div class="setting-label-bold">
                                <p>Sensitivity</p>
                            </div>
                            <div class="setting-control-flex">
                                <input type="number" id="presence-sensitivity" class="settings-input-primary"
                                       value="\${settings.sensitivity !== undefined ? settings.sensitivity : 5}"
                                       step="1" min="1" max="10">
                                <button class="settings-btn-primary"
                                        onclick="updatePresenceSetting('sensitivity', parseInt(document.getElementById('presence-sensitivity').value))">
                                    Save
                                </button>
                            </div>
                        </div>
                        <p class="setting-description">
                            Adjust presence detection sensitivity (1-10)
                        </p>
                    </div>
                    <div class="settings-divider"><hr /></div>
                    <div class="settings-section-flex">
                        <div class="setting-row-flex">
                            <div class="setting-label-bold">
                                <p>Auto Sleep Delay (minutes)</p>
                            </div>
                            <div class="setting-control-flex">
                                <input type="number" id="sleep-delay" class="settings-input-primary"
                                       value="\${settings.sleepDelay !== undefined ? settings.sleepDelay : 30}"
                                       step="5" min="5" max="120">
                                <button class="settings-btn-primary"
                                        onclick="updatePresenceSetting('sleepDelay', parseInt(document.getElementById('sleep-delay').value))">
                                    Save
                                </button>
                            </div>
                        </div>
                        <p class="setting-description">
                            Time before machine auto-sleeps when no presence detected
                        </p>
                    </div>
                </div>
            \`;
        }

        // Render DE1 Advanced settings form
        function renderDe1AdvancedSettingsForm(settings) {
            if (!settings) {
                return \`
                    <div class="settings-flex-container">
                        <div class="settings-page-title">
                            <p>Machine Advanced Settings</p>
                        </div>
                        <div class="settings-error-text">Failed to load machine advanced settings</div>
                    </div>
                \`;
            }

            return \`
                <div class="settings-flex-container">
                    <div class="settings-page-title">
                        <p>Machine Advanced Settings</p>
                    </div>
                    <div class="settings-divider"><hr /></div>
                    <div class="settings-section-flex">
                        <div class="setting-row-flex">
                            <div class="setting-label-bold">
                                <p>Heater Phase 1 Flow (ml/s)</p>
                            </div>
                            <div class="setting-control-flex">
                                <input type="number" id="heaterPh1FlowInput" class="settings-input-primary"
                                       value="\${settings.heaterPh1Flow !== undefined ? settings.heaterPh1Flow : ''}"
                                       step="0.1" min="0" max="10">
                                <button class="settings-btn-primary"
                                        onclick="updateDe1AdvancedSetting('heaterPh1Flow', parseFloat(document.getElementById('heaterPh1FlowInput').value))">
                                    Save
                                </button>
                            </div>
                        </div>
                        <p class="setting-description">
                            Flow rate during heater phase 1
                        </p>
                    </div>
                    <div class="settings-divider"><hr /></div>
                    <div class="settings-section-flex">
                        <div class="setting-row-flex">
                            <div class="setting-label-bold">
                                <p>Heater Phase 2 Flow (ml/s)</p>
                            </div>
                            <div class="setting-control-flex">
                                <input type="number" id="heaterPh2FlowInput" class="settings-input-primary"
                                       value="\${settings.heaterPh2Flow !== undefined ? settings.heaterPh2Flow : ''}"
                                       step="0.1" min="0" max="10">
                                <button class="settings-btn-primary"
                                        onclick="updateDe1AdvancedSetting('heaterPh2Flow', parseFloat(document.getElementById('heaterPh2FlowInput').value))">
                                    Save
                                </button>
                            </div>
                        </div>
                        <p class="setting-description">
                            Flow rate during heater phase 2
                        </p>
                    </div>
                </div>
            \`;
        }

        // Render Skin settings
        function renderSkinSettings() {
            return \`
                <div class="settings-flex-container">
                    <div class="settings-page-title">
                        <p>Skin Settings</p>
                    </div>
                    <div class="settings-divider"><hr /></div>
                    <div class="settings-section-flex">
                        <div class="setting-row-flex">
                            <div class="setting-label-bold">
                                <p>Theme</p>
                            </div>
                            <div class="btn-status">
                                <input type="checkbox" name="theme-toggle" id="theme-toggle" class="hidden" />
                                <label for="theme-toggle" style="display: inline-flex; align-items: center; width: 36px; height: 18px; border-radius: 18px; cursor: pointer; background-color: var(--text-secondary); position: relative; transition: background-color 0.2s;"></label>
                            </div>
                        </div>
                        <p class="setting-description">
                            Toggle between light and dark themes
                        </p>
                    </div>
                </div>
            \`;
        }

        // Render Language settings
        function renderLanguageSettings() {
            return \`
                <div class="settings-flex-container">
                    <div class="settings-page-title">
                        <p>Language Settings</p>
                    </div>
                    <div class="settings-divider"><hr /></div>
                    <div class="settings-section-flex">
                        <div class="setting-row-flex">
                            <div class="setting-label-bold">
                                <p>Display Language</p>
                            </div>
                            <select id="language-switcher" class="settings-input-wide">
                                <option>English</option>
                                <option>Spanish</option>
                                <option>French</option>
                            </select>
                        </div>
                        <p class="setting-description">
                            Choose the language for the application interface
                        </p>
                    </div>
                </div>
            \`;
        }

        // Render Extensions settings
        function renderExtensionsSettings() {
            return \`
                <div class="settings-flex-container">
                    <div class="settings-page-title">
                        <p>Extensions Settings</p>
                    </div>
                    <div class="settings-divider"><hr /></div>
                    <div class="settings-section-flex">
                        <div class="setting-row-flex">
                            <div class="setting-label-bold">
                                <p>Visualizer</p>
                            </div>
                            <select id="visualizer-enabled" class="settings-input-wide">
                                <option value="true">Enabled</option>
                                <option value="false">Disabled</option>
                            </select>
                        </div>
                        <p class="setting-description">
                            Enable/disable Visualizer integration
                        </p>
                    </div>
                </div>
            \`;
        }

        // Render Updates settings
        function renderUpdatesSettings() {
            return \`
                <div class="settings-flex-container">
                    <div class="settings-page-title">
                        <p>Updates Settings</p>
                    </div>
                    <div class="settings-divider"><hr /></div>
                    <div class="settings-section-flex">
                        <div class="setting-row-flex">
                            <div class="setting-label-bold">
                                <p>Firmware Update</p>
                            </div>
                            <button class="settings-btn-wide">Check</button>
                        </div>
                        <p class="setting-description">
                            Check for firmware updates
                        </p>
                    </div>
                    <div class="settings-divider"><hr /></div>
                    <div class="settings-section-flex">
                        <div class="setting-row-flex">
                            <div class="setting-label-bold">
                                <p>App Update</p>
                            </div>
                            <button class="settings-btn-wide">Check</button>
                        </div>
                        <p class="setting-description">
                            Check for application updates
                        </p>
                    </div>
                </div>
            \`;
        }

        // Render User Manual settings
        function renderUserManualSettings() {
            return \`
                <div class="settings-flex-container">
                    <div class="settings-page-title">
                        <p>User Manual</p>
                    </div>
                    <div class="settings-divider"><hr /></div>
                    <div class="settings-section-flex">
                        <div class="setting-row-flex">
                            <div class="setting-label-bold">
                                <p>Online Help</p>
                            </div>
                            <a href="https://decentespresso.com/support/submit" target="_blank" class="settings-btn-wide" style="text-decoration: none; display: flex; align-items: center; justify-content: center;">
                                Visit
                            </a>
                        </div>
                        <p class="setting-description">
                            Get support and submit tickets for assistance
                        </p>
                    </div>
                    <div class="settings-divider"><hr /></div>
                    <div class="settings-section-flex">
                        <div class="setting-row-flex">
                            <div class="setting-label-bold">
                                <p>Tutorials</p>
                            </div>
                            <a href="https://decentespresso.com/doc/quickstart/" target="_blank" class="settings-btn-wide" style="text-decoration: none; display: flex; align-items: center; justify-content: center;">
                                View
                            </a>
                        </div>
                        <p class="setting-description">
                            Learn how to get started with your espresso machine
                        </p>
                    </div>
                </div>
            \`;
        }

        // Render Calibration settings
        function renderCalibrationSettings() {
            return \`
                <div class="settings-flex-container">
                    <div class="settings-page-title">
                        <p>Calibration Settings</p>
                    </div>
                    <div class="settings-divider"><hr /></div>
                    
                    <!-- Default Load Settings -->
                    <div class="settings-section-flex">
                        <div class="setting-row-flex">
                            <div class="setting-label-bold">
                                <p>Default Load Settings</p>
                            </div>
                            <button class="settings-btn-wide" onclick="updateCalibrationSetting('defaultLoad', 0)">Reset</button>
                        </div>
                        <p class="setting-description">
                            Reset to default calibration values
                        </p>
                    </div>
                    
                    <div class="settings-divider"><hr /></div>
                    
                    <!-- Refill Kit -->
                    <div class="settings-section-flex">
                        <div class="setting-row-flex">
                            <div class="setting-label-bold">
                                <p>Refill Kit</p>
                            </div>
                            <button class="settings-btn-wide" onclick="window.calibrateRefillKit()">Calibrate</button>
                        </div>
                        <p class="setting-description">
                            Calibrate refill kit settings
                        </p>
                    </div>
                    
                    <div class="settings-divider"><hr /></div>
                    
                    <!-- Voltage -->
                    <div class="settings-section-flex">
                        <div class="setting-row-flex">
                            <div class="setting-label-bold">
                                <p>Voltage</p>
                            </div>
                            <div class="setting-control-flex">
                                <input type="number" id="voltageInput" class="settings-input-primary"
                                       value="\${calibrationSettings.voltage !== undefined ? calibrationSettings.voltage : 120}"
                                       step="0.1" min="0" max="240">
                                <button class="settings-btn-primary"
                                        onclick="updateCalibrationSetting('voltage', parseFloat(document.getElementById('voltageInput').value))">
                                    Save
                                </button>
                            </div>
                        </div>
                        <p class="setting-description">
                            Set voltage calibration
                        </p>
                    </div>
                    
                    <div class="settings-divider"><hr /></div>
                    
                    <!-- Flow Estimation Multiplier -->
                    <div class="settings-section-flex">
                        <div class="setting-row-flex">
                            <div class="setting-label-bold">
                                <p>Flow Estimation Multiplier</p>
                            </div>
                            <div class="setting-control-flex">
                                <input type="number" id="flowEstimationMultiplierInput" class="settings-input-primary"
                                       value="\${calibrationSettings.flowEstimationMultiplier !== undefined ? calibrationSettings.flowEstimationMultiplier : 1.0}"
                                       step="0.1" min="0" max="5">
                                <button class="settings-btn-primary"
                                        onclick="updateCalibrationSetting('flowEstimationMultiplier', parseFloat(document.getElementById('flowEstimationMultiplierInput').value))">
                                    Save
                                </button>
                            </div>
                        </div>
                        <p class="setting-description">
                            Multiplier for flow estimation calibration
                        </p>
                    </div>
                    
                    <div class="settings-divider"><hr /></div>
                    
                    <!-- Stop at Weight -->
                    <div class="settings-section-flex">
                        <div class="setting-row-flex">
                            <div class="setting-label-bold">
                                <p>Stop at Weight</p>
                            </div>
                            <div class="setting-control-flex">
                                <input type="number" id="stopAtWeightInput" class="settings-input-primary"
                                       value="\${calibrationSettings.stopAtWeight !== undefined ? calibrationSettings.stopAtWeight : 36}"
                                       step="0.1" min="0" max="100">
                                <button class="settings-btn-primary"
                                        onclick="updateCalibrationSetting('stopAtWeight', parseFloat(document.getElementById('stopAtWeightInput').value))">
                                    Save
                                </button>
                            </div>
                        </div>
                        <p class="setting-description">
                            Set weight target for stopping shots
                        </p>
                    </div>
                    
                    <div class="settings-divider"><hr /></div>
                    
                    <!-- Slow Start -->
                    <div class="settings-section-flex">
                        <div class="setting-row-flex">
                            <div class="setting-label-bold">
                                <p>Slow Start</p>
                            </div>
                            <div class="setting-control-flex">
                                <select class="settings-input-wide"
                                        onchange="updateCalibrationSetting('slowStart', this.value === 'Enabled')">
                                    <option value="Enabled" \${calibrationSettings.slowStart === true ? 'selected' : ''}>Enabled</option>
                                    <option value="Disabled" \${calibrationSettings.slowStart === false ? 'selected' : ''}>Disabled</option>
                                </select>
                            </div>
                        </div>
                        <p class="setting-description">
                            Enable slow start for smoother extraction
                        </p>
                    </div>
                    
                    <div class="settings-divider"><hr /></div>
                    
                    <!-- Steam Calibration -->
                    <div class="settings-section-flex">
                        <div class="setting-row-flex">
                            <div class="setting-label-bold">
                                <p>Steam</p>
                            </div>
                            <div class="setting-control-flex">
                                <input type="number" id="steamCalibrationInput" class="settings-input-primary"
                                       value="\${calibrationSettings.steam !== undefined ? calibrationSettings.steam : 120}"
                                       step="1" min="0" max="200">
                                <button class="settings-btn-primary"
                                        onclick="updateCalibrationSetting('steam', parseInt(document.getElementById('steamCalibrationInput').value))">
                                    Save
                                </button>
                            </div>
                        </div>
                        <p class="setting-description">
                            Set steam calibration
                        </p>
                    </div>
                </div>
            \`;
        }

        // Render Maintenance settings
        function renderMaintenanceSettings() {
            return \`
                <div class="settings-flex-container">
                    <div class="settings-page-title">
                        <p>Maintenance Settings</p>
                    </div>
                    <div class="settings-divider"><hr /></div>
                    <div class="settings-section-flex">
                        <div class="setting-row-flex">
                            <div class="setting-label-bold">
                                <p>Machine Descaling</p>
                            </div>
                            <button class="settings-btn-wide">Start</button>
                        </div>
                        <p class="setting-description">
                            Run a descaling cycle to remove mineral buildup
                        </p>
                    </div>
                    <div class="settings-divider"><hr /></div>
                    <div class="settings-section-flex">
                        <div class="setting-row-flex">
                            <div class="setting-label-bold">
                                <p>Transport Mode</p>
                            </div>
                            <select class="settings-input-wide">
                                <option>Disabled</option>
                                <option>Enabled</option>
                            </select>
                        </div>
                        <p class="setting-description">
                            Enable transport mode for safe transportation
                        </p>
                    </div>
                </div>
            \`;
        }

        // Render Miscellaneous settings
        function renderMiscellaneousSettings() {
            return \`
                <div class="settings-flex-container">
                    <div class="settings-page-title">
                        <p>Miscellaneous Settings</p>
                    </div>
                    <div class="settings-divider"><hr /></div>
                    <div class="settings-section-flex">
                        <div class="setting-row-flex">
                            <div class="setting-label-bold">
                                <p>Screen Saver</p>
                            </div>
                            <select class="settings-input-wide">
                                <option>Enabled</option>
                                <option>Disabled</option>
                            </select>
                        </div>
                        <p class="setting-description">
                            Enable or disable screen saver functionality
                        </p>
                    </div>
                    <div class="settings-divider"><hr /></div>
                    <div class="settings-section-flex">
                        <div class="setting-row-flex">
                            <div class="setting-label-bold">
                                <p>Brightness</p>
                            </div>
                            <input type="range" min="0" max="100" value="75" style="width: 200px; height: 30px;">
                        </div>
                        <p class="setting-description">
                            Adjust screen brightness level
                        </p>
                    </div>
                    <div class="settings-divider"><hr /></div>
                    <div class="settings-section-flex">
                        <div class="setting-row-flex">
                            <div class="setting-label-bold">
                                <p>App Version</p>
                            </div>
                            <div class="settings-btn-wide" style="display: flex; align-items: center; justify-content: center;">
                                1.0.0
                            </div>
                        </div>
                        <p class="setting-description">
                            Current application version
                        </p>
                    </div>
                </div>
            \`;
        }

        // Render Bluetooth Machine settings
        function renderBluetoothMachineSettings() {
            return \`
                <div class="settings-flex-container">
                    <div class="settings-page-title">
                        <p>Bluetooth Machine</p>
                    </div>
                    <div class="settings-divider"><hr /></div>
                    <div class="settings-section-flex">
                        <div class="setting-row-flex">
                            <div class="setting-label-bold">
                                <p>Espresso Machine</p>
                            </div>
                            <button class="btn-scan" onclick="window.scanForMachines()">Scan</button>
                        </div>
                        <p class="setting-description">
                            Scan and connect to espresso machines
                        </p>
                    </div>
                </div>
            \`;
        }

        // Render Bluetooth Scale settings
        function renderBluetoothScaleSettings() {
            return \`
                <div class="settings-flex-container">
                    <div class="settings-page-title">
                        <p>Bluetooth Scale</p>
                    </div>
                    <div class="settings-divider"><hr /></div>
                    <div class="settings-section-flex">
                        <div class="setting-row-flex">
                            <div class="setting-label-bold">
                                <p>Scale</p>
                            </div>
                            <button class="btn-scan" onclick="window.scanForScales()">Scan</button>
                        </div>
                        <p class="setting-description">
                            Scan and connect to weighing scales
                        </p>
                    </div>
                </div>
            \`;
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
                            mainCategoriesPanel.style.width = \`\${newMainWidth}px\`;
                            subcategoriesPanel.style.width = \`\${newSubWidth}px\`;
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
                            leftPanel.style.width = \`\${newLeftWidth}px\`;
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
                mainHtml += \`
                    <li>
                        <button class="main-category-btn active" 
                                data-category="\${key}"
                                onclick="handleMainCategoryClick('\${key}', this)">
                            \${highlightedName}
                        </button>
                    </li>
                \`;
            }
            mainHtml += '</ul></nav>';
            mainPanel.innerHTML = mainHtml;

            // Auto-select first category's subcategories
            const firstCategory = Object.keys(categoryResults)[0];
            if (firstCategory && categoryResults[firstCategory].subcategories.length > 0) {
                let subHtml = '<ul style="list-style: none; padding: 0; margin: 0;">';
                categoryResults[firstCategory].subcategories.forEach(subcat => {
                    const highlightedName = highlightMatch(subcat.name, searchTerm);
                    subHtml += \`
                        <li>
                            <button class="subcategory-btn active" 
                                    data-category="\${subcat.settingsCategory}"
                                    onclick="handleSubcategoryClick('\${subcat.settingsCategory}', this, '\${subcat.name}')">
                                \${highlightedName}
                            </button>
                        </li>
                    \`;
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
            const regex = new RegExp(\`(\${searchTerm})\`, 'gi');
            return text.replace(regex, '<mark style="background: #fef08a; color: #000; padding: 0 4px; border-radius: 2px;">\$1</mark>');
        }

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
</body>
</html>`;
  }

  // Return the plugin object
  return {
    id: "settings.reaplugin",
    version: "0.0.13",

    onLoad(settings) {
      state.refreshInterval = settings.RefreshInterval !== undefined ? settings.RefreshInterval : 5;
      log(`Loaded with refresh interval: ${state.refreshInterval}s`);
    },

    onUnload() {
      log("Unloaded");
    },

    // HTTP request handler for the 'ui' endpoint
    __httpRequestHandler(request) {
      log(`Received HTTP request for ${request.endpoint}: ${request.method}`);

      if (request.endpoint === "ui") {
        // Fetch all settings and generate HTML
        return Promise.all([
          fetchReaSettings(),
          fetchDe1Settings(),
          fetchDe1AdvancedSettings(),
          fetchWebUISkins(),
          fetchCalibrationSettings(),
          fetchPresenceSettings()
        ]).then(([reaSettings, de1Settings, de1AdvancedSettings, webUISkins, calibrationSettings, presenceSettings]) => {
          const html = generateSettingsHTML(reaSettings, de1Settings, de1AdvancedSettings, webUISkins, calibrationSettings, presenceSettings);
          
          return {
            requestId: request.requestId,
            status: 200,
            headers: {
              'Content-Type': 'text/html; charset=utf-8',
              'Cache-Control': 'no-cache'
            },
            body: html
          };
        }).catch((error) => {
          log(`Error generating settings page: ${error.message}`);
          return {
            requestId: request.requestId,
            status: 500,
            headers: {
              'Content-Type': 'text/plain'
            },
            body: `Error generating settings page: ${error.message}`
          };
        });
      }

      // Default 404 response
      return {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: "Endpoint not found" })
      };
    },

    onEvent(event) {
      if (!event || !event.name) return;

      // This plugin doesn't need to respond to state updates
      // It only serves HTTP requests on demand
      switch (event.name) {
        case "shutdown":
          log("Shutdown event received");
          break;
      }
    },
  };
}
