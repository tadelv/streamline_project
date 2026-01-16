import { connectWebSocket, getWorkflow, connectScaleWebSocket, ensureGatewayModeTracking, reconnectingWebSocket, getDevices, reconnectDevice, scanForDevices,connectShotSettingsWebSocket, setDe1Settings, updateShotSettingsCache, getDe1Settings, MachineState, getShotIds, getShots, getValueFromStore, verifyVisualizerCredentials, connectScaleDevice, tareScale, connectTimeToReadyWebSocket } from './api.js';
import { initScaling } from './scaling.js';
import * as chart from './chart.js';
import * as ui from './ui.js';
import { initI18n } from './i18n.js';
import * as history from './history.js';
import * as shotData from './shotData.js';
import * as profileManager from './profileManager.js';
import * as api from './api.js';
import { loadPage } from './router.js'; 
import { initWaterTankSocket } from './waterTank.js';
import { logger, setDebug } from './logger.js';

window.app = { api, ui, chart };
// Helper function to format state strings
function formatStateString(text) {
    if (!text) return '';
    // "camelCase" -> "Camel Case"
    const result = text.replace(/([A-Z])/g, ' $1');
    return result.charAt(0).toUpperCase() + result.slice(1).trim();
}

let shotStartTime = null;
let dataTimeout;
let de1DeviceId = null;
let isDe1Connected = false; // New variable to track DE1 connection status
let isScaleConnected = false; // New variable to track Scale connection status
let previousState = {}; // Track previous machine state object {state, substate}
let scaleReconnectPoller = null;
let latestScaleWeight = 0;
let heatingStartTime = null;
let heatingStartTemp = 0;
let isConnectingScale = false;
let timeToReadyMessage = null;

// To filter the chart to only show data from the 'pouring' state,
// set this variable to true in your browser's developer console.
let filterGraphToPouringState = true;

function onScaleReconnect() {
    logger.info('Scale WebSocket reconnected.');
}

function onScaleDisconnect() {
    logger.warn('Scale has disconnected.');
    isScaleConnected = false;
    ui.updateWeight('[Reconnect]', {
        weightText: { add: ['text-red-600'] },
        dataWeight: { add: ['text-[var(--mimoja-blue)]'], remove: ['text-[var(--text-primary)]'] }
    });
}

// Sets a timer. If no data is received within 5 seconds, it assumes a stale connection.
function resetDataTimeout() {
    clearTimeout(dataTimeout);
    dataTimeout = setTimeout(() => {
        logger.warn('No WebSocket data received for 5 seconds. Assuming REA or WebSocket disconnection.');
        ui.updateMachineStatus("Disconnected");
        isDe1Connected = false;
        devices =  scanForDevices();
            de1Machine = devices.find(d => d.type === 'machine');
        if (de1DeviceId) {
            logger.info('DE1 machine connected no need to reconnect.');
        } else {
            reconnectDevice(de1DeviceId);
        }

    }, 5000); // 5-second timeout
}

function isHeatingState(state, substate) {
    return state === MachineState.HEATING || (state === MachineState.IDLE && substate === 'preparingForShot');
}

async function pollForUploadConfirmation(shotId, timeout = 30000) {
    logger.info(`Polling for upload confirmation for shot ID: ${shotId}`);
    const pollInterval = 3000; // 3 seconds
    const startTime = Date.now();

    const checkUploadStatus = async (resolve, reject) => {
        if (Date.now() - startTime > timeout) {
            logger.warn(`Polling timed out for shot ${shotId}.`);
            ui.showToast(`Upload timed out for shot ${shotId}.`, 5000, 'error');
            return reject(new Error('Polling timed out'));
        }

        try {
            const lastUploadedShotId = await getValueFromStore('visualizer.reaplugin', 'lastUploadedShot');
            logger.debug(`Polled lastUploadedShotId: ${lastUploadedShotId}`);

            if (lastUploadedShotId === shotId) {
                logger.info(`Successfully confirmed upload for shot ${shotId}.`);
                ui.showToast('Shot uploaded successfully!', 3000, 'success');
                return resolve(true);
            } else {
                setTimeout(() => checkUploadStatus(resolve, reject), pollInterval);
            }
        } catch (error) {
            logger.error('Error during polling for upload confirmation:', error);
            // Don't reject immediately, let it retry until timeout
            setTimeout(() => checkUploadStatus(resolve, reject), pollInterval);
        }
    };

    return new Promise(checkUploadStatus);
}

function handleTimeToReadyData(data) {
    if (data.status === 'heating' && data.remainingTimeMs > 0) {
        const totalSeconds = Math.round(data.remainingTimeMs / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        // logger.debug("time to read data",data);
        if (minutes > 0) {
            timeToReadyMessage = `~${minutes}m ${seconds}s until ready`;
        } else {
            timeToReadyMessage = `~${seconds}s until ready`;
        }
    } else {
        timeToReadyMessage = null;
    }
}

function handleData(data) {
    //logger.debug("handleData received new snapshot.");
    resetDataTimeout(); // Reset the timer every time data is received.

    const { state, substate } = data.state;
    const wasHeating = isHeatingState(previousState.state, previousState.substate);
    const isHeating = isHeatingState(state, substate);
    let statusString;

    // Reset heating timer if state changes FROM heating
    if (wasHeating && !isHeating) {
        heatingStartTime = null;
        heatingStartTemp = 0;
    }

    // Determine the status string based on state and substate
    if (state === MachineState.ERROR) {
        statusString = "Error";
    } else if (state === MachineState.SLEEPING) {
        // Activate screensaver when machine enters sleep state
        if (!ui.isScreensaverActive()) {
            ui.activateScreensaver();
        }
        statusString = "Sleeping";
    } else {
        // Deactivate screensaver when machine wakes up from sleep (if it was active)
        if (ui.isScreensaverActive()) {
            ui.deactivateScreensaver();
        }
        if (isHeating) {
            if (timeToReadyMessage) {
                statusString = timeToReadyMessage;
            } else {
                const targetGroupTemp = data.targetGroupTemperature;
                const currentGroupTemp = data.groupTemperature;
                statusString = `Heating... (${currentGroupTemp.toFixed(0)}°c / ${targetGroupTemp.toFixed(0)}°c)`;
            }
        } else {
            const formattedState = formatStateString(state);
            const formattedSubstate = formatStateString(substate);
            statusString = formattedState;

            // Append substate if it's meaningful and not redundant
            if (formattedSubstate && formattedSubstate.toLowerCase() !== 'idle' && formattedSubstate.toLowerCase() !== formattedState.toLowerCase()) {
                statusString += ` (${formattedSubstate})`;
            }
        }
    }

    // Detect DE1 reconnection
    if (state !== MachineState.ERROR && !isDe1Connected) {
        logger.info('DE1 machine reconnected. Loading initial data.');
        isDe1Connected = true;
        loadInitialData(); // Refresh all configuration data
        // Do not clear chart or reset shotStartTime as per user request
    } else if (state === MachineState.ERROR && isDe1Connected) {
        logger.warn('DE1 machine connected with error status.');
        // isDe1Connected = false;
        // ui.updateMachineStatus("Disconnected"); // Removed: Let the main logic handle it
    }

    // Check for shot completion (transition from 'espresso' to 'ready' or 'idle')
    if (previousState.state === MachineState.ESPRESSO && (state === MachineState.READY || state === MachineState.IDLE)) {
        logger.info('Shot finished. Checking for upload confirmation and refreshing history.');

        // Start polling for upload confirmation
        setTimeout(async () => {
            try {
                const shotIds = await getShotIds();
                if (shotIds && shotIds.length > 0) {
                    const latestShotId = shotIds[shotIds.length - 1];
                    pollForUploadConfirmation(latestShotId);
                } else {
                    logger.warn('Could not get latest shot ID to confirm upload.');
                }
            } catch (error) {
                logger.error('Failed to initiate upload polling:', error);
            }
        }, 2000); // Delay to ensure shot is saved on server

        setTimeout(() => {
            history.initHistory();
        }, 5000);
    }
    previousState = data.state; // Update previous state

    // Update UI elements
    ui.updateMachineStatus(statusString);
    ui.updateSleepButton(state);
    ui.updateTemperatures({ mix: data.mixTemperature, group: data.groupTemperature, steam: data.steamTemperature });

    // Update Chart and Shot Data Table
    if (MachineState.ESPRESSO.includes(state)) {
        if (!shotStartTime) {
            shotStartTime = new Date(data.timestamp);
            chart.clearChart();
            shotData.clearShotData();
            const historyLabelEl = document.getElementById('shot-history-label');
            if (historyLabelEl) {
                historyLabelEl.textContent = 'CURRENT';
            }
        }
        chart.updateChart(shotStartTime, data, latestScaleWeight);
        shotData.updateShotData(data, latestScaleWeight);
    } else {
        shotStartTime = null;
    }
}

// Throttle function to limit the rate of execution
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

const throttledUpdateWeight = throttle(ui.updateWeight, 100); // 100ms throttle interval

function handleScaleData(data) {
    const currentWeight = data.weight;
    latestScaleWeight = currentWeight;

    // Receiving any message means the websocket and BLE link are up.
    // The timeout in api.js will trigger a disconnect if data stops flowing.

    if (currentWeight !== null && currentWeight !== undefined) {
        // We have a weight, so we are fully connected.
        if (!isScaleConnected) {
            logger.info('Scale reconnected.');
            isScaleConnected = true;
        }
        // Update the UI with the new weight and reset styles.
        throttledUpdateWeight(currentWeight, {
            weightText: { remove: ['text-red-600'] },
            dataWeight: { remove: ['text-[var(--mimoja-blue)]'] }
        });
    } else {
        // We received a message without a weight.
        if (!isScaleConnected) {
            ui.updateWeight('[Reconnect]', {
                weightText: { add: ['text-red-600'] },
                dataWeight: { add: ['text-[var(--mimoja-blue)]'] ,remove:['text-[var(--text-primary)]']}
            });
        }
        logger.warn('Scale message received without weight data.');
    }
}

async function handleWeightClick() {
    if (isScaleConnected) {
        try {
            await tareScale();
            ui.showToast('Scale tared', 2000, 'success');
        } catch (error) {
            ui.showToast('Failed to tare scale', 3000, 'error');
        }
        return;
    }

    if (isConnectingScale) return;

    isConnectingScale = true;
    ui.updateWeight('Connecting...');

    try {
        await connectScaleDevice();

        let attempts = 0;
        const maxAttempts = 15;
        const poll = setInterval(async () => {
            attempts++;
            if (attempts > maxAttempts) {
                clearInterval(poll);
                ui.showToast('Scale Not Found', 3000, 'error');
                ui.updateWeight('[Reconnect]', {
                    weightText: { add: ['text-red-600'] },
                    dataWeight: { add: ['text-[var(--mimoja-blue)]'] ,remove:['text-[var(--text-primary)]']}
                });
                isConnectingScale = false;
                return;
            }

            try {
                const devices = await getDevices();
                const scale = devices.find(d => d.type === 'scale' && d.state === 'connected');

                if (scale) {
                    clearInterval(poll);
                    logger.info('Scale BLE link established. Re-initializing WebSocket connection.');
                    isConnectingScale = false;
                    // Re-create the WebSocket with proper handlers to ensure a clean connection.
                    connectScaleWebSocket(
                        handleScaleData,
                        onScaleReconnect,
                        onScaleDisconnect
                    );
                }
            } catch (pollError) {
                // Ignore poll errors, let it retry
            }
        }, 1000);
    } catch (error) {
        ui.showToast('Failed to initiate scale connection', 3000, 'error');
        ui.updateWeight('[Reconnect]', {
            weightText: { add: ['text-red-600'] },
            dataWeight: { add: ['text-[var(--mimoja-blue)]'] ,remove:['text-[var(--text-primary)]']}
        });
        isConnectingScale = false;
    }
}

async function handleShotSettingsData(data) {
    updateShotSettingsCache(data);
    ui.updateHotWaterDisplay(data);

    try {
        const de1Settings = await getDe1Settings();
        if (de1Settings) {
            const combinedData = { ...data, targetSteamFlow: de1Settings.steamFlow };
            ui.updateSteamDisplay(combinedData);
        } else {
            logger.warn('Could not retrieve DE1 settings, using fallback for steam display.');
            ui.updateSteamDisplay(data);
        }
    } catch (error) {
        logger.error('Failed to get DE1 settings for steam display:', error);
        ui.updateSteamDisplay(data); // Fallback to original data
    }

    if (data.flushTimeout !== undefined) {
        ui.updateFlushDisplay(data.flushTimeout);
    }
}

async function loadInitialData() {
    logger.debug("loadInitialData triggered.");
    try {
        const workflow = await getWorkflow();
        logger.debug("Workflow data received:", workflow);

        const profile = workflow?.profile;
        const doseData = workflow?.doseData;
        const grinderData = workflow?.grinderData;

        if (profile) {
            ui.updateProfileName(profile.title || "Untitled Profile");
            if (profile.steps && profile.steps.length > 0) {
                ui.updateTemperatureDisplay(profile.steps[0].temperature || 0);
            }
        }

        if (doseData) {
            ui.updateDoseInDisplay(doseData.doseIn);
            ui.updateDrinkOut(doseData.doseOut || 0);
        }

        if (grinderData) {
            ui.updateGrindDisplay(grinderData);
        }

        ui.updateDrinkRatio();

    } catch (error) {
        logger.error("Failed to load initial data:", error);
        ui.updateProfileName("Error loading profile");
    }
}

async function initializeDe1Connection() {
    try {
        logger.info('Attempting to find devices with fast method...');
        let devices = await getDevices();
        let de1Machine = devices.find(d => d.type === 'machine' && d.state === 'connected');

        // If not found, try the slower, more reliable scan
        if (!de1Machine) {
            logger.warn('DE1 not found with fast method. Trying fallback scan...');
            devices = await scanForDevices();
            de1Machine = devices.find(d => d.type === 'machine' && d.state === 'connected');
        }

        if (de1Machine) {
            de1DeviceId = de1Machine.id;
            logger.info(`DE1 machine ID found and stored: ${de1DeviceId}`);
            if (de1Machine.state !== 'connected') {
                logger.warn('DE1 machine is found but not connected. Awaiting automatic reconnection or data timeout.');
            } else {
                logger.info('DE1 machine is already connected.');
            }
        } else {
            logger.error('DE1 machine not found or not connected even after fallback scan.');
        }
    } catch (error) {
        logger.error('Failed to initialize DE1 device ID:', error);
    }
}

async function initVisualizer() {
    logger.info('Initializing Visualizer connection...');
    const username = localStorage.getItem('visualizerUsername');
    const encodedPassword = localStorage.getItem('visualizerPassword');

    if (username && encodedPassword) {
        try {
            const password = atob(encodedPassword); // Decode password
            const isValid = await verifyVisualizerCredentials(username, password);
            if (isValid) {
                logger.info('Saved Visualizer credentials are valid.');
                ui.showToast('Visualizer log-in success', 3000, 'success');
            } else {
                logger.warn('Saved Visualizer credentials failed to validate. Please check your settings.');
                // Clearing the invalid credentials
                localStorage.removeItem('visualizerUsername');
                localStorage.removeItem('visualizerPassword');
            }
        } catch (e) {
            logger.error('Failed to decode or verify saved credentials', e);
            // Clear potentially corrupted credentials
            localStorage.removeItem('visualizerUsername');
            localStorage.removeItem('visualizerPassword');
        }
    } else {
        logger.info('No saved Visualizer credentials found.');
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        setDebug(true);
        logger.info('App DOMContentLoaded: Starting initialization.');

        chart.initChart();
        logger.info('App DOMContentLoaded: Chart initialized.');

        await initI18n();
        ui.initUI({ onWeightClick: handleWeightClick });
        ui.initScreensaver(); // Initialize screensaver functionality
        initScaling();
        logger.info('App DOMContentLoaded: UI initialized.');

        logger.info('App DOMContentLoaded: Awaiting History module...');
        await history.initHistory();
        logger.info('App DOMContentLoaded: History module finished.');

        logger.info('App DOMContentLoaded: Awaiting Profile Manager module...');
        await profileManager.init();
        logger.info('App DOMContentLoaded: Profile Manager module finished.');

        logger.info('App DOMContentLoaded: Awaiting initial data...');
        await loadInitialData();
        logger.info('App DOMContentLoaded: Initial data finished.');

        logger.info('App DOMContentLoaded: Awaiting DE1 connection...');
        await initializeDe1Connection();
        logger.info('App DOMContentLoaded: DE1 connection finished.');

        logger.info('App DOMContentLoaded: Initializing Visualizer...');
        await initVisualizer();
        logger.info('App DOMContentLoaded: Visualizer initialized.');

        logger.info('App DOMContentLoaded: Setting up WebSockets and timers...');
        connectWebSocket(handleData, () => {
            logger.info('WebSocket reconnected. Resetting DE1 connection status.');
            isDe1Connected = false; // Reset DE1 connection status so handleData can detect reconnection
        });
        connectScaleWebSocket(
            handleScaleData,
            onScaleReconnect,
            onScaleDisconnect
        );
        initWaterTankSocket();
        connectTimeToReadyWebSocket(handleTimeToReadyData);
        ensureGatewayModeTracking();
        resetDataTimeout(); // Start the timeout timer initially.
        connectShotSettingsWebSocket(handleShotSettingsData);
        logger.info('App DOMContentLoaded: WebSockets and timers set up.');

        logger.info('App initialization finished successfully.');

        // Check if user is on desktop (Windows or macOS) to determine if we should show fullscreen prompt
        const isDesktop = navigator.userAgent.includes('Win') || navigator.userAgent.includes('Mac');

        // Prompt user to enter fullscreen only if not on desktop
        if (!isDesktop && !document.fullscreenElement && !sessionStorage.getItem('fullscreenPromptDismissed')) {
            const toastContainer = document.getElementById('fullscreen-toast-container');
            if (toastContainer) {
                toastContainer.style.display = 'grid'; // Use grid as per DaisyUI examples for centering

                document.getElementById('toast-fullscreen-btn').onclick = () => {
                    document.getElementById('fullscreen-toggle-btn').click();
                    toastContainer.style.display = 'none';
                    sessionStorage.setItem('fullscreenPromptDismissed', 'true');
                };

                document.getElementById('toast-close-btn').onclick = () => {
                    toastContainer.style.display = 'none';
                    sessionStorage.setItem('fullscreenPromptDismissed', 'true');
                };
            }
        }

        // Add event listener to close the toast when fullscreen mode is entered
        // This handles the case where the user clicks the fullscreen toggle directly
        document.addEventListener('fullscreenchange', () => {
            const toastContainer = document.getElementById('fullscreen-toast-container');
            if (toastContainer && document.fullscreenElement) {
                // If we're now in fullscreen mode, hide the toast
                toastContainer.style.display = 'none';
            }
        });

        // Also handle the WebKit-specific event for Safari
        document.addEventListener('webkitfullscreenchange', () => {
            const toastContainer = document.getElementById('fullscreen-toast-container');
            if (toastContainer && document.webkitFullscreenElement) {
                // If we're now in fullscreen mode, hide the toast
                toastContainer.style.display = 'none';
            }
        });

        document.getElementById('profile-name').onclick = () => {
            loadPage('src/profiles/profile_selector.html');
        };
    } catch (error) {
        logger.error('CRITICAL: Unhandled error during application initialization:', error);
        // Optionally, display a user-friendly error message on the page
        const body = document.querySelector('body');
        if (body) {
            body.innerHTML = `<div style="color: red; padding: 2rem;">
                <h1>Application Error</h1>
                <p>A critical error occurred during startup. Please check the console for details and try refreshing the page.</p>
            </div>`;
        }
    }
});
