import { getReaSettings, getDe1Settings, getDe1AdvancedSettings, setReaSettings, setDe1Settings, setDe1AdvancedSettings } from '/src/modules/api.js';
import * as ui from '/src/modules/ui.js';
import { initScaling } from '/src/modules/scaling.js';
import { loadPage } from '/src/modules/router.js';
import { getSupportedLanguages, getCurrentLanguage, setLanguage } from '/src/modules/i18n.js';

// Cache for settings data
let settingsCache = {
    rea: null,
    de1: null,
    de1Advanced: null
};

// Define the tree structure for settings navigation
const settingsTree = {
    'quickadjustments': {
        name: 'Quick Adjustments',
        subcategories: [
            { id: 'brewtemp', name: 'Brew Temperature', settingsCategory: 'de1' },
            { id: 'steamtemp', name: 'Steam Temperature', settingsCategory: 'de1' },
            { id: 'Flush', name: 'Flush', settingsCategory: 'flush' },
            { id: 'pressure', name: 'Machine Settings', settingsCategory: 'de1' }
        ]
    },
    'bluetooth': {
        name: 'Bluetooth',
        subcategories: [
            { id: 'devicepairing', name: 'Device Pairing', settingsCategory: 'bluetooth' },
            { id: 'connections', name: 'Connections', settingsCategory: 'bluetooth' },
            { id: 'pairinghistory', name: 'Pairing History', settingsCategory: 'bluetooth' }
        ]
    },
    'calibration': {
        name: 'Calibration',
        subcategories: [
            { id: 'scalecal', name: 'Scale Calibration', settingsCategory: 'calibration' },
            { id: 'tempcal', name: 'Temperature Calibration', settingsCategory: 'calibration' },
            { id: 'flowcal', name: 'Flow Calibration', settingsCategory: 'calibration' }
        ]
    },
    'maintenance': {
        name: 'Maintenance',
        subcategories: [
            { id: 'descaling', name: 'Descaling Cycle', settingsCategory: 'maintenance' },
            { id: 'cleaning', name: 'Cleaning Cycle', settingsCategory: 'maintenance' },
            { id: 'filterreplace', name: 'Filter Replacement', settingsCategory: 'maintenance' }
        ]
    },
    'skin': {
        name: 'Skin',
        subcategories: [
            { id: 'colorscheme', name: 'Color Scheme', settingsCategory: 'appearance' },
            { id: 'layout', name: 'Layout', settingsCategory: 'appearance' },
            { id: 'fonts', name: 'Fonts', settingsCategory: 'appearance' }
        ]
    },
    'language': {
        name: 'Language',
        subcategories: [
            { id: 'selectlang', name: 'Select Language', settingsCategory: 'language' },
            { id: 'units', name: 'Units', settingsCategory: 'language' },
            { id: 'formats', name: 'Formats', settingsCategory: 'language' }
        ]
    },
    'extensions': {
        name: 'Extensions',
        subcategories: [
            { id: 'installed', name: 'Installed Extensions', settingsCategory: 'extensions' },
            { id: 'available', name: 'Available Extensions', settingsCategory: 'extensions' },
            { id: 'updates', name: 'Extension Updates', settingsCategory: 'extensions' }
        ]
    },
    'miscellaneous': {
        name: 'Miscellaneous',
        subcategories: [
            { id: 'privacy', name: 'Privacy Settings', settingsCategory: 'misc' },
            { id: 'notifications', name: 'Notifications', settingsCategory: 'misc' },
            { id: 'backup', name: 'Backup & Restore', settingsCategory: 'misc' }
        ]
    },
    'updates': {
        name: 'Updates',
        subcategories: [
            { id: 'checkupdates', name: 'Check for Updates', settingsCategory: 'updates' },
            { id: 'autoupdate', name: 'Auto-update Settings', settingsCategory: 'updates' },
            { id: 'changelog', name: 'View Changelog', settingsCategory: 'updates' }
        ]
    },
    'usermanual': {
        name: 'User Manual',
        subcategories: [
            { id: 'onlinehelp', name: 'Online Help', settingsCategory: 'help' },
            { id: 'tutorials', name: 'Tutorials', settingsCategory: 'help' },
        ]
    }
};

// Load all settings data
export async function loadSettings() {
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
    }
}

// Update REA settings
export async function updateReaSetting(key, value) {
    try {
        const payload = { [key]: value };
        await setReaSettings(payload);
        settingsCache.rea[key] = value;
        ui.showToast('REA setting updated successfully', 3000, 'success');
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
    } catch (error) {
        console.error('Error updating DE1 advanced setting:', error);
        ui.showToast(`Failed to update DE1 advanced setting: ${error.message}`, 5000, 'error');
    }
}

function renderLanguageSettings() {
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
            <div class="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] not-italic relative text-[#121212] text-[48px] text-center w-full">
                <p class="leading-[1.2]">Language Settings</p>
            </div>
            <div class="h-0 relative w-full"><hr class="border-t border-[#c9c9c9] w-full" /></div>
            <div class="flex flex-col items-start relative w-full max-w-full">
                <div class="flex flex-col gap-[40px] items-start relative w-full max-w-full">
                    <div class="flex items-center justify-between relative w-full max-w-full">
                        <div class="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative text-[#385a92] text-[40px]">
                            <p class="leading-[1.2]">Display Language</p>
                        </div>
                        <select id="language-switcher" class="bg-[#385a92] border-2 border-[#385a92] border-solid h-[62.88px] rounded-[2617.374px] w-[250px] text-white text-[24px] p-2 max-w-[250px]">
                            <option>Loading...</option>
                        </select>
                    </div>
                    <p class="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic relative text-[#2d2d2d] text-[32px] w-full max-w-full break-words">
                        Choose the language for the application interface.
                    </p>
                </div>
            </div>
        </div>
    `;
}

// Render settings content based on selected category
export function renderSettingsContent(category) {
    switch(category) {
        case 'rea':
        case 'quickadjustments':
        case 'bluetooth':
        case 'skin':
        case 'extensions':
        case 'miscellaneous':
        case 'updates':
            return renderReaSettingsForm(settingsCache.rea);
        case 'usermanual':
        case 'onlinehelp':
        case 'tutorials':
        case 'help':
            console.log("rendering user manual ");
            return renderUserManualSettings();
        case 'language':
            return renderLanguageSettings();
        case 'de1':
            return renderDe1SettingsForm(settingsCache.de1);
        case 'de1advanced':
            return renderDe1AdvancedSettingsForm(settingsCache.de1Advanced);
        case 'flush':
            return renderFlushSettingsForm(settingsCache.de1);
        case 'calibration':
            return renderCalibrationSettings();
        case 'maintenance':
            return renderMaintenanceSettings();
        default:
            return renderGeneralSettings();
    }
}

// Render REA settings form matching design
export function renderReaSettingsForm(settings) {
    if (!settings) {
        return `
            <div class="flex flex-col gap-[60px] items-start relative w-full max-w-full overflow-x-hidden">
                <div class="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] not-italic relative text-[#121212] text-[48px] text-center w-full">
                    <p class="leading-[1.2]">REA Application Settings</p>
                </div>
                <div class="text-red-500 p-4 text-[32px]">Failed to load REA settings</div>
            </div>
        `;
    }

    return `
        <div class="flex flex-col gap-[60px] items-start relative w-full max-w-full overflow-x-hidden">
            <div class="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] not-italic relative text-[#121212] text-[48px] text-center w-full">
                <p class="leading-[1.2]">REA Application Settings</p>
            </div>

            <!-- Divider -->
            <div class="h-0 relative w-full">
                <hr class="border-t border-[#c9c9c9] w-full" />
            </div>

            <div class="flex flex-col items-start relative w-full max-w-full">
                <div class="flex flex-col gap-[40px] items-start relative w-full max-w-full">
                    <div class="flex items-center justify-between relative w-full max-w-full">
                        <div class="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative text-[#385a92] text-[40px]">
                            <p class="leading-[1.2]">Gateway Mode</p>
                        </div>
                        <select id="gatewayModeSelect" class="bg-[#385a92] border-2 border-[#385a92] border-solid h-[62.88px] rounded-[2617.374px] w-[200px] text-white text-[24px] p-2 max-w-[200px]"
                                onchange="window.updateReaSetting('gatewayMode', this.value)">
                            <option value="disabled" ${settings.gatewayMode === 'disabled' ? 'selected' : ''}>Disabled</option>
                            <option value="tracking" ${settings.gatewayMode === 'tracking' ? 'selected' : ''}>Tracking</option>
                            <option value="full" ${settings.gatewayMode === 'full' ? 'selected' : ''}>Full</option>
                        </select>
                    </div>
                    <p class="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic relative text-[#2d2d2d] text-[32px] w-full max-w-full break-words">
                        Controls how the gateway monitors and controls the espresso machine
                    </p>
                </div>
            </div>

            <!-- Divider -->
            <div class="h-0 relative w-full">
                <hr class="border-t border-[#c9c9c9] w-full" />
            </div>

            <div class="flex flex-col items-start relative w-full max-w-full">
                <div class="flex flex-col gap-[40px] items-start relative w-full max-w-full">
                    <div class="flex items-center justify-between relative w-full max-w-full">
                        <div class="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative text-[#385a92] text-[40px]">
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
                    <p class="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic relative text-[#2d2d2d] text-[32px] w-full max-w-full break-words">
                        Sets the verbosity of application logging output
                    </p>
                </div>
            </div>

            <!-- Divider -->
            <div class="h-0 relative w-full">
                <hr class="border-t border-[#c9c9c9] w-full" />
            </div>

            <div class="flex flex-col items-start relative w-full max-w-full">
                <div class="flex flex-col gap-[40px] items-start relative w-full max-w-full">
                    <div class="flex items-center justify-between relative w-full max-w-full">
                        <div class="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative text-[#385a92] text-[40px]">
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
                    <p class="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic relative text-[#2d2d2d] text-[32px] w-full max-w-full break-words">
                        Multiplier for projected weight calculation. Higher values stop shots earlier.
                    </p>
                </div>
            </div>

            <!-- Divider -->
            <div class="h-0 relative w-full">
                <hr class="border-t border-[#c9c9c9] w-full" />
            </div>

            <div class="flex flex-col items-start relative w-full max-w-full">
                <div class="flex flex-col gap-[40px] items-start relative w-full max-w-full">
                    <div class="flex items-center justify-between relative w-full max-w-full">
                        <div class="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative text-[#385a92] text-[40px]">
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
                    <p class="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic relative text-[#2d2d2d] text-[32px] w-full max-w-full break-words">
                        Look-ahead time in seconds for projected volume calculation. Accounts for system lag.
                    </p>
                </div>
            </div>

            <!-- Divider -->
            <div class="h-0 relative w-full">
                <hr class="border-t border-[#c9c9c9] w-full" />
            </div>

            <div class="flex flex-col items-start relative w-full max-w-full">
                <div class="flex flex-col gap-[40px] items-start relative w-full max-w-full">
                    <div class="flex items-center justify-between relative w-full max-w-full">
                        <div class="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative text-[#385a92] text-[40px]">
                            <p class="leading-[1.2]">Scale Power Management</p>
                        </div>
                        <select id="scalePowerModeSelect" class="bg-[#385a92] border-2 border-[#385a92] border-solid h-[62.88px] rounded-[2617.374px] w-[250px] text-white text-[24px] p-2 max-w-[250px]"
                                onchange="window.updateReaSetting('scalePowerMode', this.value)">
                            <option value="disabled" ${settings.scalePowerMode === 'disabled' ? 'selected' : ''}>Disabled</option>
                            <option value="displayOff" ${settings.scalePowerMode === 'displayOff' ? 'selected' : ''}>Display Off</option>
                            <option value="disconnect" ${settings.scalePowerMode === 'disconnect' ? 'selected' : ''}>Disconnect</option>
                        </select>
                    </div>
                    <p class="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic relative text-[#2d2d2d] text-[32px] w-full max-w-full break-words">
                        Controls automatic scale power management when machine sleeps. Display Off: turn off scale display. Disconnect: disconnect scale completely.
                    </p>
                </div>
            </div>
        </div>
    `;
}

// Render Flush settings form
export function renderFlushSettingsForm(settings) {
    if (!settings) {
        return `
            <div class="content-stretch flex flex-col gap-[60px] items-start relative w-full">
                <div class="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] min-w-full not-italic relative text-[#121212] text-[48px] text-center w-[min-content]">
                    <p class="leading-[1.2]">Flush Settings</p>
                </div>
                <div class="text-red-500 p-4 text-[32px]">Failed to load flush settings</div>
            </div>
        `;
    }

    return `
        <div class="content-stretch flex flex-col gap-[60px] items-start relative w-full">
            <div class="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] min-w-full not-italic relative text-[#121212] text-[48px] text-center w-[min-content]">
                <p class="leading-[1.2]">Flush Settings</p>
            </div>

            <!-- Divider -->
            <div class="h-0 relative w-full">
                <hr class="border-t border-[#c9c9c9] w-full" />
            </div>

            <div class="content-stretch flex flex-col items-center relative w-full">
                <div class="border border-[#c9c9c9] border-solid content-stretch flex flex-col gap-[30px] items-center px-[60px] py-[30px] relative shrink-0 w-[590px]">
                    <div class="content-stretch flex items-center relative shrink-0">
                        <p class="font-['Inter:Regular',sans-serif] font-normal leading-[1.2] not-italic relative shrink-0 text-[#121212] text-[34px]">
                            Flush Temperature
                        </p>
                    </div>
                    <div class="content-stretch flex gap-[20px] h-[96px] items-center justify-center relative shrink-0 w-full">
                        <button id="flush-temp-minus" class="w-[96px] h-[96px] bg-[#ededed] rounded-[20px] flex items-center justify-center"
                                onclick="window.flashPlusMinusButton(this); window.adjustFlushTemp(-5);">
                            <svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M10.416 25H39.5827" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                        <div class="text-center text-[var(--text-primary)] text-[32px] font-bold bg-transparent border-none flex items-center justify-center"
                             style="width: 140px;">
                            <input type="text" inputmode="numeric" pattern="[0-9]*" id="flushTempInput" class="text-center text-[var(--text-primary)] text-[32px] font-bold bg-transparent border-none w-full"
                                   value="${settings.flushTemp !== undefined ? settings.flushTemp : ''}"
                                   step="5" min="5" max="95"
                                   onchange="window.updateDe1Setting('flushTemp', parseFloat(this.value))">
                            <span class="ml-2">°C</span>
                        </div>
                        <button id="flush-temp-plus" class="w-[96px] h-[96px] bg-[#ededed] rounded-[20px] flex items-center justify-center"
                                onclick="window.flashPlusMinusButton(this); window.adjustFlushTemp(5);">
                            <svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M24.9993 10.4165V39.5832M10.416 24.9998H39.5827" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                    </div>
                    <p class="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic relative text-[#2d2d2d] text-[32px] w-full text-center">
                        Temperature for flush cycles
                    </p>
                </div>

                <div class="border border-[#c9c9c9] border-solid content-stretch flex flex-col gap-[30px] items-center px-[60px] py-[30px] relative shrink-0 w-[590px] mt-[30px]">
                    <div class="content-stretch flex items-center relative shrink-0">
                        <p class="font-['Inter:Regular',sans-serif] font-normal leading-[1.2] not-italic relative shrink-0 text-[#121212] text-[34px]">
                            Flush Flow
                        </p>
                    </div>
                    <div class="content-stretch flex gap-[20px] h-[96px] items-center justify-center relative shrink-0 w-full">
                        <button id="flush-flow-minus" class="w-[96px] h-[96px] bg-[#ededed] rounded-[20px] flex items-center justify-center"
                                onclick="window.flashPlusMinusButton(this); window.adjustFlushFlow(-1);">
                            <svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M10.416 25H39.5827" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                        <div class="text-center text-[var(--text-primary)] text-[32px] font-bold bg-transparent border-none flex items-center justify-center"
                             style="width: 140px;">
                            <input type="text" inputmode="numeric" pattern="[0-9]*" id="flushFlowInput" class="text-center text-[var(--text-primary)] text-[32px] font-bold bg-transparent border-none w-full"
                                   value="${settings.flushFlow !== undefined ? settings.flushFlow : ''}"
                                   step="1" min="1" max="8"
                                   onchange="window.updateDe1Setting('flushFlow', parseFloat(this.value))">
                            <span class="ml-2 text-nowrap">ml/s</span>
                        </div>
                        <button id="flush-flow-plus" class="w-[96px] h-[96px] bg-[#ededed] rounded-[20px] flex items-center justify-center"
                                onclick="window.flashPlusMinusButton(this); window.adjustFlushFlow(1);">
                            <svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M24.9993 10.4165V39.5832M10.416 24.9998H39.5827" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                    </div>
                    <p class="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic relative text-[#2d2d2d] text-[32px] w-full text-center">
                        Flow rate for flush cycles
                    </p>
                </div>
            </div>
        </div>
    `;
}

// Render DE1 settings form
export function renderDe1SettingsForm(settings) {
    if (!settings) {
        return `
            <div class="content-stretch flex flex-col gap-[60px] items-start relative w-full">
                <div class="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] min-w-full not-italic relative text-[#121212] text-[48px] text-center w-[min-content]">
                    <p class="leading-[1.2]">Machine Settings</p>
                </div>
                <div class="text-red-500 p-4 text-[32px]">Failed to load DE1 settings</div>
            </div>
        `;
    }

    return `
        <div class="content-stretch flex flex-col gap-[60px] items-start relative w-full">
            <div class="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] min-w-full not-italic relative text-[#121212] text-[48px] text-center w-[min-content]">
                <p class="leading-[1.2]">Machine Settings</p>
            </div>

            <!-- Divider -->
            <div class="h-0 relative w-full">
                <hr class="border-t border-[#c9c9c9] w-full" />
            </div>

            <div class="content-stretch flex flex-col items-start relative w-full">
                <div class="content-stretch flex flex-col gap-[40px] items-start relative w-full">
                    <div class="content-stretch flex items-center justify-between relative w-full">
                        <div class="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative text-[#385a92] text-[40px]">
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
                    <p class="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic relative text-[#2d2d2d] text-[32px] w-full">
                        Temperature threshold at which the fan turns on
                    </p>
                </div>
            </div>

            <!-- Divider -->
            <div class="h-0 relative w-full">
                <hr class="border-t border-[#c9c9c9] w-full" />
            </div>

            <div class="content-stretch flex flex-col items-start relative w-full">
                <div class="content-stretch flex flex-col gap-[40px] items-start relative w-full">
                    <div class="content-stretch flex items-center justify-between relative w-full">
                        <div class="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative text-[#385a92] text-[40px]">
                            <p class="leading-[1.2]">USB Charger Mode</p>
                        </div>
                        <select id="usbChargerModeSelect" class="bg-[#385a92] border-2 border-[#385a92] border-solid h-[62.88px] rounded-[2617.374px] w-[200px] text-white text-[24px] p-2"
                                onchange="window.updateDe1Setting('usb', this.value)">
                            <option value="enable" ${settings.usb ? 'selected' : ''}>Enabled</option>
                            <option value="disable" ${!settings.usb ? 'selected' : ''}>Disabled</option>
                        </select>
                    </div>
                    <p class="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic relative text-[#2d2d2d] text-[32px] w-full">
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
                <div class="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] min-w-full not-italic relative text-[#121212] text-[48px] text-center w-[min-content]">
                    <p class="leading-[1.2]">Machine Advanced Settings</p>
                </div>
                <div class="text-red-500 p-4 text-[32px]">Failed to load DE1 advanced settings</div>
            </div>
        `;
    }

    return `
        <div class="content-stretch flex flex-col gap-[60px] items-start relative w-full">
            <div class="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] min-w-full not-italic relative text-[#121212] text-[48px] text-center w-[min-content]">
                <p class="leading-[1.2]">Machine Advanced Settings</p>
            </div>

            <!-- Divider -->
            <div class="h-0 relative w-full">
                <hr class="border-t border-[#c9c9c9] w-full" />
            </div>

            <div class="content-stretch flex flex-col items-start relative w-full">
                <div class="content-stretch flex flex-col gap-[40px] items-start relative w-full">
                    <div class="content-stretch flex items-center justify-between relative w-full">
                        <div class="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative text-[#385a92] text-[40px]">
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
                    <p class="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic relative text-[#2d2d2d] text-[32px] w-full">
                        Flow rate during heater phase 1
                    </p>
                </div>
            </div>

            <!-- Divider -->
            <div class="h-0 relative w-full">
                <hr class="border-t border-[#c9c9c9] w-full" />
            </div>

            <div class="content-stretch flex flex-col items-start relative w-full">
                <div class="content-stretch flex flex-col gap-[40px] items-start relative w-full">
                    <div class="content-stretch flex items-center justify-between relative w-full">
                        <div class="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative text-[#385a92] text-[40px]">
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
                    <p class="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic relative text-[#2d2d2d] text-[32px] w-full">
                        Flow rate during heater phase 2
                    </p>
                </div>
            </div>
        </div>
    `;
}

// Render calibration settings
export function renderCalibrationSettings() {
    return `
        <div class="content-stretch flex flex-col gap-[60px] items-start relative w-full">
            <div class="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] min-w-full not-italic relative text-[#121212] text-[48px] text-center w-[min-content]">
                <p class="leading-[1.2]">Calibration Settings</p>
            </div>

            <div class="content-stretch flex flex-col items-start relative w-full">
                <div class="content-stretch flex flex-col gap-[40px] items-start relative w-full">
                    <div class="content-stretch flex items-center justify-between relative w-full">
                        <div class="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative text-[#385a92] text-[40px]">
                            <p class="leading-[1.2]">Scale Calibration</p>
                        </div>
                        <button class="bg-[#385a92] h-[62.88px] rounded-[10px] w-[200px] text-white text-[24px] font-bold">
                            Calibrate
                        </button>
                    </div>
                    <p class="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic relative text-[#2d2d2d] text-[32px] w-full">
                        Calibrate the connected scale using a known weight
                    </p>
                </div>
            </div>

            <!-- Divider -->
            <div class="h-0 relative w-full">
                <hr class="border-t border-[#c9c9c9] w-full" />
            </div>

            <div class="content-stretch flex flex-col items-start relative w-full">
                <div class="content-stretch flex flex-col gap-[40px] items-start relative w-full">
                    <div class="content-stretch flex items-center justify-between relative w-full">
                        <div class="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative text-[#385a92] text-[40px]">
                            <p class="leading-[1.2]">Temperature Calibration</p>
                        </div>
                        <button class="bg-[#385a92] h-[62.88px] rounded-[10px] w-[200px] text-white text-[24px] font-bold">
                            Calibrate
                        </button>
                    </div>
                    <p class="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic relative text-[#2d2d2d] text-[32px] w-full">
                        Calibrate temperature sensors using a reference thermometer
                    </p>
                </div>
            </div>
        </div>
    `;
}

// Render maintenance settings
export function renderMaintenanceSettings() {
    return `
        <div class="content-stretch flex flex-col gap-[60px] items-start relative w-full">
            <div class="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] min-w-full not-italic relative text-[#121212] text-[48px] text-center w-[min-content]">
                <p class="leading-[1.2]">Maintenance Settings</p>
            </div>

            <div class="content-stretch flex flex-col items-start relative w-full">
                <div class="content-stretch flex flex-col gap-[40px] items-start relative w-full">
                    <div class="content-stretch flex items-center justify-between relative w-full">
                        <div class="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative text-[#385a92] text-[40px]">
                            <p class="leading-[1.2]">Descaling Cycle</p>
                        </div>
                        <button class="bg-[#385a92] h-[62.88px] rounded-[10px] w-[200px] text-white text-[24px] font-bold">
                            Start
                        </button>
                    </div>
                    <p class="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic relative text-[#2d2d2d] text-[32px] w-full">
                        Run a descaling cycle to remove mineral buildup
                    </p>
                </div>
            </div>

            <!-- Divider -->
            <div class="h-0 relative w-full">
                <hr class="border-t border-[#c9c9c9] w-full" />
            </div>

            <div class="content-stretch flex flex-col items-start relative w-full">
                <div class="content-stretch flex flex-col gap-[40px] items-start relative w-full">
                    <div class="content-stretch flex items-center justify-between relative w-full">
                        <div class="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative text-[#385a92] text-[40px]">
                            <p class="leading-[1.2]">Cleaning Cycle</p>
                        </div>
                        <button class="bg-[#385a92] h-[62.88px] rounded-[10px] w-[200px] text-white text-[24px] font-bold">
                            Start
                        </button>
                    </div>
                    <p class="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic relative text-[#2d2d2d] text-[32px] w-full">
                        Run a cleaning cycle to remove coffee oils and residue
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
            <div class="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] min-w-full not-italic relative text-[#121212] text-[48px] text-center w-[min-content]">
                <p class="leading-[1.2]">User Manual</p>
            </div>

            <div class="content-stretch flex flex-col items-start relative w-full">
                <div class="content-stretch flex flex-col gap-[40px] items-start relative w-full">
                    <div class="content-stretch flex items-center justify-between relative w-full">
                        <div class="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative text-[#385a92] text-[40px]">
                            <p class="leading-[1.2]">Online Help</p>
                        </div>
                        <a href="https://decentespresso.com/support/submit" target="_blank" class="bg-[#385a92] h-[62.88px] rounded-[10px] w-[200px] text-white text-[24px] font-bold flex items-center justify-center">
                            Visit
                        </a>
                    </div>
                    <p class="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic relative text-[#2d2d2d] text-[32px] w-full">
                        Get support and submit tickets for assistance
                    </p>
                </div>
            </div>

            <!-- Divider -->
            <div class="h-0 relative w-full">
                <hr class="border-t border-[#c9c9c9] w-full" />
            </div>

            <div class="content-stretch flex flex-col items-start relative w-full">
                <div class="content-stretch flex flex-col gap-[40px] items-start relative w-full">
                    <div class="content-stretch flex items-center justify-between relative w-full">
                        <div class="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative text-[#385a92] text-[40px]">
                            <p class="leading-[1.2]">Tutorials</p>
                        </div>
                        <a href="https://decentespresso.com/doc/quickstart/" target="_blank" class="bg-[#385a92] h-[62.88px] rounded-[10px] w-[200px] text-white text-[24px] font-bold flex items-center justify-center">
                            View
                        </a>
                    </div>
                    <p class="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic relative text-[#2d2d2d] text-[32px] w-full">
                        Learn how to get started with your espresso machine
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
            <div class="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] min-w-full not-italic relative text-[#121212] text-[48px] text-center w-[min-content]">
                <p class="leading-[1.2]">General Settings</p>
            </div>

            <div class="text-[32px] text-[#2d2d2d] p-4">
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


// Initialize the settings page
export async function initializeSettings() {
    // Set up event listeners
    document.getElementById('cancel-settings-btn').addEventListener('click', () => {
        // Navigate back to main page using router
        loadPage('/index.html');
    });

    document.getElementById('save-settings-btn').addEventListener('click', async () => {
        ui.showToast('Saving all settings...', 3000, 'info');
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
                        const contentArea = document.getElementById('settings-content-area');
                        if (contentArea) {
                            contentArea.innerHTML = renderSettingsContent(settingsCategory);
                        }
                    });
                });
            }

            // Clear content area when a main category is clicked
            const contentArea = document.getElementById('settings-content-area');
            if (contentArea) {
                contentArea.innerHTML = `<div class="flex flex-col items-center justify-center h-full text-center p-8">
                    <p class="text-[var(--text-primary)] text-[28px]">Select a sub-category from the menu</p>
                </div>`;
            }
        });
    });

    // Initialize with REA settings & load first category
    await loadSettings();
    document.querySelector('.settings-nav-btn')?.click();

    // Apply translations to the settings page
    setLanguage(getCurrentLanguage());

    // Expose update functions to global scope for inline event handlers
    window.updateReaSetting = updateReaSetting;
    window.updateDe1Setting = updateDe1Setting;
    window.updateDe1AdvancedSetting = updateDe1AdvancedSetting;
    window.flashPlusMinusButton = ui.flashPlusMinusButton;

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

    ui.initResizablePanels('separator');
}