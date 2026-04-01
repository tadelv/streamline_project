export function renderSteamSection(settings = {}) {
  return `
    <div class="settings-flex-container">
      <div class="settings-page-title"><p>Steam Settings</p></div>
      <div class="settings-divider"><hr /></div>
      <div class="settings-section-flex">
        <div class="setting-row-flex">
          <div class="setting-label-bold"><p id="steam-temperature-label">Steam Temperature</p></div>
          <div class="setting-control-flex">
            <input type="number" id="steamTemperatureInput" class="settings-input-primary" value="${settings.steamTemperature !== undefined ? settings.steamTemperature : 145}" step="1" min="100" max="180">
            <button class="settings-btn-primary" onclick="handleMachineSettingSave('steamTemperature', document.getElementById('steamTemperatureInput').value)">Save</button>
          </div>
        </div>
        <p class="setting-description">Set the target steam temperature.</p>
      </div>
    </div>
  `;
}

export function renderHotWaterSection(settings = {}) {
  return `
    <div class="settings-flex-container">
      <div class="settings-page-title"><p>Hot Water Settings</p></div>
      <div class="settings-divider"><hr /></div>
      <div class="settings-section-flex">
        <div class="setting-row-flex">
          <div class="setting-label-bold"><p id="hot-water-temp-label">Hot Water Temperature</p></div>
          <div class="setting-control-flex">
            <input type="number" id="hotWaterTemperatureInput" class="settings-input-primary" value="${settings.hotWaterTemperature !== undefined ? settings.hotWaterTemperature : 90}" step="1" min="20" max="100">
            <button class="settings-btn-primary" onclick="handleMachineSettingSave('hotWaterTemperature', document.getElementById('hotWaterTemperatureInput').value)">Save</button>
          </div>
        </div>
        <p class="setting-description">Set the target hot water temperature.</p>
      </div>
    </div>
  `;
}

export function renderWaterTankSection(settings = {}) {
  return `
    <div class="settings-flex-container">
      <div class="settings-page-title"><p>Water Tank Settings</p></div>
      <div class="settings-divider"><hr /></div>
      <div class="settings-section-flex">
        <div class="setting-row-flex">
          <div class="setting-label-bold"><p id="tank-threshold-label">Low Water Threshold</p></div>
          <div class="setting-control-flex">
            <input type="number" id="waterTankThresholdInput" class="settings-input-primary" value="${settings.waterTankThreshold !== undefined ? settings.waterTankThreshold : 20}" step="1" min="0" max="100">
            <button class="settings-btn-primary" onclick="handleMachineSettingSave('waterTankThreshold', document.getElementById('waterTankThresholdInput').value)">Save</button>
          </div>
        </div>
        <p class="setting-description">Alert threshold for low water level.</p>
      </div>
    </div>
  `;
}

export function renderFlushSection(settings = {}) {
  return `
    <div class="settings-flex-container">
      <div class="settings-page-title"><p>Flush Settings</p></div>
      <div class="settings-divider"><hr /></div>
      <div class="settings-section-flex">
        <div class="setting-row-flex">
          <div class="setting-label-bold"><p id="flush-time-label">Flush Time</p></div>
          <div class="setting-control-flex">
            <input type="number" id="flushTimeInput" class="settings-input-primary" value="${settings.flushTime !== undefined ? settings.flushTime : 3}" step="0.5" min="0" max="20">
            <button class="settings-btn-primary" onclick="handleMachineSettingSave('flushTime', document.getElementById('flushTimeInput').value)">Save</button>
          </div>
        </div>
        <p class="setting-description">Duration of automatic flush cycle.</p>
      </div>
    </div>
  `;
}

export function renderFanThresholdSection(settings = {}) {
  return `
    <div class="settings-flex-container">
      <div class="settings-page-title"><p>Fan Threshold Settings</p></div>
      <div class="settings-divider"><hr /></div>
      <div class="settings-section-flex">
        <div class="setting-row-flex">
          <div class="setting-label-bold"><p id="fan-threshold-label">Fan Threshold</p></div>
          <div class="setting-control-flex">
            <input type="number" id="fanThresholdInput" class="settings-input-primary" value="${settings.fanThreshold !== undefined ? settings.fanThreshold : 60}" step="1" min="0" max="100">
            <button class="settings-btn-primary" onclick="handleMachineSettingSave('fanThreshold', document.getElementById('fanThresholdInput').value)">Save</button>
          </div>
        </div>
        <p class="setting-description">Threshold for activating the fan.</p>
      </div>
    </div>
  `;
}

export function renderUsbChargerModeSection(settings = {}) {
  return `
    <div class="settings-flex-container">
      <div class="settings-page-title"><p>USB Charger Mode Settings</p></div>
      <div class="settings-divider"><hr /></div>
      <div class="settings-section-flex">
        <div class="setting-row-flex">
          <div class="setting-label-bold"><p id="usb-charger-mode-label">USB Charger Mode</p></div>
          <div class="setting-control-flex">
            <select id="usbChargerModeSelect" class="settings-input-wide" onchange="handleMachineSettingSave('usbChargerMode', this.value)">
              <option value="off" ${settings.usbChargerMode === 'off' ? 'selected' : ''}>Off</option>
              <option value="auto" ${settings.usbChargerMode === 'auto' ? 'selected' : ''}>Auto</option>
              <option value="on" ${settings.usbChargerMode === 'on' ? 'selected' : ''}>On</option>
            </select>
          </div>
        </div>
        <p class="setting-description">Control USB charger behavior.</p>
      </div>
    </div>
  `;
}
