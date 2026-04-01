export const browserRuntimeSource = `
(function () {
  const browserBootstrap = window.__SETTINGS_BOOTSTRAP__ || {};
  const settingsTree = browserBootstrap.settingsTree || {};
  const apiBaseUrl = browserBootstrap.apiBaseUrl || 'http://localhost:8080/api/v1';
  const WS_PROTOCOL = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const REA_HOSTNAME = localStorage.getItem('reaHostname') || window.location.hostname;
  const REA_PORT = 8080;
  let deviceWebSocket = null;
  let deviceStateCache = { devices: [], scanning: false, initialized: false };

  function showToast(message, isError) {
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
      case 'ble_machine': return 'Bluetooth Machine';
      case 'ble_scale': return 'Bluetooth Scale';
      case 'appearance': return 'Appearance Settings';
      case 'language': return 'Language Settings';
      case 'help': return 'User Manual';
      default: return 'Settings';
    }
  }

  function getDefaultSubcategoryLocal(categoryKey) {
    return settingsTree?.[categoryKey]?.subcategories?.[0]?.settingsCategory || null;
  }

  function activateButtons(selector, button) {
    document.querySelectorAll(selector).forEach((btn) => btn.classList.remove('active'));
    if (button) button.classList.add('active');
  }

  function renderMainCategories(selectedKey) {
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

  function renderSubcategories(categoryKey, selectedCategory) {
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
    if (activeCategory) renderActiveCategory(activeCategory, panel.querySelector('.subcategory-btn.active')?.dataset?.label || getCategoryTitleLocal(activeCategory));
  }

  function initDeviceWebSocket() {
    if (deviceWebSocket && (deviceWebSocket.readyState === WebSocket.OPEN || deviceWebSocket.readyState === WebSocket.CONNECTING)) return;
    deviceWebSocket = new WebSocket(WS_PROTOCOL + '//' + REA_HOSTNAME + ':' + REA_PORT + '/ws/v1/devices');
    deviceWebSocket.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data);
        deviceStateCache.devices = Array.isArray(data.devices) ? data.devices : [];
        deviceStateCache.foundMachines = Array.isArray(data.foundMachines) ? data.foundMachines : null;
        deviceStateCache.foundScales = Array.isArray(data.foundScales) ? data.foundScales : null;
        deviceStateCache.scanning = !!data.scanning;
        deviceStateCache.initialized = true;
        renderBluetoothLists();
      } catch (error) {
        console.error('Error parsing Device WebSocket message:', error);
      }
    });
    deviceWebSocket.addEventListener('close', () => { deviceWebSocket = null; }, { once: true });
  }

  function sendDeviceCommand(command) {
    initDeviceWebSocket();
    if (!deviceWebSocket || deviceWebSocket.readyState !== WebSocket.OPEN) {
      if (deviceWebSocket && deviceWebSocket.readyState === WebSocket.CONNECTING) {
        deviceWebSocket.addEventListener('open', () => {
          try { deviceWebSocket.send(JSON.stringify(command)); } catch (error) { console.error('Error sending device command:', error); }
        }, { once: true });
        return;
      }
      throw new Error('Device WebSocket is not connected. Cannot send command.');
    }
    deviceWebSocket.send(JSON.stringify(command));
  }

  function getBluetoothDevicesByType() {
    const explicitMachines = Array.isArray(deviceStateCache.foundMachines) ? deviceStateCache.foundMachines : null;
    const explicitScales = Array.isArray(deviceStateCache.foundScales) ? deviceStateCache.foundScales : null;
    if (explicitMachines || explicitScales) return { machines: explicitMachines || [], scales: explicitScales || [] };
    const devices = Array.isArray(deviceStateCache.devices) ? deviceStateCache.devices : [];
    return {
      machines: devices.filter((device) => device && device.type === 'machine'),
      scales: devices.filter((device) => device && device.type === 'scale')
    };
  }

  function renderSingleDeviceList(devices) {
    if (!Array.isArray(devices) || devices.length === 0) return '';
    return devices.map((device) => {
      if (!device || !device.name) return '';
      const isConnected = device.state === 'connected';
      const buttonText = isConnected ? 'Disconnect' : 'Connect';
      const buttonAction = isConnected ? 'disconnect' : 'connect';
      return '<div class="device-card">' +
        '<div class="device-info">' +
          '<div class="device-header"><div class="device-name">' + device.name + '</div></div>' +
          '<div class="device-detail">ID: ' + (device.id || 'N/A') + '</div>' +
          '<div class="device-detail">Status: ' + (device.state || 'unknown') + '</div>' +
          '<div class="device-detail">Type: ' + (device.type || 'unknown') + '</div>' +
        '</div>' +
        '<button class="btn-connect" data-device-id="' + device.id + '" data-device-action="' + buttonAction + '">' + buttonText + '</button>' +
      '</div>';
    }).join('');
  }

  function renderDeviceList(containerId, devices, type) {
    const container = document.getElementById(containerId);
    if (!container) return;
    if (deviceStateCache.scanning) {
      container.innerHTML = '<p class="setting-description">Scanning for ' + type.toLowerCase() + ' devices...</p>';
      return;
    }
    if (devices.length > 0) {
      container.innerHTML = renderSingleDeviceList(devices);
      return;
    }
    if (!deviceStateCache.initialized) {
      container.innerHTML = '<p class="setting-description">No device data yet. Press Scan to search for nearby devices.</p>';
      return;
    }
    container.innerHTML = '<p class="setting-description">No ' + type.toLowerCase() + ' devices found.</p>';
  }

  function renderBluetoothLists() {
    const { machines, scales } = getBluetoothDevicesByType();
    renderDeviceList('bluetooth-machine-devices-container', machines, 'Machine');
    renderDeviceList('bluetooth-scale-devices-container', scales, 'Scale');
  }

  function renderActiveCategory(category, displayName) {
    const contentArea = document.getElementById('settings-content-area');
    if (!contentArea) return;
    browserBootstrap.activeSettingsCategory = category;
    const templateMap = {
      presence: 'presence-template',
      brightness: 'brightness-template',
      wakelock: 'wakelock-template',
      flowmultiplier: 'flowmultiplier-template',
      rea: 'rea-template',
      steam: 'steam-template',
      hotwater: 'hotwater-template',
      watertank: 'watertank-template',
      flush: 'flush-template',
      fanthreshold: 'fanthreshold-template',
      usbchargermode: 'usbchargermode-template',
      ble_machine: 'ble_machine-template',
      ble_scale: 'ble_scale-template',
      calibration: 'calibration-template',
      refillkit: 'calibration-template',
      voltage: 'calibration-template',
      fan: 'calibration-template',
      stopatweight: 'calibration-template',
      slowstart: 'calibration-template',
      maintenance: 'maintenance-template',
      transportmode: 'maintenance-template',
      de1advanced: 'de1advanced-template',
      updates: 'updates-template',
      firmwareupdate: 'updates-template',
      appupdate: 'updates-template',
      help: 'help-template',
      onlinehelp: 'help-template',
      tutorials: 'help-template',
      appearance: 'appearance-template',
      language: 'language-template',
      extensions: 'visualizer-template'
    };
    const templateId = templateMap[category];
    if (templateId) {
      contentArea.innerHTML = document.getElementById(templateId)?.innerHTML || '';
      if (category === 'extensions') setupVisualizerEventListeners();
      if (category === 'ble_machine' || category === 'ble_scale') {
        initDeviceWebSocket();
        renderBluetoothLists();
      }
      return;
    }
    contentArea.innerHTML = '<div class="settings-flex-container"><div class="settings-page-title"><p>' + (displayName || getCategoryTitleLocal(category)) + '</p></div><div class="settings-divider"><hr /></div><div class="setting-description"><p>Source migration placeholder for ' + (displayName || getCategoryTitleLocal(category)) + '.</p></div></div>';
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
    document.addEventListener('click', (event) => {
      const button = event.target.closest('.btn-connect');
      if (!button) return;
      const { deviceId, deviceAction } = button.dataset;
      if (!deviceId || !deviceAction) return;
      window.handleDeviceConnection(deviceId, deviceAction);
    });
  }

  function handleSearchInput(value) {
    const searchTerm = value.toLowerCase().trim();
    if (!searchTerm) {
      renderMainCategories(browserBootstrap.activeMainCategoryKey || 'extensions');
      renderSubcategories(browserBootstrap.activeMainCategoryKey || 'extensions', browserBootstrap.activeSettingsCategory || null);
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
      formContainer: document.getElementById('visualizer-form-container')
    };
  }

  function setVisualizerFormVisibility(enabledSelect, formContainer) {
    if (!enabledSelect || !formContainer) return;
    formContainer.style.display = enabledSelect.value === 'false' ? 'none' : 'block';
  }

  async function verifyVisualizerCredentialsLocal(username, password) {
    const response = await fetch(apiBaseUrl + '/plugins/visualizer.reaplugin/verifyCredentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    try {
      return await response.json();
    } catch {
      const errorText = await response.text();
      throw new Error(errorText || 'Invalid response format');
    }
  }

  async function saveVisualizerSettingsLocal(settingsPayload) {
    const response = await fetch(apiBaseUrl + '/plugins/visualizer.reaplugin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settingsPayload)
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
    const response = await fetch(apiBaseUrl + '/plugins/visualizer.reaplugin/settings');
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
    if (autoUploadCheckbox && savedSettings && typeof savedSettings.AutoUpload !== 'undefined') autoUploadCheckbox.checked = !!savedSettings.AutoUpload;
    if (minDurationInput && savedSettings && typeof savedSettings.Length !== 'undefined') minDurationInput.value = parseInt(savedSettings.Length, 10) || 5;
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
          LengthThreshold: parseInt(minDurationInput.value, 10) || 5
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
      checkedDayCheckboxes: document.querySelectorAll('#add-schedule-modal input[type="checkbox"]:checked')
    };
  }

  function getPresenceActiveHourModalElements() {
    return {
      dialog: document.getElementById('add-active-hour-modal'),
      startInput: document.getElementById('active-hour-start-input'),
      endInput: document.getElementById('active-hour-end-input'),
      dayCheckboxes: document.querySelectorAll('#add-active-hour-modal input[type="checkbox"]'),
      checkedDayCheckboxes: document.querySelectorAll('#add-active-hour-modal input[type="checkbox"]:checked')
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
      if (!timeInput) throw new Error('Please select a time');
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
      if (!startTime || !endTime) throw new Error('Please select start and end times');
      if (startTime === endTime) throw new Error('Start and end times must be different');
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

  window.handleBrightnessChange = function(value) {
    const slider = document.getElementById('brightness-slider');
    if (slider) slider.value = value;
    showToast('Brightness updated to ' + value);
  };

  window.handleWakeLockToggle = function(enabled) {
    const toggle = document.getElementById('wake-lock-toggle');
    if (toggle) toggle.checked = enabled;
    showToast('Wake lock ' + (enabled ? 'enabled' : 'disabled'));
  };

  async function postJson(path, payload) {
    const response = await fetch(apiBaseUrl + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || ('Request failed: ' + response.status));
    }
    return response.json().catch(() => ({}));
  }

  window.handleReaSettingSave = async function(key, value) {
    try {
      const payload = {};
      payload[key] = value;
      await postJson('/settings', payload);
      browserBootstrap.reaSettings = browserBootstrap.reaSettings || {};
      browserBootstrap.reaSettings[key] = value;
      showToast('REA setting saved: ' + key);
    } catch (error) {
      console.error('Error saving REA setting:', error);
      showToast('Failed to save REA setting: ' + error.message, true);
    }
  };

  window.handleMachineSettingSave = async function(key, value) {
    try {
      const payload = {};
      payload[key] = value;
      await postJson('/machine/settings', payload);
      browserBootstrap.de1Settings = browserBootstrap.de1Settings || {};
      browserBootstrap.de1Settings[key] = value;
      showToast('Machine setting saved: ' + key);
    } catch (error) {
      console.error('Error saving machine setting:', error);
      showToast('Failed to save machine setting: ' + error.message, true);
    }
  };

  window.handleCalibrationSettingSave = async function(key, value) {
    try {
      const payload = {};
      payload[key] = value;
      await postJson('/machine/calibration', payload);
      browserBootstrap.calibrationSettings = browserBootstrap.calibrationSettings || {};
      browserBootstrap.calibrationSettings[key] = value;
      showToast('Calibration setting saved: ' + key);
    } catch (error) {
      console.error('Error saving calibration setting:', error);
      showToast('Failed to save calibration setting: ' + error.message, true);
    }
  };

  window.handleAdvancedSettingSave = async function(key, value) {
    try {
      const payload = {};
      payload[key] = value;
      await postJson('/machine/settings/advanced', payload);
      browserBootstrap.de1AdvancedSettings = browserBootstrap.de1AdvancedSettings || {};
      browserBootstrap.de1AdvancedSettings[key] = value;
      showToast('Advanced setting saved: ' + key);
    } catch (error) {
      console.error('Error saving advanced setting:', error);
      showToast('Failed to save advanced setting: ' + error.message, true);
    }
  };

  window.handleMaintenanceAction = function(action) {
    showToast('Maintenance action: ' + action);
  };

  window.handleStaticAction = function(action) {
    showToast('Action: ' + action);
  };

  window.handleScanDevices = function(label) {
    try {
      initDeviceWebSocket();
      deviceStateCache.scanning = true;
      renderBluetoothLists();
      showToast('Scanning for ' + label.toLowerCase() + '...');
      sendDeviceCommand({ command: 'scan' });
    } catch (error) {
      console.error('Error scanning devices:', error);
      deviceStateCache.scanning = false;
      renderBluetoothLists();
      showToast('Failed to start scan: ' + error.message, true);
    }
  };

  window.handleDeviceConnection = function(deviceId, action) {
    try {
      sendDeviceCommand({ command: action, deviceId });
      showToast((action === 'connect' ? 'Connecting to ' : 'Disconnecting from ') + deviceId);
    } catch (error) {
      console.error('Error handling device connection:', error);
      showToast('Failed to ' + action + ': ' + error.message, true);
    }
  };

  document.addEventListener('DOMContentLoaded', async function() {
    const searchInput = document.getElementById('settings-search');
    if (searchInput) searchInput.addEventListener('input', (e) => handleSearchInput(e.target.value));
    attachNavigationHandlers();
    renderMainCategories(browserBootstrap.activeMainCategoryKey || 'extensions');
    renderSubcategories(browserBootstrap.activeMainCategoryKey || 'extensions', browserBootstrap.activeSettingsCategory || null);
    await setupVisualizerEventListeners();
  });

  console.log('settings plugin source page loaded', browserBootstrap);
})();
`;
