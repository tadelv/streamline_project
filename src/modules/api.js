import * as ui from './ui.js';
import { logger ,setDebug} from './logger.js';

export let reaHostname = localStorage.getItem('reaHostname') || window.location.hostname;
export const REA_PORT = 8080;
export let API_BASE_URL = `http://${reaHostname}:${REA_PORT}/api/v1`;
export const WS_PROTOCOL = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

export const MachineState = {
    BOOTING: 'booting',
    BUSY: 'busy',
    IDLE: 'idle',
    SLEEPING: 'sleeping',
    HEATING: 'heating',
    PREHEATING: 'preheating',
    ESPRESSO: 'espresso',
    HOT_WATER: 'hotWater',
    FLUSH: 'flush',
    STEAM: 'steam',
    STEAM_RINSE: 'steamRinse',
    SKIP_STEP: 'skipStep',
    CLEANING: 'cleaning',
    DESCALING: 'descaling',
    CALIBRATION: 'calibration',
    SELF_TEST: 'selfTest',
    AIR_PURGE: 'airPurge',
    NEEDS_WATER: 'needsWater',
    ERROR: 'error',
    FW_UPGRADE: 'fwUpgrade',
    READY: 'ready', // Note: Not in the official API doc, but used in app.js for shot completion logic
};

export let reconnectingWebSocket = null; // Exporting for app.js access
let scaleWebSocket = null;

// Local cache for current shot settings, initialized with default values and correct types
let currentShotSettings = {
    steamSetting: 0, // integer
    targetSteamTemp: 0, // integer
    targetSteamDuration: 0, // integer
    targetHotWaterTemp: 0, // integer
    targetHotWaterVolume: 0, // integer
    targetHotWaterDuration: 0, // integer
    targetShotVolume: 0, // integer
    groupTemp: 0.0, // number (float/double)
};

// Caching for DE1 settings to avoid multiple API calls
const de1SettingsCache = {
    data: null,
    timestamp: null,
    TTL: 60000 // 60 seconds TTL
};

// Caching for DE1 advanced settings to improve performance when navigating to settings page
const de1AdvancedSettingsCache = {
    data: null,
    timestamp: null,
    TTL: 40000 // 40 seconds TTL
};
const reatsettingscache = { 
    data: null,
    timestamp: null,
    TTL: 40000 // 40 seconds TTL
};


export function updateShotSettingsCache(newSettings) {
    if (newSettings) {
        currentShotSettings = { ...currentShotSettings, ...newSettings };
        logger.debug('Shot settings cache updated:', currentShotSettings);
    }
}

export async function getDevices() {
    const response = await fetch(`${API_BASE_URL}/devices`);
    if (!response.ok) {
        throw new Error('Failed to get devices');
    }
    return response.json();
}

export async function scanForDevices() {
    const response = await fetch(`${API_BASE_URL}/devices/scan`);
    if (!response.ok) {
        throw new Error('Failed to scan for devices');
    }
    return response.json();
}

export async function reconnectDevice(deviceId) {
    try {
        logger.info(`Attempting to reconnect to device: ${deviceId}`);
        if (!deviceId||deviceId==null) {
            logger.warn('No device ID provided for reconnection attempt.');
            return;
            
        }
        const response = await fetch(`${API_BASE_URL}/devices/connect?deviceId=${deviceId}`, {
            method: 'PUT',
        });
        if (!response.ok) {
            throw new Error(`Failed to send reconnect request for device ${deviceId}`);
        }
        logger.info(`Successfully sent reconnect request for device: ${deviceId}`);
    } catch (error) {
        logger.error(`Error during device reconnection attempt for ${deviceId}:`, error);
    }
}





export async function connectScaleDevice() {
    try {
        logger.info('Attempting to connect to scale...');
        const response = await fetch(`${API_BASE_URL}/devices/scan?connect=true`, {
            method: 'GET',
        });
        if (!response.ok) {
            logger.error(`Failed to send connect request for scale: ${response.statusText}`);
            return response.json();
            
        }
        logger.info('Successfully sent connect request for scale.');
         return response.json();
    } catch (error) {
        logger.error('Error during scale connection attempt:', error);
        return response.json();
    }
}


export async function disconnectBLEDevice(deviceid) {
    try {
        logger.info('Attempting to disconnect from BLE device...');
        const response = await fetch(`${API_BASE_URL}/devices/disconnect?deviceId=${deviceid}`, {
            method: 'PUT',
        });
        if (!response.ok) {
            throw new Error(`Failed to send disconnect request for BLE device: ${response.statusText}`);
        }
        logger.info('Successfully sent disconnect request for BLE device.');
    } catch (error) {
        logger.error('Error during BLE device disconnection attempt:', error);
        throw error;
    }

}


export async function tareScale() {
    try {
        logger.info('Taring scale...');
        const response = await fetch(`${API_BASE_URL}/scale/tare`, {
            method: 'PUT',
        });
        if (!response.ok) {
            throw new Error(`Failed to tare scale: ${response.statusText}`);
        }
        logger.info('Successfully tared scale.');
    } catch (error) {
        logger.error('Error taring scale:', error);
        throw error;
    }
}

export function connectWebSocket(onData, onReconnect) {
    reconnectingWebSocket = new ReconnectingWebSocket(`${WS_PROTOCOL}//${reaHostname}:${REA_PORT}/ws/v1/machine/snapshot`, [], {
        debug: true,
        reconnectInterval: 3000,
    }); // Enable debug logging

    reconnectingWebSocket.onopen = () => {
        logger.info('WebSocket (re)connected.');
        ui.updateMachineStatus({ status: "Connecting..." }); // Show a temporary status
        if (onReconnect) {
            onReconnect(); // Trigger the logic in app.js
        }
        logger.debug('DE1 WebSocket re-opened. Status set to Connected.'); // Added debug log
    };

    reconnectingWebSocket.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            // Update local shot settings cache if snapshot includes snapshot settings
            onData(data);
            // setDebug(true);
            // logger.debug(data)
        } catch (error) {
            logger.error('Error parsing WebSocket message:', error);
        }
    };

    reconnectingWebSocket.onclose = () => {
        logger.info('WebSocket disconnected. Attempting to reconnect...');
        ui.updateMachineStatus({ status: "Disconnected" });
        setTimeout(() => {
            logger.info('reloading now');
            // location.reload();

        }, 6000);
    };

    reconnectingWebSocket.onerror = (error) => {
        logger.error('WebSocket error:', error);
        ui.updateMachineStatus({ status: "Disconnected" }); // Ensure this is present
    };

    reconnectingWebSocket.onreconnect = null;
}

export function connectScaleWebSocket(onData, onReconnect, onDisconnect) {
    if (scaleWebSocket) {
        logger.info('Closing existing scale WebSocket before creating a new one.');
        scaleWebSocket.close();
    }

    let scaleDataTimeout;
    const SCALE_TIMEOUT_DURATION = 5000; // 5 seconds

    const handleScaleTimeout = () => {
        logger.warn(`No scale data received for ${SCALE_TIMEOUT_DURATION / 1000} seconds. Assuming disconnection.`);
        if (onDisconnect) {
            onDisconnect();
        }
    };

    scaleWebSocket = new ReconnectingWebSocket(`${WS_PROTOCOL}//${reaHostname}:${REA_PORT}/ws/v1/scale/snapshot`, [], {
        debug: true,
        reconnectInterval: 3000,
    });

    scaleWebSocket.onopen = () => {
        logger.info('Scale WebSocket (re)connected.');
        clearTimeout(scaleDataTimeout);
        scaleDataTimeout = setTimeout(handleScaleTimeout, SCALE_TIMEOUT_DURATION);
        if (onReconnect) {
            onReconnect();
        }
    };

    scaleWebSocket.onmessage = (event) => {
        clearTimeout(scaleDataTimeout);
        scaleDataTimeout = setTimeout(handleScaleTimeout, SCALE_TIMEOUT_DURATION);

        try {
            const data = JSON.parse(event.data);
            onData(data);
            //logger.debug(data);
        } catch (error) {
            logger.error('Error parsing scale WebSocket message:', error);
        }
    };

    scaleWebSocket.onclose = () => {
        logger.info('Scale WebSocket disconnected.');
        clearTimeout(scaleDataTimeout);
        if (onDisconnect) {
            onDisconnect();
        }
    };

    scaleWebSocket.onerror = (error) => {
        logger.error('Scale WebSocket error:', error);
        clearTimeout(scaleDataTimeout);
    };

    scaleWebSocket.onreconnect = null;
}

export function connectShotSettingsWebSocket(onData) {
    const shotSettingsWebSocket = new ReconnectingWebSocket(`${WS_PROTOCOL}//${reaHostname}:${REA_PORT}/ws/v1/machine/shotSettings`, [], {
        debug: true,
        reconnectInterval: 3000,
    });

    shotSettingsWebSocket.onopen = () => {
        logger.info('Shot Settings WebSocket connected');
    };

    shotSettingsWebSocket.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            onData(data);
            logger.info('shotsettings data',data);
        } catch (error) {
            logger.error('Error parsing Shot Settings WebSocket message:', error);
        }
    };

    shotSettingsWebSocket.onclose = () => {
        logger.info('Shot Settings WebSocket disconnected. Attempting to reconnect...');
    };

    shotSettingsWebSocket.onerror = (error) => {
        logger.error('Shot Settings WebSocket error:', error);
    };
}

export function connectTimeToReadyWebSocket(onData) {
    const timeToReadyWebSocket = new ReconnectingWebSocket(`${WS_PROTOCOL}//${reaHostname}:${REA_PORT}/ws/v1/plugins/time-to-ready.reaplugin/timeToReady`, [], {
        debug: true,
        reconnectInterval: 3000,
    });

    timeToReadyWebSocket.onopen = () => {
        logger.info('Time-to-ready WebSocket connected');
    };

    timeToReadyWebSocket.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            onData(data);
        } catch (error) {
            logger.error('Error parsing time-to-ready WebSocket message:', error);
        }
    };

    timeToReadyWebSocket.onclose = () => {
        logger.info('Time-to-ready WebSocket disconnected. Attempting to reconnect...');
    };

    timeToReadyWebSocket.onerror = (error) => {
        logger.error('Time-to-ready WebSocket error:', error);
    };
}

export async function getProfiles() {
    const response = await fetch(`${API_BASE_URL}/profiles?includeHidden=true`);
    if (!response.ok) {
        throw new Error('Failed to get profiles');
    }
    return response.json();
}

export async function uploadProfile(profileData) {
    const response = await fetch(`${API_BASE_URL}/profiles`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ profile: profileData }), // Wrap the profile data as required by the API
    });
    if (!response.ok) {
        const errorBody = await response.text();
        ui.showToast(`Error uploading profile: ${errorBody}`, 5000, 'error');
        throw new Error(`Failed to upload profile. Status: ${response.status}, Body: ${errorBody}`);
    }
    return response.json();
}

export async function deleteProfile(profileId) {
    const response = await fetch(`${API_BASE_URL}/profiles/${profileId}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        throw new Error(`Failed to delete profile ${profileId}`);
    }
}

export async function updateProfileVisibility(profileId, visibility) {
    const response = await fetch(`${API_BASE_URL}/profiles/${profileId}/visibility`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ visibility: visibility }),
    });
    if (!response.ok) {
        throw new Error(`Failed to update visibility for profile ${profileId}`);
    }
    return response.json();
}

export async function getProfile() {
    const response = await fetch(`${API_BASE_URL}/workflow`, { targetAddressSpace: 'local' });
    if (!response.ok) {
        throw new Error('Failed to get profile');
    }
    const data = await response.json();
    return data.profile || null;
}

function isValidProfile(profile) {
    const requiredKeys = [
        'title',
        'author',
        'notes',
        'beverage_type',
        'steps',
        'version',
        'target_volume',
        'target_weight',
        'target_volume_count_start',
        'tank_temperature'
    ];

    if (!profile || typeof profile !== 'object' || Array.isArray(profile)) {
        const errorMessage = 'Profile validation failed: Profile is not a valid object.';
        logger.error(errorMessage);
        alert(errorMessage); // Pop-up message
        return false;
    }

    for (const key of requiredKeys) {
        if (!Object.prototype.hasOwnProperty.call(profile, key)) {
            const errorMessage = `Profile validation failed: Profile is missing required key: '${key}'.`;
            logger.error(errorMessage);
            alert(errorMessage); // Pop-up message
            return false;
        }
    }

    if (!Array.isArray(profile.steps)) {
        const errorMessage = `Profile validation failed: 'steps' property is not an array.`;
        logger.error(errorMessage);
        alert(errorMessage); // Pop-up message
        return false;
    }

    logger.info('Profile validation successful.');
    return true;
}

export async function sendProfile(profileJson) {
    if (!isValidProfile(profileJson)) {
        throw new Error('Profile validation failed. Not sending to REA.');
    }
    return updateWorkflow({ profile: profileJson });
}

export async function getWorkflow() {
    const response = await fetch(`${API_BASE_URL}/workflow`);
    if (!response.ok) {
        logger.info('Failed to get workflow');
        throw new Error('Failed to get workflow');
    }
    logger.info('workflow returned');
    return response.json();

}

export async function updateWorkflow(data) {
    // Deep copy to avoid side effects on the original object.
    const dataToSend = JSON.parse(JSON.stringify(data));

    // Helper to find and convert grinder setting to an integer.
    const convertGrinderSettingToFloat = (obj) => {
        if (obj && obj.grinderData && typeof obj.grinderData.setting !== 'undefined') {
            const floatValue = parseFloat(obj.grinderData.setting);
            if (!isNaN(floatValue)) {
                obj.grinderData.setting = String(floatValue);
            }
        }
    };

    // Check for grinderData at the top level and within a profile object.
    convertGrinderSettingToFloat(dataToSend);
    if (dataToSend.profile) {
        convertGrinderSettingToFloat(dataToSend.profile);
    }

    const response = await fetch(`${API_BASE_URL}/workflow`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
    });
    if (!response.ok) {
        throw new Error('Failed to update workflow');
    }
    return response.json();
}

export async function setMachineState(newState) {
    const response = await fetch(`${API_BASE_URL}/machine/state/${newState}`, {
        method: 'PUT',
    });
    if (!response.ok) {
        throw new Error(`Failed to set machine state to ${newState}`);
    }
    return response;
}

async function sendShotSettings() {
    const payload = {
        steamSetting: Math.round(currentShotSettings.steamSetting),
        targetSteamTemp: Math.round(currentShotSettings.targetSteamTemp),
        targetSteamDuration: Math.round(currentShotSettings.targetSteamDuration),
        targetHotWaterTemp: Math.round(currentShotSettings.targetHotWaterTemp),
        targetHotWaterVolume: Math.round(currentShotSettings.targetHotWaterVolume),
        targetHotWaterDuration: Math.round(currentShotSettings.targetHotWaterDuration),
        targetShotVolume: Math.round(currentShotSettings.targetShotVolume),
        groupTemp: parseFloat(currentShotSettings.groupTemp.toFixed(1)),
    };

    const response = await fetch(`${API_BASE_URL}/machine/shotSettings`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        // The body might contain a useful error message
        const errorBody = await response.text();
        throw new Error(`Failed to set shot settings. Status: ${response.status}, Body: ${errorBody}`);
    }
    return;
}

export async function setTargetHotWaterVolume(volume) {
    currentShotSettings.targetHotWaterVolume = parseFloat(volume);
    return sendShotSettings();
}

export async function setTargetHotWaterTemp(temp) {
    currentShotSettings.targetHotWaterTemp = parseFloat(temp);
    return sendShotSettings();
}

export async function setTargetHotWaterDuration(duration) {
    currentShotSettings.targetHotWaterDuration = parseFloat(duration);
    return sendShotSettings();
}

export async function setTargetSteamTemp(temp) {
    currentShotSettings.targetSteamTemp = parseFloat(temp);
    return sendShotSettings();
}

export async function setTargetSteamDuration(duration) {
    currentShotSettings.targetSteamDuration = parseFloat(duration);
    return sendShotSettings();
}


export async function setTargetSteamFlow(flow) {
    const settings = { steamFlow: parseFloat(flow) };
    return setDe1Settings(settings);
}

export async function getReaSettings() {
    if (reatsettingscache.data && reatsettingscache.timestamp) {
        const now = Date.now();
        if (now - reatsettingscache.timestamp < reatsettingscache.TTL) {
            // Return cached data if it's still fresh
            return reatsettingscache.data;
        }
    }
    try {
        const response = await fetch(`${API_BASE_URL}/settings`);
        if (!response.ok) {
            throw new Error(`Failed to get Rea settings: ${response.statusText}`);
        }
        const data = await response.json();
        // Update the cache with new data
        reatsettingscache.data = data;
        reatsettingscache.timestamp = Date.now();
        return data;
    } catch (error) {
        logger.error("Error in getReaSettings:", error);
        return null; // Return null or a default settings object
    }
}


export async function getDe1Settings() {
    // Check if we have cached data that is still fresh
    if (de1SettingsCache.data && de1SettingsCache.timestamp) {
        const now = Date.now();
        if (now - de1SettingsCache.timestamp < de1SettingsCache.TTL) {
            // Return cached data if it's still fresh
            return de1SettingsCache.data;
        }
    }

    try {
        const response = await fetch(`${API_BASE_URL}/machine/settings`);
        if (!response.ok) {
            // Throw an error that includes the status code for better error handling
            const errorText = await response.text(); // Get response body for more details
            const error = new Error(`Failed to get DE1 settings: ${response.statusText}`);
            error.status = response.status; // Add status code to error object
            error.statusText = response.statusText;
            error.responseBody = errorText;
            throw error;
        }
        const data = await response.json();

        // Update the cache with new data
        de1SettingsCache.data = data;
        de1SettingsCache.timestamp = Date.now();

        return data;
    } catch (error) {
        logger.error("Error in getDe1Settings:", error);
        
        // Check if this is a 500 error and re-throw with status info
        if (error.status === 500) {
            ui.showToast('Unable to load settings, check connection status of De1, returned to home page.', 5000, 'error');
            throw error; // Re-throw so calling code can handle 500 specifically
        }
        
        // Return cached data if available, even if expired, to avoid breaking functionality
        if (de1SettingsCache.data) {
            return de1SettingsCache.data;
        }
        return null;
    }
}

export async function setDe1Settings(settings) {
    try {
        const response = await fetch(`${API_BASE_URL}/machine/settings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(settings),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Failed to set DE1 settings. Status: ${response.status}, Body: ${errorBody}`);
        }
        logger.info('DE1 settings updated successfully:', settings);
    } catch (error) {
        logger.error('Error setting DE1 settings:', error);
        throw error; // Re-throw to allow calling code to handle
    }
}

export async function getDe1AdvancedSettings() {
    // Check if we have cached data that is still fresh
    if (de1AdvancedSettingsCache.data && de1AdvancedSettingsCache.timestamp) {
        const now = Date.now();
        if (now - de1AdvancedSettingsCache.timestamp < de1AdvancedSettingsCache.TTL) {
            // Return cached data if it's still fresh
            return de1AdvancedSettingsCache.data;
        }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6-second timeout

    const url = `${API_BASE_URL}/machine/settings/advanced`;
    logger.info(`Fetching advanced settings from: ${url}`); // Log the URL

    try {
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId); // Clear the timeout if the fetch completes in time

        if (!response.ok) {
            // Throw an error that includes the status code for better error handling
            const errorText = await response.text(); // Get response body for more details
            const error = new Error(`Failed to get DE1 advanced settings: ${response.statusText}`);
            error.status = response.status; // Add status code to error object
            error.statusText = response.statusText;
            error.responseBody = errorText;
            throw error;
        }
        const data = await response.json();

        // Update the cache with new data
        de1AdvancedSettingsCache.data = data;
        de1AdvancedSettingsCache.timestamp = Date.now();

        return data;
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            logger.error(`Error in getDe1AdvancedSettings: Request timed out after 5 seconds.`);
            window.location.reload(); // Reload the page on timeout to attempt recovery
        } else {
            logger.error("Error in getDe1AdvancedSettings:", error);
            
            // Check if this is a 500 error and re-throw with status info
            if (error.status === 500) {
                throw error; // Re-throw so calling code can handle 500 specifically
            }
        }
        
        // Return cached data if available, even if expired, to avoid breaking functionality
        if (de1AdvancedSettingsCache.data) {
            return de1AdvancedSettingsCache.data;
        }
        return null;
    }
}

export async function setDe1AdvancedSettings(settings) {
    try {
        const response = await fetch(`${API_BASE_URL}/machine/settings/advanced`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(settings),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Failed to set DE1 advanced settings. Status: ${response.status}, Body: ${errorBody}`);
        }
        logger.info('DE1 advanced settings updated successfully:', settings);
    } catch (error) {
        logger.error('Error setting DE1 advanced settings:', error);
        throw error; // Re-throw to allow calling code to handle
    }
}

export async function setReaSettings(settings) {
    try {
        const response = await fetch(`${API_BASE_URL}/settings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(settings),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Failed to set REA settings. Status: ${response.status}, Body: ${errorBody}`);
        }
        logger.info('REA settings updated successfully:', settings);
    } catch (error) {
        logger.error('Error setting REA settings:', error);
        throw error; // Re-throw to allow calling code to handle
    }
}

export async function ensureGatewayModeTracking() {
    const settings = await getReaSettings();
    if (settings && settings.gatewayMode !== 'tracking') {
        logger.info("Gateway mode is not 'tracking', attempting to set it.");
        try {
            const response = await fetch(`${API_BASE_URL}/settings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ gatewayMode: 'tracking' }),
            });
            if (!response.ok) {
                throw new Error(`Failed to set gateway mode: ${response.statusText}`);
            }
            logger.info("Successfully set gateway mode to 'tracking'.");
        } catch (error) {
            logger.error("Error in ensureGatewayModeTracking POST:", error);
        }
    }
}

export async function getValueFromStore(namespace, key) {
    try {
        const response = await fetch(`${API_BASE_URL}/store/${namespace}/${key}`);
        if (response.status === 404) {
            return null; // Key not found, which is a valid case
        }
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }
        logger.info('getValueFromStore ok');
        return response.json();
    } catch (error) {
        logger.error(`Failed to get value for key '${key}':`, error);
        throw error;
    }
}

export async function setValueInStore(namespace, key, value) {
    try {
        const response = await fetch(`${API_BASE_URL}/store/${namespace}/${key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(value),
        });
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }
        logger.info('setValueInStore ok');
        return true;
    } catch (error) {
        logger.error(`Failed to set value for key '${key}':`, error);
        throw error;
    }
}

export async function getShotIds() {
    const response = await fetch(`${API_BASE_URL}/shots/ids`);
    if (!response.ok) {
        throw new Error('Failed to get shot ids');
    }
    return response.json();
}

export async function getShots(ids) {
    const response = await fetch(`${API_BASE_URL}/shots?ids=${ids}`);
    if (!response.ok) {
        throw new Error('Failed to get shot');
    }
    return response.json();
}

export async function getPlugins() {
    try {
        const response = await fetch(`${API_BASE_URL}/plugins`);
        if (!response.ok) {
            throw new Error(`Failed to get plugins: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        logger.error("Error in getPlugins:", error);
        return null;
    }
}

export async function getPluginSettings(pluginId) {
    try {
        const response = await fetch(`${API_BASE_URL}/plugins/${pluginId}/settings`);
        if (!response.ok) {
            // If settings are not found (e.g., first time), return empty object rather than error
            if (response.status === 404) {
                return {};
            }
            throw new Error(`Failed to get plugin settings for ${pluginId}: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        logger.error(`Error getting plugin settings for ${pluginId}:`, error);
        return {}; // Return empty object on error to prevent UI from breaking
    }
}

export async function setPluginSettings(pluginId, settings) {
    try {
        const response = await fetch(`${API_BASE_URL}/plugins/${pluginId}/settings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(settings),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Failed to set plugin settings for ${pluginId}. Status: ${response.status}, Body: ${errorBody}`);
        }
        logger.info(`Plugin settings for ${pluginId} updated successfully:`, settings);
        return true;
    } catch (error) {
        throw error; // Re-throw to allow calling code to handle
    }
}

export async function verifyVisualizerCredentials(username, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/plugins/visualizer.reaplugin/verifyCredentials`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }
        const result = await response.json();
        return result.valid;
    } catch (error) {
        logger.error('Failed to verify Visualizer credentials:', error);
        return false; // Assume invalid on error
    }
}
