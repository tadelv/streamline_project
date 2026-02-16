import { getReaSettings, getDe1Settings, getDe1AdvancedSettings, setReaSettings, setDe1Settings, setDe1AdvancedSettings } from '/src/modules/api.js';
import * as ui from '/src/modules/ui.js';
import { initScaling } from '/src/modules/scaling.js';
import { loadPage } from '/src/modules/router.js';
import { getSupportedLanguages, getCurrentLanguage, setLanguage } from '/src/modules/i18n.js';

// Enhanced cache for settings data with loading states
let settingsCache = {
    rea: null,
    de1: null,
    de1Advanced: null,
    reaLoading: false,
    de1Loading: false,
    de1AdvancedLoading: false,
    reaError: null,
    de1Error: null,
    de1AdvancedError: null
};

let activeSettingsCategory = null; // New global variable to track the currently active category

// Render generic loading state
function renderLoadingState(title) {
    return `
        <div class="flex flex-col gap-[60px] items-start relative w-full max-w-full overflow-x-hidden">
            <div class="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] not-italic relative text-[var(--text-primary)] text-[36px] text-center w-full">
                <p class="leading-[1.2]">${title}</p>
            </div>
            <div class="text-[var(--text-primary)] p-4 text-[24px] text-center w-full">Loading settings...</div>
        </div>
    `;
}

// Render generic error state
function renderErrorState(title, message) {
    return `
        <div class="flex flex-col gap-[60px] items-start relative w-full max-w-full overflow-x-hidden">
            <div class="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] not-italic relative text-[var(--text-primary)] text-[36px] text-center w-full">
                <p class="leading-[1.2]">${title}</p>
            </div>
            <div class="text-red-500 p-4 text-[24px] text-center w-full">Failed to load settings: ${message}</div>
            <button class="bg-[#385a92] h-[62.88px] rounded-[10px] w-[200px] text-white text-[24px] font-bold mx-auto mt-4" onclick="window.retryLoadSettings()">Retry</button>
        </div>
    `;
}

// Helper function to update the settings content area in the DOM
function updateSettingsContentArea(category) {
    const contentArea = document.getElementById('settings-content-area');
    if (contentArea) {
        contentArea.innerHTML = renderSettingsContent(category);
        // Initialize theme toggle if we're on the appearance/skin settings
        if (category === 'appearance') {
            setTimeout(() => {
                ui.initThemeToggle();
            }, 100); // Small delay to ensure DOM is updated
        }
    }
}

// Define the tree structure for settings navigation
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
            { id: 'espressomachine', name: 'Espresso Machine', settingsCategory: 'bluetooth' },
            { id: 'weighingscale', name: 'Weighing Scale', settingsCategory: 'bluetooth' }
        ]
    },
    'calibration': {
        name: 'Calibration',
        subcategories: [
            { id: 'defaultloadsettings', name: 'Default load settings', settingsCategory: 'calibration' },
            { id: 'refillkit', name: 'Refill Kit', settingsCategory: 'calibration' },
            { id: 'voltage', name: 'Voltage', settingsCategory: 'calibration' },
            { id: 'fan', name: 'Fan', settingsCategory: 'de1' },
            { id: 'stopatweight', name: 'Stop at weight', settingsCategory: 'de1' },
            { id: 'slowstart', name: 'Slow start', settingsCategory: 'de1' },
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
            { id: 'transportmode', name: 'Transport mode', settingsCategory: 'maintenance' }
        ]
    },
    'skin': {
        name: 'Skin',
        subcategories: [
            { id: 'skin1', name: 'Theme', settingsCategory: 'appearance' }
        ]
    },
    'language': {
        name: 'Language',
        subcategories: [
            { id: 'selectlanguage', name: 'Select Language', settingsCategory: 'language' },
        ]
    },
    'extensions': {
        name: 'Extensions',
        subcategories: [
            { id: 'extention1', name: 'Visualizer', settingsCategory: 'extensions' },
            { id: 'extention2', name: 'Extention 2', settingsCategory: 'extensions' }
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

// Cache for loading promise to prevent multiple simultaneous requests
let settingsLoadingPromise = null;

// Load all settings data
export async function loadSettings() {
    // If we're already loading, return the same promise
    if (settingsLoadingPromise) {
        return settingsLoadingPromise;
    }

    settingsLoadingPromise = _loadSettingsInternal();
    return settingsLoadingPromise;
}

// Internal function to actually load settings
async function _loadSettingsInternal() {
    try {
        // Fetch all settings in parallel
        const [reaSettings, de1Settings, de1AdvancedSettings] = await Promise.all([
            getReaSettings(),
            getDe1Settings(),
            getDe1AdvancedSettings()
        ]);

        settingsCache.rea = reaSettings;
        settingsCache.de1 = de1Settings;
        settingsCache.de1Advanced = de1AdvancedSettings;

        return { reaSettings, de1Settings, de1AdvancedSettings };
    } catch (error) {
        console.error('Error loading settings:', error);
        ui.showToast('Failed to load settings', 5000, 'error');
        return { reaSettings: null, de1Settings: null, de1AdvancedSettings: null };
    } finally {
        // Clear the loading promise after completion
        settingsLoadingPromise = null;
    }
}

// Helper function to check if settings are loaded
function areSettingsLoaded() {
    return settingsCache.rea !== null &&
           settingsCache.de1 !== null &&
           settingsCache.de1Advanced !== null;
}

// Update REA settings
export async function updateReaSetting(key, value) {
    try {
        const payload = { [key]: value };
        await setReaSettings(payload);
        settingsCache.rea[key] = value;
        ui.showToast('REA setting updated successfully', 3000, 'success');
        if (activeSettingsCategory) { // Re-render the current view to reflect changes
            updateSettingsContentArea(activeSettingsCategory);
        }
    } catch (error) {
        console.error('Error updating REA setting:', error);
        ui.showToast(`Failed to update REA setting: ${error.message}`, 5000, 'error');
    }
}

// Update DE1 settings
export async function updateDe1Setting(key, value) {
    try {
        const payload = { [key]: value };
        await setDe1Settings(payload);
        settingsCache.de1[key] = value;
        ui.showToast('DE1 setting updated successfully', 3000, 'success');
        if (activeSettingsCategory) { // Re-render the current view to reflect changes
            updateSettingsContentArea(activeSettingsCategory);
        }
    } catch (error) {
        console.error('Error updating DE1 setting:', error);
        ui.showToast(`Failed to update DE1 setting: ${error.message}`, 5000, 'error');
    }
}

// Update DE1 advanced settings
export async function updateDe1AdvancedSetting(key, value) {
    try {
        const payload = { [key]: value };
        await setDe1AdvancedSettings(payload);
        settingsCache.de1Advanced[key] = value;
        ui.showToast('DE1 advanced setting updated successfully', 3000, 'success');
        if (activeSettingsCategory) { // Re-render the current view to reflect changes
            updateSettingsContentArea(activeSettingsCategory);
        }
    } catch (error) {
        console.error('Error updating DE1 advanced setting:', error);
        ui.showToast(`Failed to update DE1 advanced setting: ${error.message}`, 5000, 'error');
    }
}


// Render settings content based on selected category
export function renderSettingsContent(category) {
    // Determine loading state for the specific category
    let isLoading = false;
    let error = null;

    switch(category) {
        case 'rea':
        case 'quickadjustments':
        case 'flowmultiplier':
            isLoading = settingsCache.reaLoading;
            error = settingsCache.reaError;
            break;
        case 'de1':
        case 'fanthreshold':
        case 'usbchargermode':
        case 'watertank':
        case 'flush':
        case 'steam':
        case 'hotwater':
            isLoading = settingsCache.de1Loading;
            error = settingsCache.de1Error;
            break;
        case 'de1advanced':
            isLoading = settingsCache.de1AdvancedLoading;
            error = settingsCache.de1AdvancedError;
            break;
        default:
            // For categories that don't require specific settings, check if any settings are loading
            isLoading = settingsCache.reaLoading || settingsCache.de1Loading || settingsCache.de1AdvancedLoading;
            break;
    }

    // Show loading state if the required settings are still loading
    if (isLoading) {
        return renderLoadingState(getCategoryTitle(category));
    }

    // Show error state if there was an error loading the required settings
    if (error && (
        category === 'rea' ||
        category === 'quickadjustments' ||
        category === 'flowmultiplier' ||
        category === 'de1' ||
        category === 'fanthreshold' ||
        category === 'usbchargermode' ||
        category === 'watertank' ||
        category === 'flush' ||
        category === 'steam' ||
        category === 'hotwater' ||
        category === 'de1advanced'
    )) {
        return renderErrorState(getCategoryTitle(category), error);
    }

    // Render actual content once settings are loaded
    switch(category) {
        case 'rea':
            return renderReaSettingsForm(settingsCache.rea);
        case 'quickadjustments':
        case 'flowmultiplier':
            return renderFlowMultiplierSettings(settingsCache.rea);
        case 'steam':
            return renderSteamSettings();
        case 'hotwater':
            return renderHotWaterSettings();
        case 'watertank':
            return renderWaterTankSettings();
        case 'flush':
            return renderFlushSettingsForm(settingsCache.de1);
        case 'bluetooth':
        case 'espressomachine':
        case 'weighingscale':
            return renderBluetoothSettings();
        case 'calibration':
        case 'defaultloadsettings':
        case 'refillkit':
        case 'voltage':
        case 'fan':
        case 'stopatweight':
        case 'slowstart':
            return renderCalibrationSettings();
        case 'maintenance':
        case 'machinedescaling':
        case 'transportmode':
            return renderMaintenanceSettings();
        case 'skin':
        case 'appearance':
            return renderSkinSettings();
        case 'language':
        case 'selectlanguage':
            return renderLanguageSettings();
        case 'extensions':
        case 'extention1':
        case 'extention2':
            return renderExtensionsSettings();
        case 'miscellaneous':
        case 'reasettings':
        case 'brightness':
        case 'appversion':
        case 'unitssettings':
        case 'fontsize':
        case 'resolution':
        case 'smartcharging':
        case 'screensaver':
        case 'machineadvancedsettings':
            return renderMiscellaneousSettings();
        case 'updates':
        case 'firmwareupdate':
        case 'appupdate':
            return renderUpdatesSettings();
        case 'usermanual':
        case 'onlinehelp':
        case 'tutorials':
        case 'help':
            console.log("rendering user manual ");
            return renderUserManualSettings();
        case 'de1':
        case 'fanthreshold':
            return renderFanThresholdSettings(settingsCache.de1);
        case 'usbchargermode':
            return renderUsbChargerModeSettings(settingsCache.de1);
        case 'de1advanced':
            return renderDe1AdvancedSettingsForm(settingsCache.de1Advanced);
        case 'hot water':
            return renderHotWaterSettings(settingsCache.de1);
        default:
            return renderGeneralSettings();
    }
}

// Render Flow Multiplier settings
export function renderFlowMultiplierSettings(settings) {
    if (!settings) {
        return `
            <div class="flex flex-col gap-[60px] items-start relative w-full max-w-full overflow-x-hidden">
                <div class="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] not-italic relative text-[var(--text-primary)] text-[36px] text-center w-full">
                    <p class="leading-[1.2]">Flow Multiplier Settings</p>
                </div>
                <div class="text-red-500 p-4 text-[24px]">Failed to load flow multiplier settings</div>
            </div>
        `;
    }

    return `
        <div class="flex flex-col gap-[60px] items-start relative w-full max-w-full overflow-x-hidden">
            <div class="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] not-italic relative text-[var(--text-primary)] text-[36px] text-center w-full">
                <p class="leading-[1.2]">Flow Multiplier Settings</p>
            </div>

            <!-- Divider -->
            <div class="h-0 relative w-full">
                <hr class="border-t border-[#c9c9c9] w-full" />
            </div>

            <div class="flex flex-col items-start relative w-full max-w-full">
                <div class="flex flex-col gap-[30px] items-start relative w-full max-w-full">
                    <div class="flex items-center justify-between relative w-full max-w-full">
                        <div class="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative text-[#385a92] text-[30px]">
                            <p class="leading-[1.2]">Weight Flow Multiplier</p>
                        </div>
                        <div class="flex items-center gap-4">
                            <input type="number" id="weightFlowMultiplierInput" class="bg-[#385a92] border-2 border-[#385a92] border-solid h-[62.88px] rounded-[10px] w-[150px] text-white text-[24px] p-2 text-center max-w-[150px]"
                                   value="${settings.weightFlowMultiplier !== undefined ? settings.weightFlowMultiplier : 1.0}"
                                   step="0.1" min="0" max="5">
                            <button class="bg-[#385a92] h-[62.88px] rounded-[10px] w-[100px] text-white text-[24px] font-bold max-w-[100px]"
                                    onclick="window.updateReaSetting('weightFlowMultiplier', parseFloat(document.getElementById('weightFlowMultiplierInput').value))">
                                Save
                            </button>
                        </div>
                    </div>
                    <p class="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic relative text-[var(--text-primary)] text-[24px] w-full max-w-full break-words">
                        Multiplier for projected weight calculation. Higher values stop shots earlier.
                    </p>
                </div>
            </div>

            <!-- Divider -->
            <div class="h-0 relative w-full">
                <hr class="border-t border-[#c9c9c9] w-full" />
            </div>

            <div class="flex flex-col items-start relative w-full max-w-full">
                <div class="flex flex-col gap-[30px] items-start relative w-full max-w-full">
                    <div class="flex items-center justify-between relative w-full max-w-full">
                        <div class="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative text-[#385a92] text-[30px]">
                            <p class="leading-[1.2]">Volume Flow Multiplier (s)</p>
                        </div>
                        <div class="flex items-center gap-4">
                            <input type="number" id="volumeFlowMultiplierInput" class="bg-[#385a92] border-2 border-[#385a92] border-solid h-[62.88px] rounded-[10px] w-[150px] text-white text-[24px] p-2 text-center max-w-[150px]"
                                   value="${settings.volumeFlowMultiplier !== undefined ? settings.volumeFlowMultiplier : 0.3}"
                                   step="0.05" min="0" max="2">
                            <button class="bg-[#385a92] h-[62.88px] rounded-[10px] w-[100px] text-white text-[24px] font-bold max-w-[100px]"
                                    onclick="window.updateReaSetting('volumeFlowMultiplier', parseFloat(document.getElementById('volumeFlowMultiplierInput').value))">
                                Save
                            </button>
                        </div>
                    </div>
                    <p class="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic relative text-[var(--text-primary)] text-[24px] w-full max-w-full break-words">
                        Look-ahead time in seconds for projected volume calculation. Accounts for system lag.
                    </p>
                </div>
            </div>
        </div>
    `;
}

// Render REA settings form matching design
export function renderReaSettingsForm(settings) {
    if (!settings) {
        return `
            <div class="flex flex-col gap-[60px] items-start relative w-full max-w-full overflow-x-hidden">
                <div class="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] not-italic relative text-[var(--text-primary)] text-[36px] text-center w-full">
                    <p class="leading-[1.2]">REA Application Settings</p>
                </div>
                <div class="text-red-500 p-4 text-[24px]">Failed to load REA settings</div>
            </div>
        `;
    }

    return `
        <div class="flex flex-col gap-[60px] items-start relative w-full max-w-full overflow-x-hidden">
            <div class="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] not-italic relative text-[var(--text-primary)] text-[36px] text-center w-full">
                <p class="leading-[1.2]">REA Application Settings</p>
            </div>

            <!-- Divider -->
            <div class="h-0 relative w-full">
                <hr class="border-t border-[#c9c9c9] w-full" />
            </div>

            <div class="flex flex-col items-start relative w-full max-w-full">
                <div class="flex flex-col gap-[30px] items-start relative w-full max-w-full">
                    <div class="flex flex-col items-start relative w-full max-w-full">
                        <div class="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative text-[#385a92] text-[30px] mb-[20px]">
                            <p class="leading-[1.2]">Gateway Mode</p>
                        </div>
                        <div class="flex items-center justify-between w-full max-w-[885px] ">
                            <button class="h-[120px] w-[295px] rounded-[10px] font-['Inter:Bold',sans-serif] font-bold text-[30px] flex items-center justify-center cursor-pointer transition-colors duration-200
                                ${settings.gatewayMode === 'disabled' ? 'bg-[var(--mimoja-blue)] text-white' : 'bg-[var(--box-color)] border border-[var(--profile-button-outline-color)] text-[#b6c3d7]'}"
                                onclick="window.updateReaSetting('gatewayMode', 'disabled')">
                                Disabled
                            </button>
                            <button class="h-[120px] w-[295px] rounded-[10px] font-['Inter:Bold',sans-serif] font-bold text-[30px] flex items-center justify-center cursor-pointer transition-colors duration-200
                                ${settings.gatewayMode === 'tracking' ? 'bg-[var(--mimoja-blue)] text-white' : 'bg-[var(--box-color)] border border-[var(--profile-button-outline-color)] text-[#b6c3d7]'}"
                                onclick="window.updateReaSetting('gatewayMode', 'tracking')">
                                Tracking
                            </button>
                            <button class="h-[120px] w-[295px] rounded-[10px] font-['Inter:Bold',sans-serif] font-bold text-[30px] flex items-center justify-center cursor-pointer transition-colors duration-200
                                ${settings.gatewayMode === 'full' ? 'bg-[var(--mimoja-blue)] text-white' : 'bg-[var(--box-color)] border border-[var(--profile-button-outline-color)] text-[#b6c3d7]'}"
                                onclick="window.updateReaSetting('gatewayMode', 'full')">
                                Full
                            </button>
                        </div>
                    </div>
                    <p class="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic relative text-[var(--text-primary)] text-[24px] w-full max-w-full break-words">
                        Controls how the gateway monitors and controls the espresso machine
                    </p>
                </div>
            </div>

            <!-- Divider -->
            <div class="h-0 relative w-full">
                <hr class="border-t border-[#c9c9c9] w-full" />
            </div>

            <div class="flex flex-col items-start relative w-full max-w-full">
                <div class="flex flex-col gap-[30px] items-start relative w-full max-w-full">
                    <div class="flex items-center justify-between relative w-full max-w-full">
                        <div class="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative text-[#385a92] text-[30px]">
                            <p class="leading-[1.2]">Log Level</p>
                        </div>
                        <select id="logLevelSelect" class="bg-[#385a92] border-2 border-[#385a92] border-solid h-[62.88px] rounded-[2617.374px] w-[250px] text-white text-[24px] p-2 max-w-[250px]"
                                onchange="window.updateReaSetting('logLevel', this.value)">
                            <option value="ALL" ${settings.logLevel === 'ALL' ? 'selected' : ''}>ALL</option>
                            <option value="FINEST" ${settings.logLevel === 'FINEST' ? 'selected' : ''}>FINEST</option>
                            <option value="FINER" ${settings.logLevel === 'FINER' ? 'selected' : ''}>FINER</option>
                            <option value="FINE" ${settings.logLevel === 'FINE' ? 'selected' : ''}>FINE</option>
                            <option value="CONFIG" ${settings.logLevel === 'CONFIG' ? 'selected' : ''}>CONFIG</option>
                            <option value="INFO" ${settings.logLevel === 'INFO' ? 'selected' : ''}>INFO</option>
                            <option value="WARNING" ${settings.logLevel === 'WARNING' ? 'selected' : ''}>WARNING</option>
                            <option value="SEVERE" ${settings.logLevel === 'SEVERE' ? 'selected' : ''}>SEVERE</option>
                            <option value="SHOUT" ${settings.logLevel === 'SHOUT' ? 'selected' : ''}>SHOUT</option>
                            <option value="OFF" ${settings.logLevel === 'OFF' ? 'selected' : ''}>OFF</option>
                        </select>
                    </div>
                    <p class="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic relative text-[var(--text-primary)] text-[24px] w-full max-w-full break-words">
                        Sets the verbosity of application logging output
                    </p>
                </div>
            </div>

            <!-- Divider -->
            <div class="h-0 relative w-full">
                <hr class="border-t border-[#c9c9c9] w-full" />
            </div>

            <!-- Divider -->
            <div class="h-0 relative w-full">
                <hr class="border-t border-[#c9c9c9] w-full" />
            </div>

            <div class="flex flex-col items-start relative w-full max-w-full">
                <div class="flex flex-col gap-[30px] items-start relative w-full max-w-full">
                    <div class="flex items-center justify-between relative w-full max-w-full">
                        <div class="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative text-[#385a92] text-[30px]">
                            <p class="leading-[1.2]">Scale Power Management</p>
                        </div>
                        <select id="scalePowerModeSelect" class="bg-[#385a92] border-2 border-[#385a92] border-solid h-[62.88px] rounded-[2617.374px] w-[250px] text-white text-[24px] p-2 max-w-[250px]"
                                onchange="window.updateReaSetting('scalePowerMode', this.value)">
                            <option value="disabled" ${settings.scalePowerMode === 'disabled' ? 'selected' : ''}>Disabled</option>
                            <option value="displayOff" ${settings.scalePowerMode === 'displayOff' ? 'selected' : ''}>Display Off</option>
                            <option value="disconnect" ${settings.scalePowerMode === 'disconnect' ? 'selected' : ''}>Disconnect</option>
                        </select>
                    </div>
                    <p class="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic relative text-[var(--text-primary)] text-[24px] w-full max-w-full break-words">
                        Controls automatic scale power management when machine sleeps. Display Off: turn off scale display. Disconnect: disconnect scale completely.
                    </p>
                </div>
            </div>
        </div>
    `;
}

// Render Flush settings form
export function renderFlushSettingsForm(settings) {
    console.log("rendering flush settings form with settings: ", settings);
    if (!settings) {
        return `
            <div class="content-stretch flex flex-col gap-[60px] items-start relative w-full">
                <div class="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] min-w-full not-italic relative text-[var(--text-primary)] text-[36px] text-center w-[min-content]">
                    <p class="leading-[1.2]">Flush Settings</p>
                </div>
                <div class="text-red-500 p-4 text-[24px]">Failed to load flush settings</div>
            </div>
        `;
    }

    return `
        <div class="content-stretch flex flex-col gap-[60px] items-start relative w-full">
            <div class="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] min-w-full not-italic relative text-[var(--text-primary)] text-[36px] text-center w-[min-content]">
                <p class="leading-[1.2]">Flush Settings</p>
            </div>

            <!-- Divider -->
            <div class="h-0 relative w-full">
                <hr class="border-t border-[#c9c9c9] w-full" />
            </div>

            <div class="content-stretch flex flex-col items-center relative w-full">
                <div class="border border-[#c9c9c9] border-solid content-stretch flex flex-col gap-[30px] items-center px-[60px] py-[30px] relative shrink-0 w-[590px]">
                    <div class="content-stretch flex items-center relative shrink-0">
                        <p class="font-['Inter:Regular',sans-serif] font-normal leading-[1.2] not-italic relative shrink-0 text-[var(--text-primary)] text-[30px]">
                            Flush Temperature
                        </p>
                    </div>
                    <div class="content-stretch flex gap-[20px] h-[72px] items-center justify-center relative shrink-0 w-full">
                        <button id="flush-temp-minus" class="w-[72px] h-[72px] bg-[var(--button-grey)] rounded-[20px] flex items-center justify-center"
                                onclick="window.flashPlusMinusButton(this); window.adjustFlushTemp(-5);">
                            <svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M10.416 25H39.5827" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                        <div class="text-center text-[var(--text-primary)] text-[24px] font-bold bg-transparent border-none flex items-center justify-center"
                             style="width: 130px;">
                            <input type="text" inputmode="numeric" pattern="[0-9]*" id="flushTempInput" class="text-center text-[var(--text-primary)] text-[24px] font-bold bg-transparent border-none w-full"
                                   value="${settings.flushTemp !== undefined ? settings.flushTemp : ''}"
                                   step="5" min="5" max="95"
                                   onchange="window.updateDe1Setting('flushTemp', parseFloat(this.value))">
                            <span class="ml-2">°C</span>
                        </div>
                        <button id="flush-temp-plus" class="w-[72px] h-[72px] bg-[var(--button-grey)] rounded-[20px] flex items-center justify-center"
                                onclick="window.flashPlusMinusButton(this); window.adjustFlushTemp(5);">
                            <svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M24.9993 10.4165V39.5832M10.416 24.9998H39.5827" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                    </div>
                    <p class="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic relative text-[var(--text-primary)] text-[24px] w-full text-center">
                        Temperature for flush cycles
                    </p>
                </div>

                <div class="border border-[#c9c9c9] border-solid content-stretch flex flex-col gap-[30px] items-center px-[60px] py-[30px] relative shrink-0 w-[590px] mt-[30px]">
                    <div class="content-stretch flex items-center relative shrink-0">
                        <p class="font-['Inter:Regular',sans-serif] font-normal leading-[1.2] not-italic relative shrink-0 text-[var(--text-primary)] text-[30px]">
                            Flush Flow
                        </p>
                    </div>
                    <div class="content-stretch flex gap-[20px] h-[72px] items-center justify-center relative shrink-0 w-full">
                        <button id="flush-flow-minus" class="w-[72px] h-[72px] bg-[var(--button-grey)] rounded-[20px] flex items-center justify-center"
                                onclick="window.flashPlusMinusButton(this); window.adjustFlushFlow(-1);">
                            <svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M10.416 25H39.5827" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                        <div class="text-center text-[var(--text-primary)] text-[24px] font-bold bg-transparent border-none flex items-center justify-center"
                             style="width: 130px;">
                            <input type="text" inputmode="numeric" pattern="[0-9]*" id="flushFlowInput" class="text-center text-[var(--text-primary)] text-[24px] font-bold bg-transparent border-none w-full"
                                   value="${settings.flushFlow !== undefined ? settings.flushFlow : ''}"
                                   step="1" min="1" max="8"
                                   onchange="window.updateDe1Setting('flushFlow', parseFloat(this.value))">
                            <span class="ml-2 text-nowrap">ml/s</span>
                        </div>
                        <button id="flush-flow-plus" class="w-[72px] h-[72px] bg-[var(--button-grey)] rounded-[20px] flex items-center justify-center"
                                onclick="window.flashPlusMinusButton(this); window.adjustFlushFlow(1);">
                            <svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M24.9993 10.4165V39.5832M10.416 24.9998H39.5827" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                    </div>
                    <p class="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic relative text-[var(--text-primary)] text-[24px] w-full text-center">
                        Flow rate for flush cycles
                    </p>
                </div>
            </div>
        </div>
    `;
}

// Render Fan Threshold settings
export function renderFanThresholdSettings(settings) {
    if (!settings) {
        return `
            <div class="content-stretch flex flex-col gap-[60px] items-start relative w-full">
                <div class="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] min-w-full not-italic relative text-[var(--text-primary)] text-[36px] text-center w-[min-content]">
                    <p class="leading-[1.2]">Fan Threshold Settings</p>
                </div>
                <div class="text-red-500 p-4 text-[24px]">Failed to load DE1 settings</div>
            </div>
        `;
    }

    return `
        <div class="content-stretch flex flex-col gap-[60px] items-start relative w-full">
            <div class="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] min-w-full not-italic relative text-[var(--text-primary)] text-[36px] text-center w-[min-content]">
                <p class="leading-[1.2]">Fan Threshold Settings</p>
            </div>

            <!-- Divider -->
            <div class="h-0 relative w-full">
                <hr class="border-t border-[#c9c9c9] w-full" />
            </div>

            <div class="content-stretch flex flex-col items-start relative w-full">
                <div class="content-stretch flex flex-col gap-[30px] items-start relative w-full">
                    <div class="content-stretch flex items-center justify-between relative w-full">
                        <div class="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative text-[#385a92] text-[30px]">
                            <p class="leading-[1.2]">Fan Threshold (°C)</p>
                        </div>
                        <div class="flex items-center gap-4">
                            <input type="number" id="fanThresholdInput" class="bg-[#385a92] border-2 border-[#385a92] border-solid h-[62.88px] rounded-[10px] w-[150px] text-white text-[24px] p-2 text-center"
                                   value="${settings.fan !== undefined ? settings.fan : ''}"
                                   step="1" min="0" max="100">
                            <button class="bg-[#385a92] h-[62.88px] rounded-[10px] w-[100px] text-white text-[24px] font-bold"
                                    onclick="window.updateDe1Setting('fan', parseInt(document.getElementById('fanThresholdInput').value))">
                                Save
                            </button>
                        </div>
                    </div>
                    <p class="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic relative text-[var(--text-primary)] text-[24px] w-full">
                        Temperature threshold at which the fan turns on
                    </p>
                </div>
            </div>
        </div>
    `;
}

// Render USB Charger Mode settings
export function renderUsbChargerModeSettings(settings) {
    if (!settings) {
        return `
            <div class="content-stretch flex flex-col gap-[60px] items-start relative w-full">
                <div class="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] min-w-full not-italic relative text-[var(--text-primary)] text-[36px] text-center w-[min-content]">
                    <p class="leading-[1.2]">USB Charger Mode Settings</p>
                </div>
                <div class="text-red-500 p-4 text-[24px]">Failed to load DE1 settings</div>
            </div>
        `;
    }

    return `
        <div class="content-stretch flex flex-col gap-[60px] items-start relative w-full">
            <div class="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] min-w-full not-italic relative text-[var(--text-primary)] text-[36px] text-center w-[min-content]">
                <p class="leading-[1.2]">USB Charger Mode Settings</p>
            </div>

            <!-- Divider -->
            <div class="h-0 relative w-full">
                <hr class="border-t border-[#c9c9c9] w-full" />
            </div>

            <div class="content-stretch flex flex-col items-start relative w-full">
                <div class="content-stretch flex flex-col gap-[30px] items-start relative w-full">
                    <div class="content-stretch flex items-center justify-between relative w-full">
                        <div class="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative text-[#385a92] text-[30px]">
                            <p class="leading-[1.2]">USB Charger Mode</p>
                        </div>
                        <select id="usbChargerModeSelect" class="bg-[#385a92] border-2 border-[#385a92] border-solid h-[62.88px] rounded-[2617.374px] w-[200px] text-white text-[24px] p-2"
                                onchange="window.updateDe1Setting('usb', this.value)">
                            <option value="enable" ${settings.usb ? 'selected' : ''}>Enabled</option>
                            <option value="disable" ${!settings.usb ? 'selected' : ''}>Disabled</option>
                        </select>
                    </div>
                    <p class="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic relative text-[var(--text-primary)] text-[24px] w-full">
                        Controls whether the USB port provides power for charging devices
                    </p>
                </div>
            </div>
        </div>
    `;
}

// Render DE1 Advanced settings form
export function renderDe1AdvancedSettingsForm(settings) {
    if (!settings) {
        return `
            <div class="content-stretch flex flex-col gap-[60px] items-start relative w-full">
                <div class="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] min-w-full not-italic relative text-[var(--text-primary)] text-[36px] text-center w-[min-content]">
                    <p class="leading-[1.2]">Machine Advanced Settings</p>
                </div>
                <div class="text-red-500 p-4 text-[24px]">Failed to load DE1 advanced settings</div>
            </div>
        `;
    }

    return `
        <div class="content-stretch flex flex-col gap-[60px] items-start relative w-full">
            <div class="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] min-w-full not-italic relative text-[var(--text-primary)] text-[36px] text-center w-[min-content]">
                <p class="leading-[1.2]">Machine Advanced Settings</p>
            </div>

            <!-- Divider -->
            <div class="h-0 relative w-full">
                <hr class="border-t border-[#c9c9c9] w-full" />
            </div>

            <div class="content-stretch flex flex-col items-start relative w-full">
                <div class="content-stretch flex flex-col gap-[30px] items-start relative w-full">
                    <div class="content-stretch flex items-center justify-between relative w-full">
                        <div class="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative text-[#385a92] text-[30px]">
                            <p class="leading-[1.2]">Heater Phase 1 Flow (ml/s)</p>
                        </div>
                        <div class="flex items-center gap-4">
                            <input type="number" id="heaterPh1FlowInput" class="bg-[#385a92] border-2 border-[#385a92] border-solid h-[62.88px] rounded-[10px] w-[150px] text-white text-[24px] p-2 text-center"
                                   value="${settings.heaterPh1Flow !== undefined ? settings.heaterPh1Flow : ''}"
                                   step="0.1" min="0" max="10">
                            <button class="bg-[#385a92] h-[62.88px] rounded-[10px] w-[100px] text-white text-[24px] font-bold"
                                    onclick="window.updateDe1AdvancedSetting('heaterPh1Flow', parseFloat(document.getElementById('heaterPh1FlowInput').value))">
                                Save
                            </button>
                        </div>
                    </div>
                    <p class="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic relative text-[var(--text-primary)] text-[24px] w-full">
                        Flow rate during heater phase 1
                    </p>
                </div>
            </div>

            <!-- Divider -->
            <div class="h-0 relative w-full">
                <hr class="border-t border-[#c9c9c9] w-full" />
            </div>

            <div class="content-stretch flex flex-col items-start relative w-full">
                <div class="content-stretch flex flex-col gap-[30px] items-start relative w-full">
                    <div class="content-stretch flex items-center justify-between relative w-full">
                        <div class="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative text-[#385a92] text-[30px]">
                            <p class="leading-[1.2]">Heater Phase 2 Flow (ml/s)</p>
                        </div>
                        <div class="flex items-center gap-4">
                            <input type="number" id="heaterPh2FlowInput" class="bg-[#385a92] border-2 border-[#385a92] border-solid h-[62.88px] rounded-[10px] w-[150px] text-white text-[24px] p-2 text-center"
                                   value="${settings.heaterPh2Flow !== undefined ? settings.heaterPh2Flow : ''}"
                                   step="0.1" min="0" max="10">
                            <button class="bg-[#385a92] h-[62.88px] rounded-[10px] w-[100px] text-white text-[24px] font-bold"
                                    onclick="window.updateDe1AdvancedSetting('heaterPh2Flow', parseFloat(document.getElementById('heaterPh2FlowInput').value))">
                                Save
                            </button>
                        </div>
                    </div>
                    <p class="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic relative text-[var(--text-primary)] text-[24px] w-full">
                        Flow rate during heater phase 2
                    </p>
                </div>
            </div>
        </div>
    `;
}


// Render user manual settings
export function renderUserManualSettings() {
    return `
        <div class="content-stretch flex flex-col gap-[60px] items-start relative w-full">
            <div class="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] min-w-full not-italic relative text-[var(--text-primary)] text-[36px] text-center w-[min-content]">
                <p class="leading-[1.2]">User Manual</p>
            </div>

            <div class="content-stretch flex flex-col items-start relative w-full">
                <div class="content-stretch flex flex-col gap-[30px] items-start relative w-full">
                    <div class="content-stretch flex items-center justify-between relative w-full">
                        <div class="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative text-[#385a92] text-[30px]">
                            <p class="leading-[1.2]">Online Help</p>
                        </div>
                        <a href="https://decentespresso.com/support/submit" target="_blank" class="bg-[#385a92] h-[62.88px] rounded-[10px] w-[200px] text-white text-[24px] font-bold flex items-center justify-center">
                            Visit
                        </a>
                    </div>
                    <p class="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic relative text-[var(--text-primary)] text-[24px] w-full">
                        Get support and submit tickets for assistance
                    </p>
                </div>
            </div>

            <!-- Divider -->
            <div class="h-0 relative w-full">
                <hr class="border-t border-[#c9c9c9] w-full" />
            </div>

            <div class="content-stretch flex flex-col items-start relative w-full">
                <div class="content-stretch flex flex-col gap-[30px] items-start relative w-full">
                    <div class="content-stretch flex items-center justify-between relative w-full">
                        <div class="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative text-[#385a92] text-[30px]">
                            <p class="leading-[1.2]">Tutorials</p>
                        </div>
                        <a href="https://decentespresso.com/doc/quickstart/" target="_blank" class="bg-[#385a92] h-[62.88px] rounded-[10px] w-[200px] text-white text-[24px] font-bold flex items-center justify-center">
                            View
                        </a>
                    </div>
                    <p class="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic relative text-[var(--text-primary)] text-[24px] w-full">
                        Learn how to get started with your espresso machine
                    </p>
                </div>
            </div>
            <div class="content-stretch flex flex-col items-start relative w-full">
                <div class="content-stretch flex flex-col gap-[30px] items-start relative w-full">
                    <div class="content-stretch flex items-center justify-between relative w-full">
                        <div class="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative text-[#385a92] text-[30px]">
                            <p class="leading-[1.2]">Start writing your own skin.</p>
                        </div>
                        <a href="https://github.com/tadelv/reaprime/blob/main/doc/Skins.md#skinsmd" target="_blank" class="bg-[#385a92] h-[62.88px] rounded-[10px] w-[200px] text-white text-[24px] font-bold flex items-center justify-center">
                            View
                        </a>
                    </div>
                    <p class="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic relative text-[var(--text-primary)] text-[24px] w-full">
                        Learn how to use streamline-bridge to create custom skins and more.
                    </p>
                </div>
            </div>
        </div>
    `;
}

// Render miscellaneous settings
export function renderMiscellaneousSettings() {
    return `
        <div class="content-stretch flex flex-col gap-[60px] items-start relative w-full">
            <div class="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] min-w-full not-italic relative text-[var(--text-primary)] text-[36px] text-center w-[min-content]">
                <p class="leading-[1.2]">Miscellaneous Settings</p>
            </div>

            <div class="content-stretch flex flex-col items-start relative w-full">
                <div class="content-stretch flex flex-col gap-[30px] items-start relative w-full">
                    <div class="content-stretch flex items-center justify-between relative w-full">
                        <div class="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative text-[#385a92] text-[30px]">
                            <p class="leading-[1.2]">Screen Saver</p>
                        </div>
                        <select class="bg-[#385a92] border-2 border-[#385a92] border-solid h-[62.88px] rounded-[2617.374px] w-[200px] text-white text-[24px] p-2">
                            <option>Enabled</option>
                            <option>Disabled</option>
                        </select>
                    </div>
                    <p class="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic relative text-[var(--text-primary)] text-[24px] w-full">
                        Enable or disable screen saver functionality
                    </p>
                </div>
            </div>

            <!-- Divider -->
            <div class="h-0 relative w-full">
                <hr class="border-t border-[#c9c9c9] w-full" />
            </div>

            <div class="content-stretch flex flex-col items-start relative w-full">
                <div class="content-stretch flex flex-col gap-[30px] items-start relative w-full">
                    <div class="content-stretch flex items-center justify-between relative w-full">
                        <div class="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative text-[#385a92] text-[30px]">
                            <p class="leading-[1.2]">Brightness</p>
                        </div>
                        <input type="range" min="0" max="100" value="75" class="w-[200px] h-[30px]">
                    </div>
                    <p class="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic relative text-[var(--text-primary)] text-[24px] w-full">
                        Adjust screen brightness level
                    </p>
                </div>
            </div>

            <!-- Divider -->
            <div class="h-0 relative w-full">
                <hr class="border-t border-[#c9c9c9] w-full" />
            </div>

            <div class="content-stretch flex flex-col items-start relative w-full">
                <div class="content-stretch flex flex-col gap-[30px] items-start relative w-full">
                    <div class="content-stretch flex items-center justify-between relative w-full">
                        <div class="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative text-[#385a92] text-[30px]">
                            <p class="leading-[1.2]">App Version</p>
                        </div>
                        <div class="bg-[#385a92] h-[62.88px] rounded-[10px] w-[200px] text-white text-[24px] font-bold flex items-center justify-center">
                            1.0.0
                        </div>
                    </div>
                    <p class="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic relative text-[var(--text-primary)] text-[24px] w-full">
                        Current application version
                    </p>
                </div>
            </div>

            <!-- Divider -->
            <div class="h-0 relative w-full">
                <hr class="border-t border-[#c9c9c9] w-full" />
            </div>

            <div class="content-stretch flex flex-col items-start relative w-full">
                <div class="content-stretch flex flex-col gap-[30px] items-start relative w-full">
                    <div class="content-stretch flex items-center justify-between relative w-full">
                        <div class="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative text-[#385a92] text-[30px]">
                            <p class="leading-[1.2]">Units Settings</p>
                        </div>
                        <select class="bg-[#385a92] border-2 border-[#385a92] border-solid h-[62.88px] rounded-[2617.374px] w-[200px] text-white text-[24px] p-2">
                            <option>Metric</option>
                            <option>Imperial</option>
                        </select>
                    </div>
                    <p class="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic relative text-[var(--text-primary)] text-[24px] w-full">
                        Select measurement units for the application
                    </p>
                </div>
            </div>

            <!-- Divider -->
            <div class="h-0 relative w-full">
                <hr class="border-t border-[#c9c9c9] w-full" />
            </div>

            <div class="content-stretch flex flex-col items-start relative w-full">
                <div class="content-stretch flex flex-col gap-[30px] items-start relative w-full">
                    <div class="content-stretch flex items-center justify-between relative w-full">
                        <div class="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative text-[#385a92] text-[30px]">
                            <p class="leading-[1.2]">Font Size</p>
                        </div>
                        <select class="bg-[#385a92] border-2 border-[#385a92] border-solid h-[62.88px] rounded-[2617.374px] w-[200px] text-white text-[24px] p-2">
                            <option>Small</option>
                            <option>Medium</option>
                            <option>Large</option>
                        </select>
                    </div>
                    <p class="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic relative text-[var(--text-primary)] text-[24px] w-full">
                        Adjust the font size for better readability
                    </p>
                </div>
            </div>

            <!-- Divider -->
            <div class="h-0 relative w-full">
                <hr class="border-t border-[#c9c9c9] w-full" />
            </div>

            <div class="content-stretch flex flex-col items-start relative w-full">
                <div class="content-stretch flex flex-col gap-[30px] items-start relative w-full">
                    <div class="content-stretch flex items-center justify-between relative w-full">
                        <div class="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative text-[#385a92] text-[30px]">
                            <p class="leading-[1.2]">Resolution</p>
                        </div>
                        <select class="bg-[#385a92] border-2 border-[#385a92] border-solid h-[62.88px] rounded-[2617.374px] w-[200px] text-white text-[24px] p-2">
                            <option>1920x1200</option>
                            <option>1280x800</option>
                            <option>1024x768</option>
                        </select>
                    </div>
                    <p class="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic relative text-[var(--text-primary)] text-[24px] w-full">
                        Set the display resolution
                    </p>
                </div>
            </div>

            <!-- Divider -->
            <div class="h-0 relative w-full">
                <hr class="border-t border-[#c9c9c9] w-full" />
            </div>

            <div class="content-stretch flex flex-col items-start relative w-full">
                <div class="content-stretch flex flex-col gap-[30px] items-start relative w-full">
                    <div class="content-stretch flex items-center justify-between relative w-full">
                        <div class="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative text-[#385a92] text-[30px]">
                            <p class="leading-[1.2]">Smart Charging</p>
                        </div>
                        <select class="bg-[#385a92] border-2 border-[#385a92] border-solid h-[62.88px] rounded-[2617.374px] w-[200px] text-white text-[24px] p-2">
                            <option>Enabled</option>
                            <option>Disabled</option>
                        </select>
                    </div>
                    <p class="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic relative text-[var(--text-primary)] text-[24px] w-full">
                        Enable smart charging for connected devices
                    </p>
                </div>
            </div>
        </div>
    `;
}

// Render bluetooth settings
export function renderBluetoothSettings() {
    return `
        <div class="content-stretch flex flex-col gap-[60px] items-start relative w-full">
            <div class="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] min-w-full not-italic relative text-[var(--text-primary)] text-[36px] text-center w-[min-content]">
                <p class="leading-[1.2]">Bluetooth Settings</p>
            </div>

            <div class="content-stretch flex flex-col items-start relative w-full">
                <div class="content-stretch flex flex-col gap-[30px] items-start relative w-full">
                    <div class="content-stretch flex items-center justify-between relative w-full">
                        <div class="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative text-[#385a92] text-[30px]">
                            <p class="leading-[1.2]">Espresso Machine</p>
                        </div>
                        <select class="bg-[#385a92] border-2 border-[#385a92] border-solid h-[62.88px] rounded-[2617.374px] w-[200px] text-white text-[24px] p-2">
                            <option>Not Connected</option>
                            <option>Connected</option>
                        </select>
                    </div>
                    <p class="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic relative text-[var(--text-primary)] text-[24px] w-full">
                        Connect to your espresso machine via Bluetooth
                    </p>
                </div>
            </div>

            <!-- Divider -->
            <div class="h-0 relative w-full">
                <hr class="border-t border-[#c9c9c9] w-full" />
            </div>

            <div class="content-stretch flex flex-col items-start relative w-full">
                <div class="content-stretch flex flex-col gap-[30px] items-start relative w-full">
                    <div class="content-stretch flex items-center justify-between relative w-full">
                        <div class="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative text-[#385a92] text-[30px]">
                            <p class="leading-[1.2]">Weighing Scale</p>
                        </div>
                        <select class="bg-[#385a92] border-2 border-[#385a92] border-solid h-[62.88px] rounded-[2617.374px] w-[200px] text-white text-[24px] p-2">
                            <option>Not Connected</option>
                            <option>Connected</option>
                        </select>
                    </div>
                    <p class="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic relative text-[var(--text-primary)] text-[24px] w-full">
                        Connect to your weighing scale via Bluetooth
                    </p>
                </div>
            </div>
        </div>
    `;
}

// Render Steam settings
export function renderSteamSettings() {
    if (!settingsCache.de1) {
        return `
            <div class="content-stretch flex flex-col gap-[60px] items-start relative w-full">
                <div class="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] min-w-full not-italic relative text-[var(--text-primary)] text-[36px] text-center w-[min-content]">
                    <p class="leading-[1.2]">Steam Settings</p>
                </div>
                <div class="text-red-500 p-4 text-[24px]">Failed to load DE1 settings</div>
            </div>
        `;
    }

    return `
        <div class="content-stretch flex flex-col gap-[60px] items-start relative w-full">
            <div class="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] min-w-full not-italic relative text-[var(--text-primary)] text-[36px] text-center w-[min-content]">
                <p class="leading-[1.2]">Steam Settings</p>
            </div>

            <div class="content-stretch flex flex-col items-start relative w-full">
                <div class="content-stretch flex flex-col gap-[30px] items-start relative w-full">
                    <div class="content-stretch flex items-center justify-between relative w-full">
                        <div class="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative text-[#385a92] text-[30px]">
                            <p class="leading-[1.2]">Steam Purge Mode</p>
                        </div>
                        <select class="bg-[#385a92] border-2 border-[#385a92] border-solid h-[62.88px] rounded-[2617.374px] w-[200px] text-white text-[24px] p-2"
                                onchange="window.updateDe1Setting('steamPurgeMode', this.value)">
                            <option value="0" ${settingsCache.de1.steamPurgeMode === 0 ? 'selected' : ''}>Normal</option>
                            <option value="1" ${settingsCache.de1.steamPurgeMode === 1 ? 'selected' : ''}>Two Tap Stop</option>
                        </select>
                    </div>
                    <p class="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic relative text-[var(--text-primary)] text-[24px] w-full">
                        Set the steam purge mode for the machine
                    </p>
                </div>
            </div>
        </div>
    `;
}

// Render Hot Water settings
export function renderHotWaterSettings() {
    if (!settingsCache.de1) {
        return `
            <div class="content-stretch flex flex-col gap-[60px] items-start relative w-full">
                <div class="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] min-w-full not-italic relative text-[var(--text-primary)] text-[36px] text-center w-[min-content]">
                    <p class="leading-[1.2]">Hot Water Settings</p>
                </div>
                <div class="text-red-500 p-4 text-[24px]">Failed to load DE1 settings</div>
            </div>
        `;
    }

    return `
        <div class="content-stretch flex flex-col gap-[60px] items-start relative w-full">
            <div class="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] min-w-full not-italic relative text-[var(--text-primary)] text-[36px] text-center w-[min-content]">
                <p class="leading-[1.2]">Hot Water Settings</p>
            </div>

            <!-- Divider -->
            <div class="h-0 relative w-full">
                <hr class="border-t border-[#c9c9c9] w-full" />
            </div>

            <div class="content-stretch flex flex-col items-center relative w-full">
                <div class="border border-[#c9c9c9] border-solid content-stretch flex flex-col gap-[30px] items-center px-[60px] py-[30px] relative shrink-0 w-[590px]">
                    <div class="content-stretch flex items-center relative shrink-0">
                        <p class="font-['Inter:Regular',sans-serif] font-normal leading-[1.2] not-italic relative shrink-0 text-[var(--text-primary)] text-[30px]">
                            Hot Water Flow
                        </p>
                    </div>
                    <div class="content-stretch flex gap-[20px] h-[72px] items-center justify-center relative shrink-0 w-full">
                        <button id="hot-water-flow-minus" class="w-[72px] h-[72px] bg-[var(--button-grey)] rounded-[20px] flex items-center justify-center"
                                onclick="window.flashPlusMinusButton(this); window.adjustHotWaterFlow(-0.1);">
                            <svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M10.416 25H39.5827" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                        <div class="text-center text-[var(--text-primary)] text-[24px] font-bold bg-transparent border-none flex items-center justify-center"
                             style="width: 130px;">
                            <input type="text" inputmode="numeric" pattern="[0-9]*" id="hotWaterFlowInput" class="text-center text-[var(--text-primary)] text-[24px] font-bold bg-transparent border-none w-full"
                                   value="${settingsCache.de1.hotWaterFlow !== undefined ? settingsCache.de1.hotWaterFlow : 2.5}"
                                   step="0.1" min="0" max="10"
                                   onchange="window.updateDe1Setting('hotWaterFlow', parseFloat(this.value))">
                            <span class="ml-2 text-nowrap">ml/s</span>
                        </div>
                        <button id="hot-water-flow-plus" class="w-[72px] h-[72px] bg-[var(--button-grey)] rounded-[20px] flex items-center justify-center"
                                onclick="window.flashPlusMinusButton(this); window.adjustHotWaterFlow(0.1);">
                            <svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M24.9993 10.4165V39.5832M10.416 24.9998H39.5827" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                    </div>
                    <p class="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic relative text-[var(--text-primary)] text-[24px] w-full text-center">
                        Flow rate for hot water
                    </p>
                </div>
            </div>
        </div>
    `;
}

// Render Water Tank settings
export function renderWaterTankSettings() {
    if (!settingsCache.de1) {
        return `
            <div class="content-stretch flex flex-col gap-[60px] items-start relative w-full">
                <div class="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] min-w-full not-italic relative text-[var(--text-primary)] text-[36px] text-center w-[min-content]">
                    <p class="leading-[1.2]">Water Tank Settings</p>
                </div>
                <div class="text-red-500 p-4 text-[24px]">Failed to load DE1 settings</div>
            </div>
        `;
    }

    return `
        <div class="content-stretch flex flex-col gap-[60px] items-start relative w-full">
            <div class="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] min-w-full not-italic relative text-[var(--text-primary)] text-[36px] text-center w-[min-content]">
                <p class="leading-[1.2]">Water Tank Settings</p>
            </div>

            <div class="content-stretch flex flex-col items-start relative w-full">
                <div class="content-stretch flex flex-col gap-[30px] items-start relative w-full">
                    <div class="content-stretch flex items-center justify-between relative w-full">
                        <div class="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative text-[#385a92] text-[30px]">
                            <p class="leading-[1.2]">Tank Temperature (°C)</p>
                        </div>
                        <div class="flex items-center gap-4">
                            <input type="number" id="tankTempInput" class="bg-[#385a92] border-2 border-[#385a92] border-solid h-[62.88px] rounded-[10px] w-[150px] text-white text-[24px] p-2 text-center"
                                   value="${settingsCache.de1.tankTemp !== undefined ? settingsCache.de1.tankTemp : 80}"
                                   step="1" min="0" max="100"
                                   onchange="window.updateDe1Setting('tankTemp', parseInt(this.value))">
                            <button class="bg-[#385a92] h-[62.88px] rounded-[10px] w-[100px] text-white text-[24px] font-bold"
                                    onclick="window.updateDe1Setting('tankTemp', parseInt(document.getElementById('tankTempInput').value))">
                                Save
                            </button>
                        </div>
                    </div>
                    <p class="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic relative text-[var(--text-primary)] text-[24px] w-full">
                        Set the water tank temperature in degrees Celsius
                    </p>
                </div>
            </div>
        </div>
    `;
}

// Render quick adjustments settings
export function renderQuickAdjustmentsSettings() {
    return `
        <div class="content-stretch flex flex-col gap-[60px] items-start relative w-full">
            <div class="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] min-w-full not-italic relative text-[var(--text-primary)] text-[36px] text-center w-[min-content]">
                <p class="leading-[1.2]">Quick Adjustments</p>
            </div>

            <div class="content-stretch flex flex-col items-start relative w-full">
                <div class="content-stretch flex flex-col gap-[30px] items-start relative w-full">
                    <div class="content-stretch flex items-center justify-between relative w-full">
                        <div class="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative text-[#385a92] text-[30px]">
                            <p class="leading-[1.2]">Flow Multiplier</p>
                        </div>
                        <div class="flex items-center gap-4">
                            <input type="number" class="bg-[#385a92] border-2 border-[#385a92] border-solid h-[62.88px] rounded-[10px] w-[150px] text-white text-[24px] p-2 text-center" value="1.0" step="0.1">
                            <button class="bg-[#385a92] h-[62.88px] rounded-[10px] w-[100px] text-white text-[24px] font-bold">
                                Save
                            </button>
                        </div>
                    </div>
                    <p class="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic relative text-[var(--text-primary)] text-[24px] w-full">
                        Adjust the flow multiplier for shot timing
                    </p>
                </div>
            </div>

            <!-- Divider -->
            <div class="h-0 relative w-full">
                <hr class="border-t border-[#c9c9c9] w-full" />
            </div>

            <div class="content-stretch flex flex-col items-start relative w-full">
                <div class="content-stretch flex flex-col gap-[30px] items-start relative w-full">
                    <div class="content-stretch flex items-center justify-between relative w-full">
                        <div class="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative text-[#385a92] text-[30px]">
                            <p class="leading-[1.2]">Steam</p>
                        </div>
                        <div class="flex items-center gap-4">
                            <input type="number" class="bg-[#385a92] border-2 border-[#385a92] border-solid h-[62.88px] rounded-[10px] w-[150px] text-white text-[24px] p-2 text-center" value="120" step="1">
                            <button class="bg-[#385a92] h-[62.88px] rounded-[10px] w-[100px] text-white text-[24px] font-bold">
                                Save
                            </button>
                        </div>
                    </div>
                    <p class="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic relative text-[var(--text-primary)] text-[24px] w-full">
                        Set steam temperature
                    </p>
                </div>
            </div>

            <!-- Divider -->
            <div class="h-0 relative w-full">
                <hr class="border-t border-[#c9c9c9] w-full" />
            </div>

            <div class="content-stretch flex flex-col items-start relative w-full">
                <div class="content-stretch flex flex-col gap-[30px] items-start relative w-full">
                    <div class="content-stretch flex items-center justify-between relative w-full">
                        <div class="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative text-[#385a92] text-[30px]">
                            <p class="leading-[1.2]">Water</p>
                        </div>
                        <div class="flex items-center gap-4">
                            <input type="number" class="bg-[#385a92] border-2 border-[#385a92] border-solid h-[62.88px] rounded-[10px] w-[150px] text-white text-[24px] p-2 text-center" value="80" step="1">
                            <button class="bg-[#385a92] h-[62.88px] rounded-[10px] w-[100px] text-white text-[24px] font-bold">
                                Save
                            </button>
                        </div>
                    </div>
                    <p class="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic relative text-[var(--text-primary)] text-[24px] w-full">
                        Set water temperature
                    </p>
                </div>
            </div>

            <!-- Divider -->
            <div class="h-0 relative w-full">
                <hr class="border-t border-[#c9c9c9] w-full" />
            </div>

            <div class="content-stretch flex flex-col items-start relative w-full">
                <div class="content-stretch flex flex-col gap-[30px] items-start relative w-full">
                    <div class="content-stretch flex items-center justify-between relative w-full">
                        <div class="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative text-[#385a92] text-[30px]">
                            <p class="leading-[1.2]">Limit</p>
                        </div>
                        <div class="flex items-center gap-4">
                            <input type="number" class="bg-[#385a92] border-2 border-[#385a92] border-solid h-[62.88px] rounded-[10px] w-[150px] text-white text-[24px] p-2 text-center" value="30" step="1">
                            <button class="bg-[#385a92] h-[62.88px] rounded-[10px] w-[100px] text-white text-[24px] font-bold">
                                Save
                            </button>
                        </div>
                    </div>
                    <p class="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic relative text-[var(--text-primary)] text-[24px] w-full">
                        Set brewing time limit
                    </p>
                </div>
            </div>
        </div>
    `;
}

// Render calibration settings with additional subcategories
export function renderCalibrationSettings() {
    return `
        <div class="content-stretch flex flex-col gap-[60px] items-start relative w-full">
            <div class="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] min-w-full not-italic relative text-[var(--text-primary)] text-[36px] text-center w-[min-content]">
                <p class="leading-[1.2]">Calibration Settings</p>
            </div>

            <div class="content-stretch flex flex-col items-start relative w-full">
                <div class="content-stretch flex flex-col gap-[30px] items-start relative w-full">
                    <div class="content-stretch flex items-center justify-between relative w-full">
                        <div class="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative text-[#385a92] text-[30px]">
                            <p class="leading-[1.2]">Default Load Settings</p>
                        </div>
                        <button class="bg-[#385a92] h-[62.88px] rounded-[10px] w-[200px] text-white text-[24px] font-bold">
                            Reset
                        </button>
                    </div>
                    <p class="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic relative text-[var(--text-primary)] text-[24px] w-full">
                        Reset to default calibration values
                    </p>
                </div>
            </div>

            <!-- Divider -->
            <div class="h-0 relative w-full">
                <hr class="border-t border-[#c9c9c9] w-full" />
            </div>

            <div class="content-stretch flex flex-col items-start relative w-full">
                <div class="content-stretch flex flex-col gap-[30px] items-start relative w-full">
                    <div class="content-stretch flex items-center justify-between relative w-full">
                        <div class="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative text-[#385a92] text-[30px]">
                            <p class="leading-[1.2]">Refill Kit</p>
                        </div>
                        <button class="bg-[#385a92] h-[62.88px] rounded-[10px] w-[200px] text-white text-[24px] font-bold">
                            Calibrate
                        </button>
                    </div>
                    <p class="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic relative text-[var(--text-primary)] text-[24px] w-full">
                        Calibrate refill kit settings
                    </p>
                </div>
            </div>

            <!-- Divider -->
            <div class="h-0 relative w-full">
                <hr class="border-t border-[#c9c9c9] w-full" />
            </div>

            <div class="content-stretch flex flex-col items-start relative w-full">
                <div class="content-stretch flex flex-col gap-[30px] items-start relative w-full">
                    <div class="content-stretch flex items-center justify-between relative w-full">
                        <div class="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative text-[#385a92] text-[30px]">
                            <p class="leading-[1.2]">Voltage</p>
                        </div>
                        <div class="flex items-center gap-4">
                            <input type="number" class="bg-[#385a92] border-2 border-[#385a92] border-solid h-[62.88px] rounded-[10px] w-[150px] text-white text-[24px] p-2 text-center" value="120" step="0.1">
                            <button class="bg-[#385a92] h-[62.88px] rounded-[10px] w-[100px] text-white text-[24px] font-bold">
                                Save
                            </button>
                        </div>
                    </div>
                    <p class="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic relative text-[var(--text-primary)] text-[24px] w-full">
                        Set voltage calibration
                    </p>
                </div>
            </div>

            <!-- Divider -->
            <div class="h-0 relative w-full">
                <hr class="border-t border-[#c9c9c9] w-full" />
            </div>

            <div class="content-stretch flex flex-col items-start relative w-full">
                <div class="content-stretch flex flex-col gap-[30px] items-start relative w-full">
                    <div class="content-stretch flex items-center justify-between relative w-full">
                        <div class="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative text-[#385a92] text-[30px]">
                            <p class="leading-[1.2]">Fan</p>
                        </div>
                        <div class="flex items-center gap-4">
                            <input type="number" class="bg-[#385a92] border-2 border-[#385a92] border-solid h-[62.88px] rounded-[10px] w-[150px] text-white text-[24px] p-2 text-center" value="65" step="1">
                            <button class="bg-[#385a92] h-[62.88px] rounded-[10px] w-[100px] text-white text-[24px] font-bold">
                                Save
                            </button>
                        </div>
                    </div>
                    <p class="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic relative text-[var(--text-primary)] text-[24px] w-full">
                        Set fan threshold temperature
                    </p>
                </div>
            </div>

            <!-- Divider -->
            <div class="h-0 relative w-full">
                <hr class="border-t border-[#c9c9c9] w-full" />
            </div>

            <div class="content-stretch flex flex-col items-start relative w-full">
                <div class="content-stretch flex flex-col gap-[30px] items-start relative w-full">
                    <div class="content-stretch flex items-center justify-between relative w-full">
                        <div class="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative text-[#385a92] text-[30px]">
                            <p class="leading-[1.2]">Stop at Weight</p>
                        </div>
                        <div class="flex items-center gap-4">
                            <input type="number" class="bg-[#385a92] border-2 border-[#385a92] border-solid h-[62.88px] rounded-[10px] w-[150px] text-white text-[24px] p-2 text-center" value="36" step="0.1">
                            <button class="bg-[#385a92] h-[62.88px] rounded-[10px] w-[100px] text-white text-[24px] font-bold">
                                Save
                            </button>
                        </div>
                    </div>
                    <p class="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic relative text-[var(--text-primary)] text-[24px] w-full">
                        Set weight target for stopping shots
                    </p>
                </div>
            </div>

            <!-- Divider -->
            <div class="h-0 relative w-full">
                <hr class="border-t border-[#c9c9c9] w-full" />
            </div>

            <div class="content-stretch flex flex-col items-start relative w-full">
                <div class="content-stretch flex flex-col gap-[30px] items-start relative w-full">
                    <div class="content-stretch flex items-center justify-between relative w-full">
                        <div class="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative text-[#385a92] text-[30px]">
                            <p class="leading-[1.2]">Slow Start</p>
                        </div>
                        <select class="bg-[#385a92] border-2 border-[#385a92] border-solid h-[62.88px] rounded-[2617.374px] w-[200px] text-white text-[24px] p-2">
                            <option>Enabled</option>
                            <option>Disabled</option>
                        </select>
                    </div>
                    <p class="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic relative text-[var(--text-primary)] text-[24px] w-full">
                        Enable slow start for smoother extraction
                    </p>
                </div>
            </div>

            <!-- Divider -->
            <div class="h-0 relative w-full">
                <hr class="border-t border-[#c9c9c9] w-full" />
            </div>

            <div class="content-stretch flex flex-col items-start relative w-full">
                <div class="content-stretch flex flex-col gap-[30px] items-start relative w-full">
                    <div class="content-stretch flex items-center justify-between relative w-full">
                        <div class="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative text-[#385a92] text-[30px]">
                            <p class="leading-[1.2]">Steam</p>
                        </div>
                        <div class="flex items-center gap-4">
                            <input type="number" class="bg-[#385a92] border-2 border-[#385a92] border-solid h-[62.88px] rounded-[10px] w-[150px] text-white text-[24px] p-2 text-center" value="120" step="1">
                            <button class="bg-[#385a92] h-[62.88px] rounded-[10px] w-[100px] text-white text-[24px] font-bold">
                                Save
                            </button>
                        </div>
                    </div>
                    <p class="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic relative text-[var(--text-primary)] text-[24px] w-full">
                        Set steam calibration
                    </p>
                </div>
            </div>
        </div>
    `;
}

// Render maintenance settings with additional subcategories
export function renderMaintenanceSettings() {
    return `
        <div class="content-stretch flex flex-col gap-[60px] items-start relative w-full">
            <div class="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] min-w-full not-italic relative text-[var(--text-primary)] text-[36px] text-center w-[min-content]">
                <p class="leading-[1.2]">Maintenance Settings</p>
            </div>

            <div class="content-stretch flex flex-col items-start relative w-full">
                <div class="content-stretch flex flex-col gap-[30px] items-start relative w-full">
                    <div class="content-stretch flex items-center justify-between relative w-full">
                        <div class="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative text-[#385a92] text-[30px]">
                            <p class="leading-[1.2]">Machine Descaling</p>
                        </div>
                        <button class="bg-[#385a92] h-[62.88px] rounded-[10px] w-[200px] text-white text-[24px] font-bold">
                            Start
                        </button>
                    </div>
                    <p class="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic relative text-[var(--text-primary)] text-[24px] w-full">
                        Run a descaling cycle to remove mineral buildup
                    </p>
                </div>
            </div>

            <!-- Divider -->
            <div class="h-0 relative w-full">
                <hr class="border-t border-[#c9c9c9] w-full" />
            </div>

            <div class="content-stretch flex flex-col items-start relative w-full">
                <div class="content-stretch flex flex-col gap-[30px] items-start relative w-full">
                    <div class="content-stretch flex items-center justify-between relative w-full">
                        <div class="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative text-[#385a92] text-[30px]">
                            <p class="leading-[1.2]">Transport Mode</p>
                        </div>
                        <select class="bg-[#385a92] border-2 border-[#385a92] border-solid h-[62.88px] rounded-[2617.374px] w-[200px] text-white text-[24px] p-2">
                            <option>Disabled</option>
                            <option>Enabled</option>
                        </select>
                    </div>
                    <p class="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic relative text-[var(--text-primary)] text-[24px] w-full">
                        Enable transport mode for safe transportation
                    </p>
                </div>
            </div>
        </div>
    `;
}

// Render skin settings
export function renderSkinSettings() {
    return `
        <div class="content-stretch flex flex-col gap-[60px] items-start relative w-full">
            <div class="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] min-w-full not-italic relative text-[var(--text-primary)] text-[36px] text-center w-[min-content]">
                <p class="leading-[1.2]">Skin Settings</p>
            </div>

            <div class="content-stretch flex flex-col items-start relative w-full">
                <div class="content-stretch flex flex-col gap-[30px] items-start relative w-full">
                    <div class="content-stretch flex items-center justify-between relative w-full">
                        <div class="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative text-[#385a92] text-[30px]">
                            <p class="leading-[1.2]">Theme</p>
                        </div>
                        <div class="btn-status">
                            <input type="checkbox" name="theme-toggle" id="theme-toggle" class="hidden" />
                            <label for="theme-toggle" class="togglebtn-change flex items-center  rounded-full w-9 h-[18px] cursor-pointer"></label>
                        </div>
                    </div>
                    <p class="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic relative text-[var(--text-primary)] text-[24px] w-full">
                        Toggle between light and dark themes
                    </p>
                </div>
            </div>

            <div class="content-stretch flex flex-col items-start relative w-full">
                <div class="content-stretch flex flex-col gap-[30px] items-start relative w-full">
                    <div class="content-stretch flex items-center justify-between relative w-full">
                        <div class="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative text-[#385a92] text-[30px]">
                            <p class="leading-[1.2]">Skin 1</p>
                        </div>
                        <button class="bg-[#385a92] h-[62.88px] rounded-[10px] w-[200px] text-white text-[24px] font-bold">
                            Apply
                        </button>
                    </div>
                    <p class="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic relative text-[var(--text-primary)] text-[24px] w-full">
                        Apply the first skin/theme
                    </p>
                </div>
            </div>
        </div>
    `;
}

// Render language settings with additional subcategories
export function renderLanguageSettings() {
    setTimeout(() => {
        const switcher = document.getElementById('language-switcher');
        if (!switcher) return;

        const supported = getSupportedLanguages();
        const current = getCurrentLanguage();

        switcher.innerHTML = '';
        supported.forEach(lang => {
            const option = document.createElement('option');
            option.value = lang;
            try {
                option.textContent = new Intl.DisplayNames([lang], { type: 'language' }).of(lang);
            } catch {
                option.textContent = lang;
            }
            if (lang === current) {
                option.selected = true;
            }
            switcher.appendChild(option);
        });

        switcher.addEventListener('change', (event) => {
            setLanguage(event.target.value);
        });
    }, 0);

    return `
        <div class="flex flex-col gap-[60px] items-start relative w-full max-w-full overflow-x-hidden">
            <div class="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] not-italic relative text-[var(--text-primary)] text-[36px] text-center w-full">
                <p class="leading-[1.2]">Language Settings</p>
            </div>
            <div class="h-0 relative w-full"><hr class="border-t border-[#c9c9c9] w-full" /></div>
            <div class="flex flex-col items-start relative w-full max-w-full">
                <div class="flex flex-col gap-[30px] items-start relative w-full max-w-full">
                    <div class="flex items-center justify-between relative w-full max-w-full">
                        <div class="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative text-[#385a92] text-[30px]">
                            <p class="leading-[1.2]">Display Language</p>
                        </div>
                        <select id="language-switcher" class="bg-[#385a92] border-2 border-[#385a92] border-solid h-[62.88px] rounded-[2617.374px] w-[250px] text-white text-[24px] p-2 max-w-[250px]">
                            <option>Loading...</option>
                        </select>
                    </div>
                    <p class="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic relative text-[var(--text-primary)] text-[24px] w-full max-w-full break-words">
                        Choose the language for the application interface.
                    </p>
                </div>
            </div>


    `;
}

// Render extensions settings
export function renderExtensionsSettings() {
    // Return the HTML template
    const template = `
        <div class="content-stretch flex flex-col gap-[60px] items-start relative w-full">
            <div class="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] min-w-full not-italic relative text-[var(--text-primary)] text-[36px] text-center w-[min-content]">
                <p class="leading-[1.2]">Extensions Settings</p>
            </div>

            <div class="content-stretch flex flex-col items-start relative w-full">
                <div class="content-stretch flex flex-col gap-[30px] items-start relative w-full">
                    <div class="content-stretch flex items-center justify-between relative w-full">
                        <div class="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative text-[#385a92] text-[30px]">
                            <p class="leading-[1.2]">Visualizer</p>
                        </div>
                        <select id="visualizer-enabled" class="bg-[#385a92] border-2 border-[#385a92] border-solid h-[62.88px] rounded-[2617.374px] w-[200px] text-white text-[24px] p-2">
                            <option value="true">Enabled</option>
                            <option value="false">Disabled</option>
                        </select>
                    </div>

                    <div id="visualizer-form-container">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                            <div class="mb-4">
                                <label for="visualizer-username" class="block text-[var(--text-primary)] text-[24px] mb-2">Username:</label>
                                <input type="text" id="visualizer-username" class="w-full p-3 rounded-lg border border-[var(--border-color)] bg-[var(--profile-button-background-color)] text-[var(--text-primary)] text-[24px] focus:outline-none focus:ring-2 focus:ring-[var(--mimoja-blue)]" placeholder="Enter your Visualizer username">
                            </div>

                            <div class="mb-4">
                                <label for="visualizer-password" class="block text-[var(--text-primary)] text-[24px] mb-2">Password:</label>
                                <input type="password" id="visualizer-password" class="w-full p-3 rounded-lg border border-[var(--border-color)] bg-[var(--profile-button-background-color)] text-[var(--text-primary)] text-[24px] focus:outline-none focus:ring-2 focus:ring-[var(--mimoja-blue)]" placeholder="Enter your Visualizer password">
                            </div>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                            <input type="checkbox" id="visualizer-auto-upload" class="w-6 h-6 mr-3">
                            <label for="visualizer-auto-upload" class="text-[var(--text-primary)] text-[24px]">Auto-upload shots to Visualizer</label>
                            <label for="visualizer-min-duration" class="block text-[var(--text-primary)] text-[24px] mb-2">Minimum Shot Duration (seconds):</label>
                            <input type="number" id="visualizer-min-duration" class="w-32 p-3 rounded-lg border border-[var(--border-color)] bg-[var(--profile-button-background-color)] text-[var(--text-primary)] text-[24px] focus:outline-none focus:ring-2 focus:ring-[var(--mimoja-blue)]" min="1" value="5">
                        </div>

                        <div id="visualizer-status" class="text-[24px] p-2 rounded-lg"></div>

                        <button id="save-visualizer-credentials" class="bg-[var(--mimoja-blue)] h-[62.88px] rounded-[10px] w-[200px] text-white text-[24px] font-bold">
                            Save Credentials
                        </button>
                    </div>
                </div>
            </div>

            <!-- Divider -->
            <div class="h-0 relative w-full">
                <hr class="border-t border-[#c9c9c9] w-full" />
            </div>

            <div class="content-stretch flex flex-col items-start relative w-full">
                <div class="content-stretch flex flex-col gap-[30px] items-start relative w-full">
                    <div class="content-stretch flex items-center justify-between relative w-full">
                        <div class="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative text-[#385a92] text-[30px]">
                            <p class="leading-[1.2]">Extension 2</p>
                        </div>
                        <select class="bg-[#385a92] border-2 border-[#385a92] border-solid h-[62.88px] rounded-[2617.374px] w-[200px] text-white text-[24px] p-2">
                            <option>Enabled</option>
                            <option>Disabled</option>
                        </select>
                    </div>
                    <p class="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic relative text-[var(--text-primary)] text-[24px] w-full">
                        Manage the second extension
                    </p>
                </div>
            </div>

            <!-- Divider -->
            <div class="h-0 relative w-full">
                <hr class="border-t border-[#c9c9c9] w-full" />
            </div>

            <div class="content-stretch flex flex-col items-start relative w-full">
                <div class="content-stretch flex flex-col gap-[30px] items-start relative w-full">
                    <div class="content-stretch flex items-center justify-between relative w-full">
                        <div class="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative text-[#385a92] text-[30px]">
                            <p class="leading-[1.2]">Extension 3</p>
                        </div>
                        <select class="bg-[#385a92] border-2 border-[#385a92] border-solid h-[62.88px] rounded-[2617.374px] w-[200px] text-white text-[24px] p-2">
                            <option>Enabled</option>
                            <option>Disabled</option>
                        </select>
                    </div>
                    <p class="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic relative text-[var(--text-primary)] text-[24px] w-full">
                        Manage the third extension
                    </p>
                </div>
            </div>
        </div>
    `;

    // After returning the template, set up the event listeners
    setTimeout(setupVisualizerEventListeners, 0);

    return template;
}

// Function to set up event listeners for the Visualizer settings
function setupVisualizerEventListeners() {
    const saveButton = document.getElementById('save-visualizer-credentials');
    const usernameInput = document.getElementById('visualizer-username');
    const passwordInput = document.getElementById('visualizer-password');
    const autoUploadCheckbox = document.getElementById('visualizer-auto-upload');
    const minDurationInput = document.getElementById('visualizer-min-duration');
    const statusDiv = document.getElementById('visualizer-status');
    const enabledSelect = document.getElementById('visualizer-enabled');
    const formContainer = document.getElementById('visualizer-form-container');

    if (!saveButton) {
        console.warn('Save button for Visualizer credentials not found');
        return;
    }

    // Load existing settings when the form loads
    loadVisualizerSettings();

    // Initially hide the form if disabled
    if (enabledSelect && formContainer) {
        if (enabledSelect.value === 'false') {
            formContainer.style.display = 'none';
        }
    }

    // Add event listener to toggle form visibility based on selection
    if (enabledSelect) {
        enabledSelect.addEventListener('change', function() {
            if (this.value === 'true') {
                formContainer.style.display = 'block';
            } else {
                formContainer.style.display = 'none';
            }
        });
    }

    // Add click handler for the save button
    saveButton.addEventListener('click', async () => {
        const username = usernameInput.value.trim();
        const password = passwordInput.value; // Don't trim password as spaces might be valid

        if (!username || !password) {
            
                ui.showToast('Please enter both username and password', 1500, 'error');
            return;
        }

        statusDiv.textContent = 'Testing credentials...';
        statusDiv.className = 'text-gray-500 text-[24px] p-2 rounded-lg';

        try {
            // Import verifyVisualizerCredentials from api.js
            const { verifyVisualizerCredentials } = await import('/src/modules/api.js');

            const isValid = await verifyVisualizerCredentials(username, password);

            if (!isValid) {
                
                // Clear any previously saved (and now invalid) credentials
                localStorage.removeItem('visualizerUsername');
                localStorage.removeItem('visualizerPassword');
                ui.showToast('Visualizer log-in failed check credentials', 900, 'error');
                return; // Stop here if credentials are bad
            }

          
               ui.showToast('Visualizer log-in success', 900, 'success');
            // On success, save to localStorage for future auto-login
            localStorage.setItem('visualizerUsername', username);
            localStorage.setItem('visualizerPassword', btoa(password)); // Basic obfuscation

            // If credentials are valid, proceed to save to plugin
            const autoUpload = autoUploadCheckbox.checked;
            const minDuration = parseInt(minDurationInput.value, 10) || 5;
            const isEnabled = enabledSelect.value === 'true';

            // 1. Save UI-only settings to localStorage
            localStorage.setItem('visualizerAutoUpload', autoUpload.toString());
            localStorage.setItem('visualizerEnabled', isEnabled.toString());

            // 2. Prepare and save plugin settings
            const { setPluginSettings } = await import('/src/modules/api.js');
            const pluginId = 'visualizer.reaplugin';

            const settingsPayload = {
                Username: username,
                Password: password, // Send the actual password to the plugin
                AutoUpload: autoUpload,
                LengthThreshold: minDuration,
                Enabled: isEnabled
            };

            try {
                await setPluginSettings(pluginId, settingsPayload);
                   ui.showToast('redentials saved successfully!', 900, 'success');
                // Hide status after a few seconds
                setTimeout(() => {
                    statusDiv.textContent = '';
                }, 3000);

                // Show success toast
                ui.showToast('Visualizer settings saved successfully', 3000, 'success');

            } catch (error) {
                console.error('Failed to save visualizer plugin settings:', error);
                statusDiv.textContent = `Failed to save to REA plugin: ${error.message}.`;
                statusDiv.className = 'text-red-500 text-[24px] p-2 rounded-lg';
            }
        } catch (error) {
            console.error('Error during credential validation:', error);
            statusDiv.textContent = `Error validating credentials: ${error.message}`;
            statusDiv.className = 'text-red-500 text-[24px] p-2 rounded-lg';
        }
    });
}

// Function to load existing Visualizer settings
async function loadVisualizerSettings() {
    try {
        const { getPluginSettings } = await import('/src/modules/api.js');
        const pluginId = 'visualizer.reaplugin';

        const savedSettings = await getPluginSettings(pluginId);

        const usernameInput = document.getElementById('visualizer-username');
        const passwordInput = document.getElementById('visualizer-password');
        const autoUploadCheckbox = document.getElementById('visualizer-auto-upload');
        const minDurationInput = document.getElementById('visualizer-min-duration');
        const enabledSelect = document.getElementById('visualizer-enabled');
        const formContainer = document.getElementById('visualizer-form-container');

        if (savedSettings && savedSettings.Username) {
            usernameInput.value = savedSettings.Username;
        } else {
            usernameInput.value = '';
        }

        // Always clear the password field for security
        passwordInput.value = '';

        if (typeof savedSettings.AutoUpload !== 'undefined') {
            autoUploadCheckbox.checked = !!savedSettings.AutoUpload;
        }

        if (typeof savedSettings.LengthThreshold !== 'undefined') {
            minDurationInput.value = parseInt(savedSettings.LengthThreshold, 10) || 5;
        }

        if (typeof savedSettings.Enabled !== 'undefined') {
            enabledSelect.value = savedSettings.Enabled.toString();
        } else {
            // Default to enabled if not set
            enabledSelect.value = 'true';
        }

        // Set form visibility based on the enabled state
        if (formContainer) {
            if (enabledSelect && enabledSelect.value === 'false') {
                formContainer.style.display = 'none';
            } else {
                formContainer.style.display = 'block';
            }
        }
    } catch (error) {
        console.error('Failed to load Visualizer settings:', error);
        const statusDiv = document.getElementById('visualizer-status');
        if (statusDiv) {
            statusDiv.textContent = 'Could not load plugin settings.';
            statusDiv.className = 'text-red-500 text-[24px] p-2 rounded-lg';
        }
    }
}

// Render updates settings
export function renderUpdatesSettings() {
    return `
        <div class="content-stretch flex flex-col gap-[60px] items-start relative w-full">
            <div class="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] min-w-full not-italic relative text-[var(--text-primary)] text-[36px] text-center w-[min-content]">
                <p class="leading-[1.2]">Updates Settings</p>
            </div>

            <div class="content-stretch flex flex-col items-start relative w-full">
                <div class="content-stretch flex flex-col gap-[30px] items-start relative w-full">
                    <div class="content-stretch flex items-center justify-between relative w-full">
                        <div class="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative text-[#385a92] text-[30px]">
                            <p class="leading-[1.2]">Firmware Update</p>
                        </div>
                        <button class="bg-[#385a92] h-[62.88px] rounded-[10px] w-[200px] text-white text-[24px] font-bold">
                            Check
                        </button>
                    </div>
                    <p class="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic relative text-[var(--text-primary)] text-[24px] w-full">
                        Check for firmware updates
                    </p>
                </div>
            </div>

            <!-- Divider -->
            <div class="h-0 relative w-full">
                <hr class="border-t border-[#c9c9c9] w-full" />
            </div>

            <div class="content-stretch flex flex-col items-start relative w-full">
                <div class="content-stretch flex flex-col gap-[30px] items-start relative w-full">
                    <div class="content-stretch flex items-center justify-between relative w-full">
                        <div class="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative text-[#385a92] text-[30px]">
                            <p class="leading-[1.2]">App Update</p>
                        </div>
                        <button class="bg-[#385a92] h-[62.88px] rounded-[10px] w-[200px] text-white text-[24px] font-bold">
                            Check
                        </button>
                    </div>
                    <p class="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic relative text-[var(--text-primary)] text-[24px] w-full">
                        Check for application updates
                    </p>
                </div>
            </div>
        </div>
    `;
}

// Render general settings
export function renderGeneralSettings() {
    return `
        <div class="content-stretch flex flex-col gap-[60px] items-start relative w-full">
            <div class="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] min-w-full not-italic relative text-[var(--text-primary)] text-[36px] text-center w-[min-content]">
                <p class="leading-[1.2]">General Settings</p>
            </div>

            <div class="text-[24px] text-[var(--text-primary)] p-4">
                Select a category from the navigation panel to view and edit settings.
            </div>
        </div>
    `;
}

// Render subcategories for a selected main category
export function renderSubcategories(mainCategoryKey) {
    const category = settingsTree[mainCategoryKey];
    if (!category || !category.subcategories || category.subcategories.length === 0) {
        return `<div class="p-4 text-center text-gray-500">No sub-categories.</div>`;
    }

    let subcategoryItems = '';
    category.subcategories.forEach((subcat) => {
        subcategoryItems += `
            <li>
                <button class="settings-subnav-btn w-full text-left px-4 py-3 rounded-lg text-[20px] text-[#959595] hover:text-white hover:bg-[#2c4a7a] flex items-center"
                        data-category="${subcat.settingsCategory}">
                    <span>${subcat.name}</span>
                </button>
            </li>
        `;
    });

    return `<ul class="space-y-1">${subcategoryItems}</ul>`;
}


function initResizableSubNav() {
    const separator = document.getElementById('sub-categories-separator');
    const mainCategoriesPanel = document.getElementById('main-categories-panel');
    const subCategoriesPanel = document.getElementById('sub-categories-panel');

    if (!separator || !mainCategoriesPanel || !subCategoriesPanel) {
        console.warn('Resizable sub-navigation elements not found.');
        return;
    }

    let isDragging = false;

    separator.addEventListener('mousedown', (e) => {
        isDragging = true;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';

        const startX = e.clientX;
        const startMainWidth = mainCategoriesPanel.offsetWidth;
        const startSubWidth = subCategoriesPanel.offsetWidth;

        function doDrag(e) {
            if (!isDragging) return;
            const dx = e.clientX - startX;
            const newMainWidth = startMainWidth + dx;
            const newSubWidth = startSubWidth - dx;

            if (newMainWidth > 150 && newSubWidth > 150) {
                mainCategoriesPanel.style.width = `${newMainWidth}px`;
                subCategoriesPanel.style.width = `${newSubWidth}px`;
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


// Cache for loading promises to prevent multiple simultaneous requests
let settingsLoadingPromises = {};

// Preload all settings in the background
export async function preloadSettings() {
    // If we're already preloading, return the existing promise
    if (settingsLoadingPromises.preload) {
        return settingsLoadingPromises.preload;
    }

    settingsLoadingPromises.preload = _preloadSettingsInternal();
    return settingsLoadingPromises.preload;
}

// Internal function to preload all settings
async function _preloadSettingsInternal() {
    try {
        // Set loading flags
        settingsCache.reaLoading = true;
        settingsCache.de1Loading = true;
        settingsCache.de1AdvancedLoading = true;

        // Reset error flags
        settingsCache.reaError = null;
        settingsCache.de1Error = null;
        settingsCache.de1AdvancedError = null;

        // Fetch all settings in parallel using Promise.allSettled to handle individual failures
        const [reaSettingsResult, de1SettingsResult, de1AdvancedSettingsResult] = await Promise.allSettled([
            getReaSettings(),
            getDe1Settings(),
            getDe1AdvancedSettings()
        ]);

        // Process results and handle errors appropriately
        let reaSettings = null;
        let de1Settings = null;
        let de1AdvancedSettings = null;

        // Handle REA settings result
        if (reaSettingsResult.status === 'fulfilled') {
            reaSettings = reaSettingsResult.value;
        } else {
            console.error('Error loading REA settings:', reaSettingsResult.reason);
            settingsCache.reaError = reaSettingsResult.reason.message;

            // Check if this is a 500 error and redirect if needed
            if (reaSettingsResult.reason.status === 500) {
                console.log('REA settings API returned 500 error, redirecting to home page');
                setTimeout(() => {
                    ui.showToast('Unable to load settings. Check if De1 is connected. Returned to home page.', 5000, 'error');
                }, 1000);
                
                loadPage('/index.html');
                return { reaSettings: null, de1Settings: null, de1AdvancedSettings: null };
            }
        }

        // Handle DE1 settings result
        if (de1SettingsResult.status === 'fulfilled') {
            de1Settings = de1SettingsResult.value;
        } else {
            console.error('Error loading DE1 settings:', de1SettingsResult.reason);
            settingsCache.de1Error = de1SettingsResult.reason.message;
            
            // Check if this is a 500 error and redirect if needed
            if (de1SettingsResult.reason.status === 500) {
                console.log('DE1 settings API returned 500 error, redirecting to home page');
                setTimeout(() => {
                    ui.showToast('Unable to load settings. Check if De1 is connected. Returned to home page.', 5000, 'error');
                }, 1000);
                loadPage('/index.html');
               
                return { reaSettings: null, de1Settings: null, de1AdvancedSettings: null };
            }
        }

        // Handle DE1 advanced settings result
        if (de1AdvancedSettingsResult.status === 'fulfilled') {
            de1AdvancedSettings = de1AdvancedSettingsResult.value;
        } else {
            console.error('Error loading DE1 advanced settings:', de1AdvancedSettingsResult.reason);
            settingsCache.de1AdvancedError = de1AdvancedSettingsResult.reason.message;
            
            // Check if this is a 500 error and redirect if needed
            if (de1AdvancedSettingsResult.reason.status === 500) {
                console.log('DE1 advanced settings API returned 500 error, redirecting to home page');
                setTimeout(() => {
                    ui.showToast('Unable to load settings. Check if De1 is connected. Returned to home page.', 5000, 'error');
                }, 1000);
                loadPage('/index.html');
                return { reaSettings: null, de1Settings: null, de1AdvancedSettings: null };
            }
        }

        // Update cache with results
        settingsCache.rea = reaSettings;
        settingsCache.de1 = de1Settings;
        settingsCache.de1Advanced = de1AdvancedSettings;

        // Update loading flags
        settingsCache.reaLoading = false;
        settingsCache.de1Loading = false;
        settingsCache.de1AdvancedLoading = false;

        return { reaSettings, de1Settings, de1AdvancedSettings };
    } catch (error) {
        console.error('Error during settings preload:', error);
        ui.showToast('Failed to preload settings', 5000, 'error');

        // Ensure loading flags are reset even in case of error
        settingsCache.reaLoading = false;
        settingsCache.de1Loading = false;
        settingsCache.de1AdvancedLoading = false;

        return { reaSettings: null, de1Settings: null, de1AdvancedSettings: null };
    } finally {
        // Clear the preload promise after completion
        delete settingsLoadingPromises.preload;
    }
}


// Helper function to get title for a category
function getCategoryTitle(category) {
    switch(category) {
        case 'rea': return 'REA Application Settings';
        case 'quickadjustments': return 'Quick Adjustments';
        case 'flowmultiplier': return 'Flow Multiplier Settings';
        case 'steam': return 'Steam Settings';
        case 'hotwater': return 'Hot Water Settings';
        case 'watertank': return 'Water Tank Settings';
        case 'flush': return 'Flush Settings';
        case 'de1': return 'DE1 Settings';
        case 'fanthreshold': return 'Fan Threshold Settings';
        case 'usbchargermode': return 'USB Charger Mode Settings';
        case 'de1advanced': return 'Machine Advanced Settings';
        default: return 'Settings';
    }
}

// Initialize the settings page
export async function initializeSettings() {
    // Preload all settings in the background before initializing the UI
    await preloadSettings();

    // Set up event listeners
    document.getElementById('cancel-settings-btn').addEventListener('click', () => {
        // Navigate back to main page using router
        loadPage('/index.html');
    });

    document.getElementById('save-settings-btn').addEventListener('click', async () => {
        ui.showToast('Saving all settings...', 3000, 'info');
         const visualizerEnabledSelect = document.getElementById('visualizer-enabled');
        if (visualizerEnabledSelect) {
            const isEnabled = visualizerEnabledSelect.value ;
            localStorage.setItem('visualizerEnabled', isEnabled.toString());
        }
        // Implementation would save all modified settings
        loadPage('/index.html');
    });

    initResizableSubNav();

    // Set up main category navigation
    document.querySelectorAll('.settings-nav-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            // Handle active state for main categories
            document.querySelectorAll('.settings-nav-btn').forEach(b => {
                b.classList.remove('text-white', 'bg-[#2c4a7a]');
                b.classList.add('text-[#959595]'); // Explicitly re-add default color
            });
            this.classList.remove('text-[#959595]'); // Explicitly remove default color
            this.classList.add('text-white', 'bg-[#2c4a7a]');

            const mainCategoryKey = this.id.replace(/-btn$/, '').replace(/-/g, '');

            // Render subcategories
            const subCategoriesPanel = document.getElementById('sub-categories-panel');
            if (subCategoriesPanel) {
                subCategoriesPanel.innerHTML = renderSubcategories(mainCategoryKey);

                // Add event listeners to the new subcategory buttons
                subCategoriesPanel.querySelectorAll('.settings-subnav-btn').forEach(subBtn => {
                    subBtn.addEventListener('click', function(e) {
                        e.preventDefault(); // Prevent any default behavior that might cause page reload
                        e.stopPropagation(); // Stop event from bubbling up

                        // Handle active state for subcategories
                        subCategoriesPanel.querySelectorAll('.settings-subnav-btn').forEach(sb => {
                             sb.classList.remove('bg-[#d7dee9]', 'text-[var(--mimoja-blue)]');
                             sb.classList.add('text-[#959595]');
                        });
                        this.classList.remove('text-[#959595]');
                        this.classList.add('bg-[#d7dee9]', 'text-[var(--mimoja-blue)]');

                        const settingsCategory = this.dataset.category;
                        activeSettingsCategory = settingsCategory; // Set the active category
                        updateSettingsContentArea(settingsCategory); // Use the new helper function
                    });
                });
            }

            // After rendering subcategories, attempt to click the first one if it exists
            const firstSubCategoryBtn = subCategoriesPanel?.querySelector('.settings-subnav-btn');
            if (firstSubCategoryBtn) {
                firstSubCategoryBtn.click();
            } else {
                // If no subcategories, clear the content area and set activeSettingsCategory to null
                const contentArea = document.getElementById('settings-content-area');
                if (contentArea) {
                    contentArea.innerHTML = `<div class="flex flex-col items-center justify-center h-full text-center p-8">
                        <p class="text-[var(--text-primary)] text-[28px]">Select a sub-category from the menu</p>
                    </div>`;
                    activeSettingsCategory = null;
                }
            }
        });
    });

    // Initial load of settings content: Simulate a click on the first main category button
    const firstMainCategoryBtn = document.querySelector('.settings-nav-btn');
    if (firstMainCategoryBtn) {
        firstMainCategoryBtn.click();
    } else {
        // Fallback if no main category buttons are found
        const contentArea = document.getElementById('settings-content-area');
        if (contentArea) {
             contentArea.innerHTML = `<div class="flex flex-col items-center justify-center h-full text-center p-8">
                 <p class="text-[var(--text-primary)] text-[28px]">No settings categories found.</p>
             </div>`;
             activeSettingsCategory = null;
        }
    }

    // Set up search functionality
    setupSettingsSearch();

    // Apply translations to the settings page
    setLanguage(getCurrentLanguage());

    // Expose update functions to global scope for inline event handlers
    window.updateReaSetting = updateReaSetting;
    window.updateDe1Setting = updateDe1Setting;
    window.updateDe1AdvancedSetting = updateDe1AdvancedSetting;
    window.flashPlusMinusButton = ui.flashPlusMinusButton;
    window.retryLoadSettings = () => {
        // Function to retry loading settings when user clicks retry button
        loadSettings();
    };

    // Expose flush adjustment functions to global scope
    window.adjustFlushTemp = function(change) {
        const input = document.getElementById('flushTempInput');
        if (input) {
            let newValue = parseFloat(input.value) + change;
            // Ensure value stays within bounds (5 to 95 degrees)
            newValue = Math.max(5, Math.min(95, newValue));
            input.value = newValue.toFixed(1);
            // Trigger the onchange event to update the setting
            input.dispatchEvent(new Event('change'));
        }
    };

    window.adjustFlushFlow = function(change) {
        const input = document.getElementById('flushFlowInput');
        if (input) {
            let newValue = parseFloat(input.value) + change;
            // Ensure value stays within bounds (1 to 8 ml/s)
            newValue = Math.max(1, Math.min(8, newValue));
            input.value = newValue.toFixed(1);
            // Trigger the onchange event to update the setting
            input.dispatchEvent(new Event('change'));
        }
    };

    window.adjustHotWaterFlow = function(change) {
        const input = document.getElementById('hotWaterFlowInput');
        if (input) {
            let newValue = parseFloat(input.value) + change;
            // Ensure value stays within bounds (0 to 10 ml/s)
            newValue = Math.max(0, Math.min(10, newValue));
            input.value = newValue.toFixed(1);
            // Trigger the onchange event to update the setting
            input.dispatchEvent(new Event('change'));
        }
    };

    ui.initResizablePanels('separator');
}

// Set up search functionality for settings
function setupSettingsSearch() {
    const searchInput = document.getElementById('settings-search');
    if (!searchInput) {
        console.warn('Settings search input not found');
        return;
    }

    // Store original navigation structure
    const originalMainCategories = {};
    Object.keys(settingsTree).forEach(key => {
        originalMainCategories[key] = { ...settingsTree[key] };
    });

    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();

        if (searchTerm === '') {
            // If search is empty, restore original navigation
            restoreOriginalNavigation();
            return;
        }

        // Filter categories based on search term
        const filteredCategories = {};
        
        Object.entries(settingsTree).forEach(([key, category]) => {
            // Check if main category name matches
            const mainCategoryMatches = category.name.toLowerCase().includes(searchTerm);
            
            // Filter subcategories that match
            const matchingSubcategories = category.subcategories.filter(subcat => 
                subcat.name.toLowerCase().includes(searchTerm) || 
                subcat.id.toLowerCase().includes(searchTerm)
            );

            // Include the category if either main name matches or any subcategory matches
            if (mainCategoryMatches || matchingSubcategories.length > 0) {
                filteredCategories[key] = {
                    name: category.name,
                    subcategories: matchingSubcategories.length > 0 ? matchingSubcategories : category.subcategories
                };
            }
        });

        // Update the navigation with filtered results
        updateNavigationWithResults(filteredCategories, searchTerm);
    });
}

// Restore original navigation when search is cleared
function restoreOriginalNavigation() {
    const mainCategoriesPanel = document.getElementById('main-categories-panel');
    if (!mainCategoriesPanel) return;

    // Clear and rebuild the main categories panel
    const navUl = mainCategoriesPanel.querySelector('nav ul');
    if (navUl) {
        navUl.innerHTML = '';
        
        Object.entries(settingsTree).forEach(([key, category]) => {
            const li = document.createElement('li');
            const btn = document.createElement('button');
            btn.id = `${key}-btn`;
            btn.className = 'settings-nav-btn w-full text-left px-4 py-3 rounded-lg text-[24px] text-[#959595] hover:text-white hover:bg-[#2c4a7a] flex items-center';
            btn.innerHTML = `<span>${category.name}</span>`;
            
            navUl.appendChild(li);
            li.appendChild(btn);
        });
    }

    // Reattach event listeners to the restored buttons
    document.querySelectorAll('.settings-nav-btn').forEach(btn => {
        // Remove any existing listeners to avoid duplicates
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        newBtn.addEventListener('click', function() {
            // Handle active state for main categories
            document.querySelectorAll('.settings-nav-btn').forEach(b => {
                b.classList.remove('text-white', 'bg-[#2c4a7a]');
                b.classList.add('text-[#959595]'); // Explicitly re-add default color
            });
            this.classList.remove('text-[#959595]'); // Explicitly remove default color
            this.classList.add('text-white', 'bg-[#2c4a7a]');

            const mainCategoryKey = this.id.replace(/-btn$/, '').replace(/-/g, '');

            // Render subcategories
            const subCategoriesPanel = document.getElementById('sub-categories-panel');
            if (subCategoriesPanel) {
                subCategoriesPanel.innerHTML = renderSubcategories(mainCategoryKey);

                // Add event listeners to the new subcategory buttons
                subCategoriesPanel.querySelectorAll('.settings-subnav-btn').forEach(subBtn => {
                    subBtn.addEventListener('click', function(e) {
                        e.preventDefault(); // Prevent any default behavior that might cause page reload
                        e.stopPropagation(); // Stop event from bubbling up

                        // Handle active state for subcategories
                        subCategoriesPanel.querySelectorAll('.settings-subnav-btn').forEach(sb => {
                             sb.classList.remove('bg-[#d7dee9]', 'text-[var(--mimoja-blue)]');
                             sb.classList.add('text-[#959595]');
                        });
                        this.classList.remove('text-[#959595]');
                        this.classList.add('bg-[#d7dee9]', 'text-[var(--mimoja-blue)]');

                        const settingsCategory = this.dataset.category;
                        activeSettingsCategory = settingsCategory; // Set the active category
                        updateSettingsContentArea(settingsCategory); // Use the new helper function
                    });
                });
            }

            // After rendering subcategories, attempt to click the first one if it exists
            const firstSubCategoryBtn = subCategoriesPanel?.querySelector('.settings-subnav-btn');
            if (firstSubCategoryBtn) {
                firstSubCategoryBtn.click();
            } else {
                // If no subcategories, clear the content area and set activeSettingsCategory to null
                const contentArea = document.getElementById('settings-content-area');
                if (contentArea) {
                    contentArea.innerHTML = `<div class="flex flex-col items-center justify-center h-full text-center p-8">
                        <p class="text-[var(--text-primary)] text-[28px]">Select a sub-category from the menu</p>
                    </div>`;
                    activeSettingsCategory = null;
                }
            }
        });
    });

    // Clear the subcategories panel when restoring original navigation
    const subCategoriesPanel = document.getElementById('sub-categories-panel');
    if (subCategoriesPanel) {
        subCategoriesPanel.innerHTML = '';
    }
}

// Update navigation with search results
function updateNavigationWithResults(filteredCategories, searchTerm) {
    const mainCategoriesPanel = document.getElementById('main-categories-panel');
    if (!mainCategoriesPanel) return;

    // Clear and rebuild the main categories panel with filtered results
    const navUl = mainCategoriesPanel.querySelector('nav ul');
    if (navUl) {
        navUl.innerHTML = '';
        
        Object.entries(filteredCategories).forEach(([key, category]) => {
            const li = document.createElement('li');
            const btn = document.createElement('button');
            btn.id = `${key}-btn`;
            btn.className = 'settings-nav-btn w-full text-left px-4 py-3 rounded-lg text-[24px] text-[#959595] hover:text-white hover:bg-[#2c4a7a] flex items-center';
            
            // Highlight matching text in the category name
            const highlightedName = highlightMatch(category.name, searchTerm);
            btn.innerHTML = `<span>${highlightedName}</span>`;
            
            navUl.appendChild(li);
            li.appendChild(btn);
        });
    }

    // Attach event listeners to the filtered buttons
    document.querySelectorAll('.settings-nav-btn').forEach(btn => {
        // Remove any existing listeners to avoid duplicates
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        newBtn.addEventListener('click', function() {
            // Handle active state for main categories
            document.querySelectorAll('.settings-nav-btn').forEach(b => {
                b.classList.remove('text-white', 'bg-[#2c4a7a]');
                b.classList.add('text-[#959595]'); // Explicitly re-add default color
            });
            this.classList.remove('text-[#959595]'); // Explicitly remove default color
            this.classList.add('text-white', 'bg-[#2c4a7a]');

            const mainCategoryKey = this.id.replace(/-btn$/, '').replace(/-/g, '');

            // Render matching subcategories
            const subCategoriesPanel = document.getElementById('sub-categories-panel');
            if (subCategoriesPanel) {
                subCategoriesPanel.innerHTML = renderFilteredSubcategories(mainCategoryKey, searchTerm);

                // Add event listeners to the new subcategory buttons
                subCategoriesPanel.querySelectorAll('.settings-subnav-btn').forEach(subBtn => {
                    subBtn.addEventListener('click', function(e) {
                        e.preventDefault(); // Prevent any default behavior that might cause page reload
                        e.stopPropagation(); // Stop event from bubbling up

                        // Handle active state for subcategories
                        subCategoriesPanel.querySelectorAll('.settings-subnav-btn').forEach(sb => {
                             sb.classList.remove('bg-[#d7dee9]', 'text-[var(--mimoja-blue)]');
                             sb.classList.add('text-[#959595]');
                        });
                        this.classList.remove('text-[#959595]');
                        this.classList.add('bg-[#d7dee9]', 'text-[var(--mimoja-blue)]');

                        const settingsCategory = this.dataset.category;
                        activeSettingsCategory = settingsCategory; // Set the active category
                        updateSettingsContentArea(settingsCategory); // Use the new helper function
                    });
                });
            }

            // After rendering subcategories, attempt to click the first one if it exists
            const firstSubCategoryBtn = subCategoriesPanel?.querySelector('.settings-subnav-btn');
            if (firstSubCategoryBtn) {
                firstSubCategoryBtn.click();
            } else {
                // If no subcategories, clear the content area and set activeSettingsCategory to null
                const contentArea = document.getElementById('settings-content-area');
                if (contentArea) {
                    contentArea.innerHTML = `<div class="flex flex-col items-center justify-center h-full text-center p-8">
                        <p class="text-[var(--text-primary)] text-[28px]">Select a sub-category from the menu</p>
                    </div>`;
                    activeSettingsCategory = null;
                }
            }
        });
    });
}

// Render filtered subcategories based on search term
function renderFilteredSubcategories(mainCategoryKey, searchTerm) {
    const category = settingsTree[mainCategoryKey];
    if (!category || !category.subcategories || category.subcategories.length === 0) {
        return `<div class="p-4 text-center text-gray-500">No sub-categories.</div>`;
    }

    // Filter subcategories that match the search term
    const matchingSubcategories = category.subcategories.filter(subcat => 
        subcat.name.toLowerCase().includes(searchTerm) || 
        subcat.id.toLowerCase().includes(searchTerm)
    );

    if (matchingSubcategories.length === 0) {
        return `<div class="p-4 text-center text-gray-500">No matching subcategories.</div>`;
    }

    let subcategoryItems = '';
    matchingSubcategories.forEach((subcat) => {
        // Highlight matching text in the subcategory name
        const highlightedName = highlightMatch(subcat.name, searchTerm);
        
        subcategoryItems += `
            <li>
                <button class="settings-subnav-btn w-full text-left px-4 py-3 rounded-lg text-[20px] text-[#959595] hover:text-white hover:bg-[#2c4a7a] flex items-center"
                        data-category="${subcat.settingsCategory}">
                    <span>${highlightedName}</span>
                </button>
            </li>
        `;
    });

    return `<ul class="space-y-1">${subcategoryItems}</ul>`;
}

// Highlight matching text within a string
function highlightMatch(text, searchTerm) {
    if (!searchTerm) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-300 text-black">$1</mark>');
}