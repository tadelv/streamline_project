import { getProfile, sendProfile, updateWorkflow, setMachineState, setTargetHotWaterVolume, setTargetHotWaterTemp, setTargetHotWaterDuration, setDe1Settings, setTargetSteamFlow, setTargetSteamDuration, MachineState, reaHostname, setPluginSettings, getPlugins, getPluginSettings, verifyVisualizerCredentials } from './api.js';
import { logger } from './logger.js';
import * as chart from './chart.js';
import { getSupportedLanguages, getCurrentLanguage, setLanguage, getTranslation } from './i18n.js';


function initLanguageSwitcher() {
    const switcher = document.getElementById('language-switcher');
    if (!switcher) return;

    const supportedLanguages = getSupportedLanguages();
    const currentLanguage = getCurrentLanguage();

    // Populate the dropdown
    switcher.innerHTML = ''; // Clear existing options
    supportedLanguages.forEach(lang => {
        const option = document.createElement('option');
        option.value = lang;
        option.textContent = new Intl.DisplayNames(['en'], { type: 'language' }).of(lang) || lang;
        if (lang === currentLanguage) {
            option.selected = true;
        }
        switcher.appendChild(option);
    });

    // Add event listener
    switcher.addEventListener('change', (event) => {
        setLanguage(event.target.value);
    });
}

export function formatStateForDisplay(state) {
    if (!state) return '';
    if (state === MachineState.FW_UPGRADE) return 'FW Upgrade';
    const withSpaces = state.replace(/([A-Z])/g, ' ');
    return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
}

let currentHotWaterVolume = 0;
let currentHotWaterTemp = 0;
let hotWaterMode = 'volume'; // 'volume' or 'temperature'
let hotWaterTempPresets = [75, 80, 85, 92];
let hotWaterVolPresets = [50, 100, 150, 200];

let currentSteamDuration = 0;
let currentSteamFlow = 1.5;
let steamMode = 'time'; // 'time' or 'flow'
let steamTimePresets = [15, 30, 45, 60];
let steamFlowPresets = [0.5, 1.0, 1.5, 2.0];

export function flashPlusMinusButton(button) {
    // Store the original background style to restore after the animation
    const originalBgStyle = button.style.backgroundColor;

    // Apply the flash animation
    button.style.backgroundColor = 'var(--plus-minus-flash-on-color2)';
    setTimeout(() => {
        button.style.backgroundColor = 'var(--plus-minus-flash-on-color)';
    }, 40);
    setTimeout(() => {
        button.style.backgroundColor = 'var(--plus-minus-flash-on-color2)';
    }, 200);
    setTimeout(() => {
        // Restore the original background style instead of using a fixed color
        // This allows the button to properly reflect the current theme
        button.style.backgroundColor = originalBgStyle;
    }, 280);
}

function updateDoseValue(type, newValue) {
    const doseInEl = document.getElementById('dose-in-value');
    const drinkOutEl = document.getElementById('drink-out-value');
    const currentDoseIn = doseInEl ? parseFloat(doseInEl.textContent) : 0;
    const currentDoseOut = drinkOutEl ? parseFloat(drinkOutEl.textContent) : 0;

    const payload = {
        doseData: {
            doseIn: type === 'in' ? parseFloat(newValue) : currentDoseIn,
            doseOut: type === 'out' ? parseFloat(newValue) : currentDoseOut
        }
    };

    updateWorkflow(payload).then(() => {
        logger.debug(`Dose ${type} value updated via workflow:`, newValue);
    }).catch(error => {
        logger.error(`Failed to update dose ${type} value via workflow:`, error);
    });
}

export function updateDoseAndDrinkOutValue(newDoseIn, newDrinkOut) {
    const payload = {
        doseData: {
            doseIn: newDoseIn,
            doseOut: newDrinkOut
        }
    };

    updateWorkflow(payload).then(() => {
        logger.debug(`Dose In and Drink Out values updated via workflow: ${newDoseIn}g : ${newDrinkOut}g`);
    }).catch(error => {
        logger.error(`Failed to update dose in and drink out values via workflow:`, error);
    });
}

export function updateDrinkOutPresetsDisplay(doseIn, drinkOut) {
    const doseInEl = document.getElementById('dose-in-value');
    const drinkOutEl = document.getElementById('drink-out-value');
    const ratioEl = document.getElementById('drink-ratio-value');

    if (doseInEl) {
        doseInEl.textContent = `${doseIn}g`;
    }
    if (drinkOutEl) {
        drinkOutEl.textContent = `${drinkOut}g`;
    }

    if (doseInEl && drinkOutEl && ratioEl) {
        if (!isNaN(doseIn) && !isNaN(drinkOut) && doseIn > 0) {
            const ratio = drinkOut / doseIn;
            ratioEl.textContent = `(1:${ratio.toFixed(1)})`;
        } else {
            ratioEl.textContent = '(1:--)';
        }
    }
}

function updateTemperatureValue(newValue) {
    getProfile().then(profile => {
        if (profile && profile.steps) {
            profile.steps.forEach(step => {
                step.temperature = newValue.toString();
            });
            updateWorkflow({ profile: profile }).then(() => {
                logger.debug('Temperature updated via workflow:', newValue);
            }).catch(error => {
                logger.error('Failed to update temperature via workflow:', error);
            });
        }
    });
}

function updateGrindValue(newValue) {
    const workflowUpdate = {
        grinderData: {
            setting: newValue.toString()
        }
    };
    updateWorkflow(workflowUpdate).then(() => {
        logger.debug('Grind value updated successfully:', newValue);
    }).catch(error => {
        logger.error('Failed to update grind value:', error);
    });
}

export function updateDrinkRatio() {
    const doseInEl = document.getElementById('dose-in-value');
    const drinkOutEl = document.getElementById('drink-out-value');
    const ratioEl = document.getElementById('drink-ratio-value');

    if (doseInEl && drinkOutEl && ratioEl) {
        const doseIn = parseFloat(doseInEl.textContent);
        const drinkOut = parseFloat(drinkOutEl.textContent);

        if (!isNaN(doseIn) && !isNaN(drinkOut) && doseIn > 0) {
            const ratio = drinkOut / doseIn;
            ratioEl.textContent = `(1:${ratio.toFixed(1)})`;
        } else {
            ratioEl.textContent = '(1:--)';
        }
    }
}

function makeEditable(element, onCommit) {
    element.addEventListener('click', () => {
        if (element.parentNode.querySelector('input')) return;

        let isProcessed = false;
        const currentValue = parseFloat(element.textContent);
        const input = document.createElement('input');
        input.type = 'number';
        input.value = currentValue;
        input.className = 'text-[22.5px] font-bold text-center w-18 bg-transparent absolute';
        input.name = element.id; // Recommended for accessibility and autofill

        // Position the input field exactly where the original element is
        const elementRect = element.getBoundingClientRect();
        const parentRect = element.parentNode.getBoundingClientRect();

        input.style.position = 'absolute';
        input.style.left = (element.offsetLeft) + 'px';
        input.style.top = (element.offsetTop) + 'px';
        input.style.width = element.offsetWidth + 'px';
        input.style.height = element.offsetHeight + 'px';
        input.style.display = 'flex';
        input.style.alignItems = 'center';
        input.style.justifyContent = 'center';
        input.style.textAlign = 'center';
        input.style.zIndex = '10'; // Ensure input appears above other elements

        // Hide the original element but keep its space reserved
        element.style.visibility = 'hidden';

        // Insert the input into the same parent container
        element.parentNode.appendChild(input);
        input.focus();
        input.select();

        const processChange = (shouldCommit) => {
            if (isProcessed) return;
            isProcessed = true;

            if (shouldCommit) {
                const newValue = parseFloat(input.value);
                if (!isNaN(newValue) && newValue >= 0) {
                    onCommit(newValue);
                }
            }

            // Restore the original element
            element.style.visibility = '';

            input.remove();
        };

        input.addEventListener('blur', () => processChange(true));
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') processChange(true);
            if (e.key === 'Escape') processChange(false);
        });
    });
}

export function updateHotWaterDisplay(data) {
    const volEl = document.getElementById('hot-water-vol-value');
    const tempEl = document.getElementById('hot-water-temp-value');
    const modeTempEl = document.getElementById('hot-water-mode-temp');
    const modeVolEl = document.getElementById('hot-water-mode-vol');
    if (!volEl || !tempEl || !modeTempEl || !modeVolEl) return;
    if (data.targetHotWaterVolume !== undefined) {
        currentHotWaterVolume = data.targetHotWaterVolume;
    }
    if (data.targetHotWaterTemp !== undefined) {
        currentHotWaterTemp = data.targetHotWaterTemp;
    }

    volEl.textContent = `${currentHotWaterVolume}ml`;
    tempEl.textContent = `${currentHotWaterTemp}°C`;

    if (hotWaterMode === 'volume') {
        volEl.classList.remove('text-lg', 'text-neutral-400');
        volEl.classList.add('text-[22.5px]', 'font-bold','text-[var(--text-primary)]');
        tempEl.classList.remove('text-[22.5px]', 'font-bold');
        tempEl.classList.add('text-lg', 'text-neutral-400');
        modeVolEl.className = 'text-[var(--mimoja-blue-v2)]';
        modeTempEl.className = 'text-[var(--low-contrast-white)]';
    } else { // temperature mode
        tempEl.classList.remove('text-lg', 'text-neutral-400');
        tempEl.classList.add('text-[22.5px]', 'font-bold','text-[var(--text-primary)]','font-bold');
        volEl.classList.remove('text-[22.5px]', 'font-bold');
        volEl.classList.add('text-lg', 'text-neutral-400');
        modeTempEl.className = 'text-[var(--mimoja-blue-v2)]';
        modeVolEl.className = 'text-[var(--low-contrast-white)]';
    }
}

function incrementHotWater() {
    const hotWaterPlusBtn = document.getElementById('hot-water-vol-plus');
    if (hotWaterPlusBtn) { flashPlusMinusButton(hotWaterPlusBtn); }
    if (hotWaterMode === 'volume') {
        if (currentHotWaterVolume < 255) {
            currentHotWaterVolume += 5;
            if (currentHotWaterVolume > 255) currentHotWaterVolume = 255; // cap at max
            setTargetHotWaterVolume(currentHotWaterVolume).catch(e => logger.error(e));
        }
    } else {
        if (currentHotWaterTemp < 100) {
            currentHotWaterTemp += 1;
            setTargetHotWaterTemp(currentHotWaterTemp).catch(e => logger.error(e));
        }
    }
    updateHotWaterDisplay({ targetHotWaterVolume: currentHotWaterVolume, targetHotWaterTemp: currentHotWaterTemp });
}

function decrementHotWater() {
    const hotWaterMinusBtn = document.getElementById('hot-water-vol-minus');
    if (hotWaterMinusBtn) { flashPlusMinusButton(hotWaterMinusBtn); }
    if (hotWaterMode === 'volume') {
        if (currentHotWaterVolume > 3) {
            currentHotWaterVolume -= 5;
            if (currentHotWaterVolume < 3) currentHotWaterVolume = 3; // cap at min
            setTargetHotWaterVolume(currentHotWaterVolume).catch(e => logger.error(e));
        }
    }
    else {
        if (currentHotWaterTemp > 0) {
            currentHotWaterTemp -= 1;
            setTargetHotWaterTemp(currentHotWaterTemp).catch(e => logger.error(e));
        }
    }
    updateHotWaterDisplay({ targetHotWaterVolume: currentHotWaterVolume, targetHotWaterTemp: currentHotWaterTemp });
}

function updateHotWaterPresetDisplay() {
    const presetContainer = document.getElementById('hotwater-presets');
    if (!presetContainer) return;

    const presets = hotWaterMode === 'temperature' ? hotWaterTempPresets : hotWaterVolPresets;
    const unit = hotWaterMode === 'temperature' ? '°c' : 'ml';

    Array.from(presetContainer.children).forEach((button, index) => {
        if (presets[index] !== undefined) {
            button.textContent = `${presets[index]}${unit}`;
        }
    });
}

function toggleHotWaterMode() {
    hotWaterMode = hotWaterMode === 'volume' ? 'temperature' : 'volume';
    logger.info(`Hot water mode switched to: ${hotWaterMode}`);
    updateHotWaterDisplay({ targetHotWaterVolume: currentHotWaterVolume, targetHotWaterTemp: currentHotWaterTemp });
    updateHotWaterPresetDisplay();
}

function setupValueAdjuster(minusBtnId, plusBtnId, valueElId, step, min, formatter, onUpdate) {
    const minusBtn = document.getElementById(minusBtnId);
    const plusBtn = document.getElementById(plusBtnId);
    const valueEl = document.getElementById(valueElId);

    if (!minusBtn || !plusBtn || !valueEl) return;

    minusBtn.addEventListener('click', (e) => {
        flashPlusMinusButton(e.currentTarget);
        let currentValue = parseFloat(valueEl.textContent);
        if (currentValue > min) {
            currentValue -= step;
            valueEl.textContent = formatter(currentValue);
            onUpdate(currentValue);
        }
    });

    plusBtn.addEventListener('click', (e) => {
        flashPlusMinusButton(e.currentTarget);
        let currentValue = parseFloat(valueEl.textContent);
        currentValue += step;
        valueEl.textContent = formatter(currentValue);
        onUpdate(currentValue);
    });
}

function setupPressAndHold(element, clickCallback, longPressCallback) {
    let timer;
    let longPressOccurred = false;

    const startPress = (e) => {
        e.preventDefault();
        longPressOccurred = false;
        timer = setTimeout(() => {
            longPressOccurred = true;
            longPressCallback();
        }, 1000); // 1 second for long press
    };

    const endPress = (e) => {
        clearTimeout(timer);
        if (longPressOccurred) {
            // Prevent any further "click" actions if a long press happened.
            e.preventDefault();
            e.stopPropagation();
        }
    };

    const cancelPress = () => {
        clearTimeout(timer);
    }

    element.addEventListener('contextmenu', e => e.preventDefault());

    // Mouse events
    element.addEventListener('mousedown', startPress);
    element.addEventListener('mouseup', endPress);
    element.addEventListener('mouseleave', cancelPress);

    // Touch events
    element.addEventListener('touchstart', startPress, { passive: false });
    element.addEventListener('touchend', endPress);

    element.addEventListener('click', (e) => {
        if (longPressOccurred) {
            e.preventDefault();
            e.stopPropagation();
        } else {
            clickCallback();
        }
    });
}

function flashElement(element) {
    if (element) {
        element.classList.add('flash');
        setTimeout(() => {
            element.classList.remove('flash');
        }, 300); // 300ms flash duration
    }
}

export function updateSteamDisplay(data) {
    const durationEl = document.getElementById('steam-duration-value');
    const flowEl = document.getElementById('steam-flow-value');
    const modeTimeEl = document.getElementById('steam-mode-time');
    const modeFlowEl = document.getElementById('steam-mode-flow');

    if (!durationEl || !flowEl || !modeTimeEl || !modeFlowEl) return;

    if (data.targetSteamDuration !== undefined) {
        currentSteamDuration = data.targetSteamDuration;
    }
    if (data.targetSteamFlow !== undefined) {
        currentSteamFlow = data.targetSteamFlow;
    }

    durationEl.textContent = `${currentSteamDuration}s`;
    flowEl.textContent = `${currentSteamFlow.toFixed(1)}ml/s`;

    if (steamMode === 'time') {
        durationEl.classList.remove('text-lg', 'text-neutral-400');
        durationEl.classList.add('text-[22.5px]', 'font-bold','text-neutral-900');
        flowEl.classList.remove('text-[22.5px]', 'font-bold');
        flowEl.classList.add('text-lg', 'text-neutral-400');
        modeTimeEl.className = 'text-[var(--mimoja-blue-v2)]';
        modeFlowEl.className = 'text-[var(--low-contrast-white)]';
    } else { // flow mode
        flowEl.classList.remove('text-lg', 'text-neutral-400');
        flowEl.classList.add('text-[22.5px]', 'font-bold','text-neutral-900','font-bold');
        durationEl.classList.remove('text-[22.5px]', 'font-bold');
        durationEl.classList.add('text-lg', 'text-neutral-400');
        modeFlowEl.className = 'text-[var(--mimoja-blue-v2)]';
        modeTimeEl.className = 'text-[var(--low-contrast-white)]';
    }
}

function incrementSteam() {
    const steamPlusBtn = document.getElementById('steam-plus');
    if (steamPlusBtn) {  flashPlusMinusButton(steamPlusBtn);
    }
    if (steamMode === 'time') {
        currentSteamDuration += 1;
        setTargetSteamDuration(currentSteamDuration).catch(e => logger.error(e));
    } else {
        if (currentSteamFlow < 2.5) {
            currentSteamFlow += 0.1;
            setTargetSteamFlow(currentSteamFlow).catch(e => logger.error(e));
        }
    }
    updateSteamDisplay({ targetSteamDuration: currentSteamDuration, targetSteamFlow: currentSteamFlow });
}

function decrementSteam() {
    const steamMinusBtn = document.getElementById('steam-minus');
    if (steamMinusBtn) { flashPlusMinusButton(steamMinusBtn); }
    if (steamMode === 'time') {
        if (currentSteamDuration > 0) {
            currentSteamDuration -= 1;
            setTargetSteamDuration(currentSteamDuration).catch(e => logger.error(e));
        }
    } else {
        if (currentSteamFlow > 0.4) {
            currentSteamFlow -= 0.1;
            setTargetSteamFlow(currentSteamFlow).catch(e => logger.error(e));
        }
    }
    updateSteamDisplay({ targetSteamDuration: currentSteamDuration, targetSteamFlow: currentSteamFlow });
}

function updateSteamPresetDisplay() {
    const timePresetContainer = document.getElementById('steam-presets');
    const flowPresetContainer = document.getElementById('steam-flow-presets');
    if (!timePresetContainer || !flowPresetContainer) return;

    if (steamMode === 'flow') {
        timePresetContainer.classList.add('hidden');
        flowPresetContainer.classList.remove('hidden');
        const presets = steamFlowPresets;
        Array.from(flowPresetContainer.children).forEach((button, index) => {
            if (presets[index] !== undefined) {
                button.textContent = `${presets[index].toFixed(1)}`;
            }
        });
    } else { // time mode
        timePresetContainer.classList.remove('hidden');
        flowPresetContainer.classList.add('hidden');
        const presets = steamTimePresets;
        const unit = 's';
        Array.from(timePresetContainer.children).forEach((button, index) => {
            if (presets[index] !== undefined) {
                button.textContent = `${presets[index]}${unit}`;
            }
        });
    }
}

function toggleSteamMode() {
    steamMode = steamMode === 'time' ? 'flow' : 'time';
    logger.info(`Steam mode switched to: ${steamMode}`);
    updateSteamDisplay({ targetSteamDuration: currentSteamDuration, targetSteamFlow: currentSteamFlow });
    updateSteamPresetDisplay();
}

export function initThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) return;
    const btn = document.querySelector('.togglebtn-change');
    if (!btn) return;

    const applyTheme = (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        chart.setTheme(theme);

        if (theme === 'dark') {
            btn.style.setProperty('--bg--togglebtn', '#FFFFFF'); //
            btn.style.setProperty('--btn-togglebgcolor', '#959595'); //

        } else {
            btn.style.setProperty('--bg--togglebtn', '#121212'); //
            btn.style.setProperty('--btn-togglebgcolor', '#FFFFFF'); //
        }
    };

    const currentTheme = localStorage.getItem('theme') || 'light';
    themeToggle.checked = currentTheme === 'dark';
    applyTheme(currentTheme);

    themeToggle.addEventListener('change', function() {
        const theme = this.checked ? 'dark' : 'light';
        applyTheme(theme);
    });
}

export function initScaleClick(callback) {
    const weightEl = document.getElementById('data-weight');
    const weighttext = document.getElementById('weight-text');
    if (weightEl||weighttext) {
        weightEl.classList.add('cursor-pointer');
        weightEl.addEventListener('click', callback);
        weighttext.addEventListener('click', callback);
    }
}

// Screensaver functionality
let screensaverActive = false;
let screensaverElement = null;

export function initScreensaver() {
    // Create the screensaver element
    screensaverElement = document.createElement('div');
    screensaverElement.id = 'screensaver';
    screensaverElement.style.position = 'fixed';
    screensaverElement.style.top = '0';
    screensaverElement.style.left = '0';
    screensaverElement.style.width = '100vw';
    screensaverElement.style.height = '100vh';
    screensaverElement.style.backgroundImage = 'url("/src/ui/saver-1.jpg")';
    screensaverElement.style.backgroundSize = 'cover';
    screensaverElement.style.backgroundPosition = 'center';
    screensaverElement.style.zIndex = '10000';
    screensaverElement.style.display = 'none';
    screensaverElement.style.justifyContent = 'center';
    screensaverElement.style.alignItems = 'center';

    // Add click/touch event to deactivate screensaver
    screensaverElement.addEventListener('click', deactivateScreensaver);
    screensaverElement.addEventListener('touchstart', deactivateScreensaver);

    document.body.appendChild(screensaverElement);
}

export function activateScreensaver() {
    if (!screensaverElement) {
        console.error('Screensaver element not initialized');
        return;
    }

    screensaverElement.style.display = 'flex';
    screensaverActive = true;
}

export function deactivateScreensaver() {
    if (!screensaverElement) {
        console.error('Screensaver element not initialized');
        return;
    }
    screensaverElement.style.display = 'none';
    screensaverActive = false;
    setMachineState('idle');
}

export function isScreensaverActive() {
    return screensaverActive;
}

export function initUI(callbacks) {
    initThemeToggle();
    initFullscreenHandler();
    initSettingsModal();
    initLanguageSwitcher();
    initScaleClick(callbacks.onWeightClick);
    initScreensaver(); // Initialize screensaver functionality
    const drinkOutValueEl = document.getElementById('drink-out-value');
    const tempValueEl = document.getElementById('temp-value');
    const doseInValueEl = document.getElementById('dose-in-value');
    const grindValueEl = document.getElementById('grind-value');
    const sleepButton = document.getElementById('sleep-button');
    const hotWaterMinusBtn = document.getElementById('hot-water-vol-minus');
    const hotWaterPlusBtn = document.getElementById('hot-water-vol-plus');
    const hotWaterModeToggle = document.getElementById('hot-water-mode-toggle');
    const hotWaterVolValueEl = document.getElementById('hot-water-vol-value');
    const hotWaterTempValueEl = document.getElementById('hot-water-temp-value');
    const tempPresets = document.getElementById('temp-presets');
    const drinkOutPresets = document.getElementById('drink-out-presets');
    const flushPresets = document.getElementById('flush-presets');
    const flushValueEl = document.getElementById('flush-value');
    const hotwaterPresets = document.getElementById('hotwater-presets');
    const steamMinusBtn = document.getElementById('steam-minus');
    const steamPlusBtn = document.getElementById('steam-plus');
    const steamModeToggle = document.getElementById('steam-mode-toggle');
    const steamPresets = document.getElementById('steam-presets');
    const steamFlowPresetsEl = document.getElementById('steam-flow-presets');
    const machineStateEl = document.getElementById('machine-status');
    if (tempPresets) {
        for (const button of tempPresets.children) {
            button.classList.add('no-select');
            const clickCallback = () => {
                const newValue = parseFloat(button.textContent);
                if (isNaN(newValue)) return;

                updateTemperatureValue(newValue);
                updateTemperatureDisplay(newValue);

                // Update preset styles
                for (const btn of tempPresets.children) {
                    btn.classList.remove('text-black');
                    btn.classList.add('text-gray-400');
                }
                button.classList.remove('text-gray-400');
                button.classList.add('text-black');

                flashElement(document.getElementById('temp-value'));
            };

            const longPressCallback = () => {
                const tempValueEl = document.getElementById('temp-value');
                button.textContent = tempValueEl.textContent;
                flashElement(button);
                flashElement(tempValueEl);
            };

            setupPressAndHold(button, clickCallback, longPressCallback);
        }
    }

    if (drinkOutPresets) {
        for (const button of drinkOutPresets.children) {
            button.classList.add('no-select');
            const clickCallback = () => {
                const [doseInStr, drinkOutStr] = button.textContent.split(':');
                const newDoseIn = parseFloat(doseInStr);
                const newDrinkOut = parseFloat(drinkOutStr);

                if (!isNaN(newDoseIn) && !isNaN(newDrinkOut)) {
                    updateDoseAndDrinkOutValue(newDoseIn, newDrinkOut);
                    updateDrinkOutPresetsDisplay(newDoseIn, newDrinkOut);
                    flashElement(document.getElementById('dose-in-value'));
                    flashElement(document.getElementById('drink-out-value'));

                    // Update preset styles
                    for (const btn of drinkOutPresets.children) {
                        btn.classList.remove('text-black');
                        btn.classList.add('text-gray-400');
                    }
                    button.classList.remove('text-gray-400');
                    button.classList.add('text-black');
                }
            };

            const longPressCallback = () => {
                const doseInValue = parseFloat(document.getElementById('dose-in-value').textContent);
                const drinkOutValue = parseFloat(document.getElementById('drink-out-value').textContent);
                button.textContent = `${doseInValue}:${drinkOutValue}`;

                flashElement(button);
                flashElement(document.getElementById('dose-in-value'));
                flashElement(document.getElementById('drink-out-value'));
            };

            setupPressAndHold(button, clickCallback, longPressCallback);
        }
    }

    if (flushPresets) {
        for (const button of flushPresets.children) {
            button.classList.add('no-select');
            const clickCallback = () => {
                const newValue = parseFloat(button.textContent);
                if (isNaN(newValue)) return;

                setDe1Settings({ flushTimeout: newValue }).catch(e => logger.error(e));
                updateFlushDisplay(newValue);

                // Update preset styles
                for (const btn of flushPresets.children) {
                    btn.classList.remove('text-black');
                    btn.classList.add('text-gray-400');
                }
                button.classList.remove('text-gray-400');
                button.classList.add('text-black');
                flashElement(document.getElementById('flush-value'));

            };

            const longPressCallback = () => {
                const flushValueEl = document.getElementById('flush-value');
                button.textContent = flushValueEl.textContent;
                flashElement(button);
                flashElement(flushValueEl);
            };

            setupPressAndHold(button, clickCallback, longPressCallback);
        }
    }

    if (hotwaterPresets) {
        // Initial display update
        updateHotWaterPresetDisplay();

        Array.from(hotwaterPresets.children).forEach((button, index) => {
            button.classList.add('no-select');
            const clickCallback = () => {
                const isTempMode = hotWaterMode === 'temperature';
                const presets = isTempMode ? hotWaterTempPresets : hotWaterVolPresets;
                const newValue = presets[index];

                if (newValue === undefined) return;

                if (isTempMode) {
                    setTargetHotWaterTemp(newValue).catch(e => logger.error(e));
                    updateHotWaterDisplay({ targetHotWaterTemp: newValue });

                    flashElement(document.getElementById('hot-water-temp-value'));

                } else {
                    setTargetHotWaterVolume(newValue).catch(e => logger.error(e));
                    updateHotWaterDisplay({ targetHotWaterVolume: newValue });
                    flashElement(document.getElementById("hot-water-vol-value"));
                }

                // Update preset styles
                for (const btn of hotwaterPresets.children) {
                    btn.classList.remove('text-black');
                    btn.classList.add('text-gray-400');
                }
                button.classList.remove('text-gray-400');
                button.classList.add('text-black');

            };

            const longPressCallback = () => {
                const isTempMode = hotWaterMode === 'temperature';
                const valueEl = document.getElementById(isTempMode ? 'hot-water-temp-value' : 'hot-water-vol-value');
                const currentValue = parseFloat(valueEl.textContent);

                if (!isNaN(currentValue)) {
                    if (isTempMode) {
                        hotWaterTempPresets[index] = currentValue;
                    } else {
                        hotWaterVolPresets[index] = currentValue;
                    }
                    updateHotWaterPresetDisplay(); // Refresh button text
                    flashElement(button);
                    flashElement(valueEl);
                }
            };

            setupPressAndHold(button, clickCallback, longPressCallback);
        });
    }

    if (steamPresets) {
        updateSteamPresetDisplay();

        Array.from(steamPresets.children).forEach((button, index) => {
            button.classList.add('no-select');
            const clickCallback = () => {
                const newValue = steamTimePresets[index];
                if (newValue === undefined) return;

                setTargetSteamDuration(newValue).catch(e => logger.error(e));
                updateSteamDisplay({ targetSteamDuration: newValue });

                for (const btn of steamPresets.children) {
                    btn.classList.remove('text-black');
                    btn.classList.add('text-gray-400');
                }
                button.classList.remove('text-gray-400');
                button.classList.add('text-black');
                flashElement(document.getElementById('steam-duration-value'));

            };

            const longPressCallback = () => {
                const valueEl = document.getElementById('steam-duration-value');
                const currentValue = parseFloat(valueEl.textContent);
                if (!isNaN(currentValue)) {
                    steamTimePresets[index] = currentValue;
                    updateSteamPresetDisplay();
                    flashElement(button);
                    flashElement(valueEl);
                }
            };

            setupPressAndHold(button, clickCallback, longPressCallback);
        });
    }

    if (steamFlowPresetsEl) {
        updateSteamPresetDisplay();

        Array.from(steamFlowPresetsEl.children).forEach((button, index) => {
            button.classList.add('no-select');
            const clickCallback = () => {
                const newValue = steamFlowPresets[index];
                if (newValue === undefined) return;

                setTargetSteamFlow(newValue).catch(e => logger.error(e));
                updateSteamDisplay({ targetSteamFlow: newValue });

                for (const btn of steamFlowPresetsEl.children) {
                    btn.classList.remove('text-black');
                    btn.classList.add('text-gray-400');
                }
                button.classList.remove('text-gray-400');
                button.classList.add('text-black');
                flashElement(document.getElementById('steam-flow-value'));

            };

            const longPressCallback = () => {
                const valueEl = document.getElementById('steam-flow-value');
                const currentValue = parseFloat(valueEl.textContent);
                if (!isNaN(currentValue)) {
                    steamFlowPresets[index] = currentValue;
                    updateSteamPresetDisplay();
                    flashElement(button);
                    flashElement(valueEl);
                }
            };

            setupPressAndHold(button, clickCallback, longPressCallback);
        });
    }

    if (sleepButton) {
        sleepButton.addEventListener('click', async () => {
            const currentState = machineStateEl.textContent.trim();
            if (currentState.toLocaleLowerCase() == 'sleeping') {
                // Wake machine up
                await setMachineState('idle');
                logger.info("current machine state in sleep button:", currentState);
                logger.info('Machine state set to idle.');

                // Deactivate screensaver if it's active
                if (isScreensaverActive()) {
                    deactivateScreensaver();
                }
            } else {
                // Put machine to sleep
                await setMachineState('sleeping');
                logger.info("current machine state in sleep button:", currentState);
                logger.info('Machine state set to sleeping.');

                // Activate screensaver
                if (!isScreensaverActive()) {
                    activateScreensaver();
                }
            }
        });
    }

    if (doseInValueEl) {
        makeEditable(doseInValueEl, (newValue) => {
            let value = newValue;
            if (value > 30) {
                alert('Dose weight is limited to 30g.');
                value = 30;
            }
            if (value < 0) {
                alert('Dose weight must be at least 0g.');
                value = 0;
            }
            doseInValueEl.textContent = `${value}g`;
            updateDoseValue('in', value);
            updateDrinkRatio();
        });
    }

    if (tempValueEl) {
        makeEditable(tempValueEl, (newValue) => {
            let value = Math.round(newValue); // Ensure it's an integer
            if (value > 105) {
                alert('Brew temperature is limited to 105°C.');
                value = 105;
            }
            if (value < 0) {
                alert('Brew temperature must be at least 0°C.');
                value = 0;
            }
            tempValueEl.textContent = `${value}°c`;
            updateTemperatureValue(value);
        });
    }

    if (drinkOutValueEl) {
        makeEditable(drinkOutValueEl, (newValue) => {
            let value = newValue;
            if (value > 2000) {
                alert('Drink weight is limited to 2000g.');
                value = 2000;
            }
            if (value < 0) {
                alert('Drink weight must be at least 0g.');
                value = 0;
            }
            drinkOutValueEl.textContent = `${value}g`;
            updateDoseValue('out', value);
            updateDrinkRatio();
        });
    }

    if (grindValueEl) {
        makeEditable(grindValueEl, (newValue) => {
            let value = newValue;
            if (value > 1000) {
                alert('Grind setting is limited to 1000.');
                value = 1000;
            }
            if (value < 0) {
                alert('Grind setting must be at least 0.');
                value = 0;
            }
            grindValueEl.textContent = value.toFixed(1);
            updateGrindValue(value);
        });
    }

    if (hotWaterVolValueEl) {
        makeEditable(hotWaterVolValueEl, (newValue) => {
            let value = newValue;
            if (value > 255) {
                alert('Hot water volume is limited to 255 ml.');
                value = 255;
            }
            if (value < 3) {
                alert('Hot water volume must be at least 3 ml.');
                value = 3;
            }
            currentHotWaterVolume = value;
            setTargetHotWaterVolume(currentHotWaterVolume).catch(e => logger.error(e));
            updateHotWaterDisplay({ targetHotWaterVolume: currentHotWaterVolume });
        });
    }

    if (hotWaterTempValueEl) {
        makeEditable(hotWaterTempValueEl, (newValue) => {
            let value = newValue;
            if (value > 100) {
                alert('Hot water temperature is limited to 100°C.');
                value = 100;
            }
            if (value < 0) {
                alert('Hot water temperature must be at least 0°C.');
                value = 0;
            }
            currentHotWaterTemp = value;
            setTargetHotWaterTemp(currentHotWaterTemp).catch(e => logger.error(e));
            updateHotWaterDisplay({ targetHotWaterTemp: currentHotWaterTemp });
        });
    }

    if (flushValueEl) {
        makeEditable(flushValueEl, (newValue) => {

            if (newValue > 255) {
                alert('Flush time is limited to 255s.');
                newValue = 255;
            }
            if (newValue < 3) {
                alert('Flush time must be at least 3s.');
                newValue = 3;
            }
            flushValueEl.textContent = `${newValue}s`;
            setDe1Settings({ flushTimeout: newValue }).catch(e => logger.error(e));
            updateFlushDisplay(newValue);
        });
    }

    const steamDurationValueEl = document.getElementById('steam-duration-value');
    if (steamDurationValueEl) {
        makeEditable(steamDurationValueEl, (newValue) => {
            let value = newValue;
            if (value > 255) {
                alert('Steam time is limited to 255s.');
                value = 255;
            }
            if (value < 0) {
                alert('Steam time must be at least 0s.');
                value = 0;
            }
            currentSteamDuration = value;
            setTargetSteamDuration(currentSteamDuration).catch(e => logger.error(e));
            updateSteamDisplay({ targetSteamDuration: currentSteamDuration });
        });
    }

    const steamFlowValueEl = document.getElementById('steam-flow-value');
    if (steamFlowValueEl) {
        makeEditable(steamFlowValueEl, (newValue) => {
            let value = newValue;
            if (value > 2.5) {
                alert('Steam flow is limited to 2.5 ml/s.');
                value = 2.5;
            }
            if (value < 0.4) {
                alert('Steam flow must be at least 0.4 ml/s.');
                value = 0.4;
            }
            currentSteamFlow = value;
            setTargetSteamFlow(currentSteamFlow).catch(e => logger.error(e));
            updateSteamDisplay({ targetSteamFlow: currentSteamFlow });
        });
    }

    setupValueAdjuster('drink-out-minus', 'drink-out-plus', 'drink-out-value', 1, 0, (val) => `${val}g`, (val) => { updateDoseValue('out', val); updateDrinkRatio(); });
    setupValueAdjuster('temp-minus', 'temp-plus', 'temp-value', 1, 0, (val) => `${val}°c`, updateTemperatureValue);
    setupValueAdjuster('dose-in-minus', 'dose-in-plus', 'dose-in-value', 1, 0, (val) => `${val}g`, (val) => { updateDoseValue('in', val); updateDrinkRatio(); });
    setupValueAdjuster('grind-minus', 'grind-plus', 'grind-value', 0.1, 0, (val) => val.toFixed(1), updateGrindValue);
    setupValueAdjuster('flush-minus', 'flush-plus', 'flush-value', 1, 0, (val) => `${val}s`, (val) => { setDe1Settings({ flushTimeout: val }).catch(e => logger.error(e)); updateFlushDisplay(val); });

    if (hotWaterMinusBtn) {
        hotWaterMinusBtn.addEventListener('click', decrementHotWater);
    }

    if (hotWaterPlusBtn) {
        hotWaterPlusBtn.addEventListener('click', incrementHotWater);
    }

    if (hotWaterModeToggle) {
        hotWaterModeToggle.addEventListener('click', toggleHotWaterMode);
    }

    if (steamMinusBtn) {
        steamMinusBtn.addEventListener('click', decrementSteam);
    }

    if (steamPlusBtn) {
        steamPlusBtn.addEventListener('click', incrementSteam);
    }

    if (steamModeToggle) {
        steamModeToggle.addEventListener('click', toggleSteamMode);
    }

    updateDrinkRatio(); // Initial calculation
}

export function updateSleepButton(state) {
    const sleepButton = document.getElementById('sleep-button');
    if (sleepButton) {
        if (state === 'sleeping') {
            sleepButton.textContent = getTranslation('Awake');
            sleepButton.setAttribute('data-i18n-key', 'awake');
        } else {
            sleepButton.textContent = getTranslation('Sleep');
            sleepButton.setAttribute('data-i18n-key', 'Sleep');
        }
    }
}

export function updateMachineStatus(status) {
    logger.debug(`Updating machine status to: ${status}`);
    const machineStatusEl = document.getElementById('machine-status');
    if (machineStatusEl) {
        machineStatusEl.textContent = status;

        // Set color based on status
        if (status === "Disconnected" || status === "Error" || status.startsWith('Heating')) {
            machineStatusEl.classList.remove('text-[var(--green)]');
            machineStatusEl.classList.add('text-red-500');
        } else {
            if (status === "Idle"){
                machineStatusEl.textContent = "Ready";
            }
            machineStatusEl.classList.remove('text-red-500');
            machineStatusEl.classList.add('text-[var(--green)]');
        }
    }
}
export function updateTemperatures({ mix, group, steam }) {
    const mixTempEl = document.getElementById('data-mix-temp');
    const groupTempEl = document.getElementById('data-group-temp');
    const steamTempEl = document.getElementById('data-steam-temp');

    if (mixTempEl) {
        mixTempEl.textContent = `${mix.toFixed(1)}°c`;
    }
    if (groupTempEl) {
        groupTempEl.textContent = `${group.toFixed(1)}°c`;
    }
    if (steamTempEl) {
        steamTempEl.textContent = `${steam.toFixed(0)}°c`;
    }
}

export function updateWeight(weight, classUpdates = {}) {
    const { dataWeight, weightText } = classUpdates;
    const weightEl = document.getElementById('data-weight');
    const weightTextEl = document.getElementById('weight-text');

    if (weightEl) {
        if (typeof weight === 'number' && !isNaN(weight)) {
            weightEl.textContent = ` ${weight.toFixed(1)}g`;
        } else {
            weightEl.textContent = weight;
        }

        if (dataWeight) {
            if (dataWeight.add) {
                weightEl.classList.add(...dataWeight.add);
            }
            if (dataWeight.remove) {
                weightEl.classList.remove(...dataWeight.remove);
            }
        }
    }

    if (weightTextEl) {
        if (weightText) {
            if (weightText.add) {
                weightTextEl.classList.add(...weightText.add);
            }
            if (weightText.remove) {
                weightTextEl.classList.remove(...weightText.remove);
            }
        }
    }
}

export function updateProfileName(name) {
    logger.debug(`Updating profile name to: ${name}`);
    const profileNameEl = document.getElementById('profile-name');
    if (profileNameEl) {
        profileNameEl.firstChild.textContent = name;
    }
}

export function updateDrinkOut(doseOut) {
    logger.debug(`Updating drink out to: ${doseOut}g`);
    const drinkOutValueEl = document.getElementById('drink-out-value');
    if (drinkOutValueEl) {
        drinkOutValueEl.textContent = `${doseOut}g`;
    }
}

export function updateTemperatureDisplay(temperature) {
    const tempValueEl = document.getElementById('temp-value');
    if (tempValueEl) {
        tempValueEl.textContent = `${parseFloat(temperature).toFixed(0)}°c`;
    }
}

export function updateFlushDisplay(duration) {
    const flushValueEl = document.getElementById('flush-value');
    if (flushValueEl) {
        flushValueEl.textContent = `${parseFloat(duration).toFixed(0)}s`;
    }
}

export function updateGrindDisplay(grinderData) {
    const grindValueEl = document.getElementById('grind-value');
    if (grindValueEl && grinderData && grinderData.setting) {
        grindValueEl.textContent = parseFloat(grinderData.setting).toFixed(1);
    }
}

export function updateDoseInDisplay(doseInValue) {
    const doseInValueEl = document.getElementById('dose-in-value');
    if (doseInValueEl && doseInValue) {
        doseInValueEl.textContent = `${doseInValue}g`;
    }
}

// --- Fullscreen Handling ---

function toggleFullScreen() {
    const doc = window.document;
    const docEl = doc.documentElement;

    const requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;
    const cancelFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen;

    // Check if fullscreen is active using vendor-prefixed properties
    const isFullScreen = doc.fullscreenElement || doc.mozFullScreenElement || doc.webkitFullscreenElement || doc.msFullscreenElement;

    if (!isFullScreen) {
        if (requestFullScreen) {
            requestFullScreen.call(docEl).catch(err => {
                logger.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            });
        }
    } else {
        if (cancelFullScreen) {
            cancelFullScreen.call(doc).catch(err => {
                logger.error(`Error attempting to exit full-screen mode: ${err.message} (${err.name})`);
            });
        }
    }
}

export function updateFullscreenState() {
    const isFullScreen = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;

    const enterIcon = document.querySelector('#fullscreen-toggle-btn .enter-fullscreen-icon');
    const exitIcon = document.querySelector('#fullscreen-toggle-btn .exit-fullscreen-icon');

    if (!enterIcon || !exitIcon) {
        return; // Exit if icons aren't found
    }

    if (isFullScreen) {
        document.body.setAttribute('fullscreen', '');
        enterIcon.style.display = 'none';
        exitIcon.style.display = 'block';
    } else {
        document.body.removeAttribute('fullscreen');
        enterIcon.style.display = 'block';
        exitIcon.style.display = 'none';
    }
}

export function initFullscreenHandler() {
    const fullscreenButton = document.getElementById('fullscreen-toggle-btn'); // Assuming a button with this ID exists

    if (fullscreenButton) {
        const fsEnabled = document.fullscreenEnabled || document.webkitFullscreenEnabled || document.mozFullScreenEnabled || document.msFullscreenEnabled;

        if (fsEnabled) {
            fullscreenButton.addEventListener('click', toggleFullScreen);

            document.addEventListener('fullscreenchange', updateFullscreenState);
            document.addEventListener('webkitfullscreenchange', updateFullscreenState);
            document.addEventListener('mozfullscreenchange', updateFullscreenState);
            document.addEventListener('MSFullscreenChange', updateFullscreenState);

            updateFullscreenState(); // Set initial state
        } else {
            fullscreenButton.style.display = 'none'; // Hide button if not supported
        }
    } else {
        logger.warn('Fullscreen toggle button with id "fullscreen-toggle-btn" not found.');
    }
}

function initSettingsModal() {
    const settingsModal = document.getElementById('settings_modal');
    const settingsBtn = document.getElementById('settings-btn');
    const saveSettingsBtn = document.getElementById('save-settings-btn');
    const visualizerUsernameEl = document.getElementById('visualizer-username');
    const visualizerPasswordEl = document.getElementById('visualizer-password');
    const visualizerAutoUploadEl = document.getElementById('visualizer-auto-upload');
    const visualizerStatusEl = document.getElementById('visualizer-status');
    const reaHostnameInput = document.getElementById('rea-hostname-input');
    const saveReaHostnameBtn = document.getElementById('save-rea-hostname-btn');
    const pluginId = 'visualizer.reaplugin';

    // When the modal is opened, load the latest settings
    if (settingsBtn) {
        settingsBtn.addEventListener('click', async () => {
            if (settingsModal) {
                // 1. Populate hostname
                if (reaHostnameInput) {
                    reaHostnameInput.value = reaHostname;
                }

                // 2. Load and populate plugin settings
                try {
                    const savedSettings = await getPluginSettings(pluginId);
                    if (savedSettings && savedSettings.Username) {
                        visualizerUsernameEl.value = savedSettings.Username;
                    } else {
                        visualizerUsernameEl.value = '';
                    }
                    visualizerPasswordEl.value = ''; // Always clear password field
                    visualizerStatusEl.textContent = ''; // Clear status
                } catch (error) {
                    logger.error(`Failed to load settings for ${pluginId}:`, error);
                    visualizerStatusEl.textContent = 'Could not load plugin settings.';
                    visualizerStatusEl.className = 'text-red-500';
                }

                // 3. Load UI-only settings from localStorage
                const autoUpload = localStorage.getItem('visualizerAutoUpload');
                if (visualizerAutoUploadEl) {
                    visualizerAutoUploadEl.checked = autoUpload === 'true';
                }

                settingsModal.showModal();
            }
        });
    }

    // Handle saving the REA hostname
    if (saveReaHostnameBtn) {
        saveReaHostnameBtn.addEventListener('click', () => {
            if (reaHostnameInput) {
                const newHostname = reaHostnameInput.value.trim();
                if (newHostname) {
                    localStorage.setItem('reaHostname', newHostname);
                    alert('Hostname saved. The page will now reload.');
                    location.reload();
                } else {
                    localStorage.removeItem('reaHostname');
                    alert('Hostname cleared. The page will now reload to use the default address.');
                    location.reload();
                }
            }
        });
    }

    // Handle saving all other settings
    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', async () => {
            const username = visualizerUsernameEl.value.trim();
            const password = visualizerPasswordEl.value; // Don't trim password

            if (!username || !password) {
                visualizerStatusEl.textContent = 'Username and Password are required.';
                visualizerStatusEl.className = 'text-red-500';
                return;
            }

            visualizerStatusEl.textContent = 'Testing credentials...';
            visualizerStatusEl.className = 'text-gray-500';

            const isValid = await verifyVisualizerCredentials(username, password);

            if (!isValid) {
                visualizerStatusEl.textContent = 'Invalid Visualizer credentials.';
                visualizerStatusEl.className = 'text-red-500';
                // Clear any previously saved (and now invalid) credentials
                localStorage.removeItem('visualizerUsername');
                localStorage.removeItem('visualizerPassword');
                return; // Stop here if credentials are bad
            }

            visualizerStatusEl.textContent = 'Visualizer credentials valid.';
            visualizerStatusEl.className = 'text-green-500';

            // On success, save to localStorage for future auto-login
            localStorage.setItem('visualizerUsername', username);
            localStorage.setItem('visualizerPassword', btoa(password)); // Basic obfuscation

            // If credentials are valid, proceed to save to plugin
            const autoUpload = visualizerAutoUploadEl.checked;

            // 1. Save UI-only settings to localStorage
            localStorage.setItem('visualizerAutoUpload', autoUpload);

            // 2. Prepare and save plugin settings
            const settingsPayload = {
                Username: username,
                Password: password, // Send the actual password to the plugin
                AutoUpload: autoUpload,
                LengthThreshold: parseInt(document.getElementById('visualizer-min-duration').value, 10) || 5,
            };

            try {
                await setPluginSettings(pluginId, settingsPayload);
                visualizerStatusEl.textContent = 'Credentials saved successfully!';
                visualizerStatusEl.className = 'text-green-500';

                // Hide status after a few seconds
                setTimeout(() => {
                    visualizerStatusEl.textContent = '';
                }, 3000);

            } catch (error) {
                logger.error('Failed to save visualizer plugin settings:', error);
                visualizerStatusEl.textContent = `Failed to save to REA plugin: ${error.message}.`;
                visualizerStatusEl.className = 'text-red-500';
            }
        });
    }
}


export function showToast(message, duration = 2400, type = 'info') {
    const toastEl = document.getElementById('app-toast');
    const messageEl = document.getElementById('app-toast-message');
    if (toastEl && messageEl) {
        messageEl.textContent = message;

        const alertEl = toastEl.querySelector('.alert');
        if (alertEl) {
            alertEl.classList.remove('alert-info', 'alert-success', 'alert-error');
            alertEl.classList.add(`alert-${type}`);
        }

        toastEl.style.display = 'grid';

        if (duration > 0) {
            setTimeout(() => {
                hideToast();
            }, duration);
        }
    } else {
        logger.warn('App toast element not found.');
    }
}

export function hideToast() {

    const toastEl = document.getElementById('app-toast');

    if (toastEl) {

        toastEl.style.display = 'none';

    }

}



export function initResizablePanels(separatorId) {
    const separator = document.getElementById(separatorId);
    if (!separator) {
        logger.warn(`Separator with id #${separatorId} not found.`);
        return;
    }

    const container = separator.parentElement;
    if (!container) {
        logger.warn('Separator has no parent container.');
        return;
    }

    const leftPanel = separator.previousElementSibling;
    if (!leftPanel) {
        logger.warn('Left panel not found for separator.');
        return;
    }

    let isDragging = false;
    let initialX = 0;
    let initialLeftWidth = 0;

    const startDrag = (e) => {
        isDragging = true;

        const clientX = e.clientX || e.touches[0].clientX;
        initialX = clientX;

        initialLeftWidth = leftPanel.offsetWidth;

        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';

        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', stopDrag);

        document.addEventListener('touchmove', drag, { passive: false });
        document.addEventListener('touchend', stopDrag);
    };

    const drag = (e) => {
        if (!isDragging) return;

        if (e.type === 'touchmove') {
            e.preventDefault();
        }

        requestAnimationFrame(() => {
            const clientX = e.clientX || e.touches[0].clientX;
            const deltaX = clientX - initialX;
            let newLeftWidth = initialLeftWidth + deltaX;

            const containerRect = container.getBoundingClientRect();
            // Calculate minimum width to ensure right panel has enough space for buttons
            const minRightPanelWidth = 300; // Minimum width needed for buttons in right panel
            const minWidth = containerRect.width * 0.2;
            const maxWidth = containerRect.width - minRightPanelWidth;

            if (newLeftWidth < minWidth) newLeftWidth = minWidth;
            if (newLeftWidth > maxWidth) newLeftWidth = maxWidth;

            container.style.gridTemplateColumns = `${newLeftWidth}px auto minmax(${minRightPanelWidth}px, 1fr)`;
        });
    };

    const stopDrag = () => {
        isDragging = false;

        document.body.style.cursor = '';
        document.body.style.userSelect = '';

        document.removeEventListener('mousemove', drag);
        document.removeEventListener('mouseup', stopDrag);

        document.removeEventListener('touchmove', drag);
        document.removeEventListener('touchend', stopDrag);
    };

    separator.addEventListener('mousedown', startDrag);
    separator.addEventListener('touchstart', startDrag);
}