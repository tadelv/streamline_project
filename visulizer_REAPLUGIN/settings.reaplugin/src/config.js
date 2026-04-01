export const API_BASE_URL = "http://localhost:8080/api/v1";
export const SEARCH_RESULTS_MAIN_KEY = "__search_results__";
export const STORAGE_KEYS = {
  wakeLockEnabled: "wakeLockEnabled",
  presenceActiveHours: "settingsPresenceActiveHours",
};
export const DEFAULT_REFRESH_INTERVAL = 5;
export const DEFAULT_MAIN_CATEGORY_KEY = "quickadjustments";
export const DEFAULT_DEVICE_STATE_CACHE = {
  devices: [],
  scanning: false,
  initialized: false,
};
export const INITIAL_SETTINGS_CACHE = {
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
  machineInfoError: null,
};

export const settingsTree = {
  quickadjustments: {
    name: "1. Quick Adjustments",
    subcategories: [
      { id: "flowmultiplier", name: "Flow Multiplier", settingsCategory: "flowmultiplier" },
      { id: "steam", name: "Steam", settingsCategory: "steam" },
      { id: "hotwater", name: "Hot Water", settingsCategory: "hotwater" },
      { id: "watertank", name: "Water Tank", settingsCategory: "watertank" },
      { id: "flush", name: "Flush", settingsCategory: "flush" },
    ],
  },
  bluetooth: {
    name: "2. Bluetooth",
    subcategories: [
      { id: "ble_machine", name: "1. Machine", settingsCategory: "ble_machine" },
      { id: "ble_scale", name: "2. Scale", settingsCategory: "ble_scale" },
    ],
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
      { id: "steam_cal", name: "Steam", settingsCategory: "steam" },
    ],
  },
  machine: {
    name: "4. Machine",
    subcategories: [
      { id: "fanthreshold", name: "Fan Threshold", settingsCategory: "fanthreshold" },
      { id: "usbchargermode", name: "USB Charger Mode", settingsCategory: "usbchargermode" },
    ],
  },
  maintenance: {
    name: "5. Maintenance",
    subcategories: [
      { id: "machinedescaling", name: "Machine Descaling", settingsCategory: "maintenance" },
      { id: "transportmode", name: "Transport mode", settingsCategory: "transportmode" },
    ],
  },
  skin: {
    name: "6. Skin",
    subcategories: [
      { id: "skin1", name: "Theme", settingsCategory: "appearance" },
    ],
  },
  language: {
    name: "7. Language",
    subcategories: [
      { id: "selectlanguage", name: "Select Language", settingsCategory: "language" },
    ],
  },
  extensions: {
    name: "8. Extensions",
    subcategories: [
      { id: "extention1", name: "Visualizer", settingsCategory: "extensions" },
      { id: "extention2", name: "Extention 2", settingsCategory: "extensions" },
    ],
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
      { id: "machineadvancedsettings", name: "Machine Advanced Settings", settingsCategory: "de1advanced" },
    ],
  },
  updates: {
    name: "10. Updates",
    subcategories: [
      { id: "firmwareupdate", name: "Firmware Update", settingsCategory: "updates" },
      { id: "appupdate", name: "App Update", settingsCategory: "updates" },
    ],
  },
  usermanual: {
    name: "11. User Manual",
    subcategories: [
      { id: "onlinehelp", name: "Online Help", settingsCategory: "help" },
      { id: "tutorials", name: "Tutorials", settingsCategory: "help" },
    ],
  },
};

export function createInitialSettingsCache() {
  return { ...INITIAL_SETTINGS_CACHE };
}

export function getBrowserBootstrapData({
  reaSettings,
  de1Settings,
  de1AdvancedSettings,
  webUISkins,
  calibrationSettings,
  presenceSettings,
  appInfo,
  machineInfo,
  activeSettingsCategory,
  activeMainCategoryKey,
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
      presenceActiveHours: STORAGE_KEYS.presenceActiveHours,
    },
    settingsCache: createInitialSettingsCache(),
    defaultDeviceStateCache: { ...DEFAULT_DEVICE_STATE_CACHE },
  };
}
