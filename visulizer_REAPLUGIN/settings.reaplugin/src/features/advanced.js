export function renderCalibrationSection(settings = {}) {
  return `
    <div class="settings-flex-container">
      <div class="settings-page-title"><p>Calibration Settings</p></div>
      <div class="settings-divider"><hr /></div>
      <div class="settings-section-flex">
        <div class="setting-row-flex">
          <div class="setting-label-bold"><p id="voltage-label">Voltage</p></div>
          <div class="setting-control-flex">
            <input type="number" id="voltageInput" class="settings-input-primary" value="${settings.voltage !== undefined ? settings.voltage : 120}" step="0.1" min="0" max="240">
            <button class="settings-btn-primary" onclick="handleCalibrationSettingSave('voltage', document.getElementById('voltageInput').value)">Save</button>
          </div>
        </div>
        <p class="setting-description">Set voltage calibration.</p>
      </div>
      <div class="settings-divider"><hr /></div>
      <div class="settings-section-flex">
        <div class="setting-row-flex">
          <div class="setting-label-bold"><p id="stop-weight-label">Stop at Weight</p></div>
          <div class="setting-control-flex">
            <input type="number" id="stopAtWeightInput" class="settings-input-primary" value="${settings.stopAtWeight !== undefined ? settings.stopAtWeight : 0}" step="0.1" min="0" max="1000">
            <button class="settings-btn-primary" onclick="handleCalibrationSettingSave('stopAtWeight', document.getElementById('stopAtWeightInput').value)">Save</button>
          </div>
        </div>
        <p class="setting-description">Configure stop-at-weight calibration.</p>
      </div>
      <div class="settings-divider"><hr /></div>
      <div class="settings-section-flex">
        <div class="setting-row-flex">
          <div class="setting-label-bold"><p id="slow-start-label">Slow Start</p></div>
          <div class="setting-control-flex">
            <input type="number" id="slowStartInput" class="settings-input-primary" value="${settings.slowStart !== undefined ? settings.slowStart : 0}" step="0.1" min="0" max="20">
            <button class="settings-btn-primary" onclick="handleCalibrationSettingSave('slowStart', document.getElementById('slowStartInput').value)">Save</button>
          </div>
        </div>
        <p class="setting-description">Configure slow-start timing.</p>
      </div>
      <div class="settings-divider"><hr /></div>
      <div class="settings-section-flex">
        <div class="setting-row-flex">
          <div class="setting-label-bold"><p id="fan-cal-label">Fan Calibration</p></div>
          <div class="setting-control-flex">
            <input type="number" id="fanCalibrationInput" class="settings-input-primary" value="${settings.fanCalibration !== undefined ? settings.fanCalibration : 0}" step="1" min="0" max="100">
            <button class="settings-btn-primary" onclick="handleCalibrationSettingSave('fanCalibration', document.getElementById('fanCalibrationInput').value)">Save</button>
          </div>
        </div>
        <p class="setting-description">Set fan calibration offset.</p>
      </div>
    </div>
  `;
}

export function renderMaintenanceSection() {
  return `
    <div class="settings-flex-container">
      <div class="settings-page-title"><p>Maintenance Settings</p></div>
      <div class="settings-divider"><hr /></div>
      <div class="settings-section-flex">
        <div class="setting-row-flex">
          <div class="setting-label-bold"><p>Machine Descaling</p></div>
          <button class="settings-btn-wide" onclick="handleMaintenanceAction('descale')">Start</button>
        </div>
        <p class="setting-description">Run the descaling workflow.</p>
      </div>
      <div class="settings-divider"><hr /></div>
      <div class="settings-section-flex">
        <div class="setting-row-flex">
          <div class="setting-label-bold"><p>Transport Mode</p></div>
          <button class="settings-btn-wide" onclick="handleMaintenanceAction('transport')">Enable</button>
        </div>
        <p class="setting-description">Prepare the machine for transport.</p>
      </div>
    </div>
  `;
}

export function renderDe1AdvancedSection(settings = {}) {
  return `
    <div class="settings-flex-container">
      <div class="settings-page-title"><p>Machine Advanced Settings</p></div>
      <div class="settings-divider"><hr /></div>
      <div class="settings-section-flex">
        <div class="setting-row-flex">
          <div class="setting-label-bold"><p id="heater-ph1-flow-label">Heater Phase 1 Flow</p></div>
          <div class="setting-control-flex">
            <input type="number" id="heaterPh1FlowInput" class="settings-input-primary" value="${settings.heaterPh1Flow !== undefined ? settings.heaterPh1Flow : 0}" step="0.1" min="0" max="10">
            <button class="settings-btn-primary" onclick="handleAdvancedSettingSave('heaterPh1Flow', document.getElementById('heaterPh1FlowInput').value)">Save</button>
          </div>
        </div>
        <p class="setting-description">Flow rate during heater phase 1.</p>
      </div>
      <div class="settings-divider"><hr /></div>
      <div class="settings-section-flex">
        <div class="setting-row-flex">
          <div class="setting-label-bold"><p id="heater-ph2-flow-label">Heater Phase 2 Flow</p></div>
          <div class="setting-control-flex">
            <input type="number" id="heaterPh2FlowInput" class="settings-input-primary" value="${settings.heaterPh2Flow !== undefined ? settings.heaterPh2Flow : 0}" step="0.1" min="0" max="10">
            <button class="settings-btn-primary" onclick="handleAdvancedSettingSave('heaterPh2Flow', document.getElementById('heaterPh2FlowInput').value)">Save</button>
          </div>
        </div>
        <p class="setting-description">Flow rate during heater phase 2.</p>
      </div>
    </div>
  `;
}
