export function renderFlowMultiplierSection(settings = {}) {
  return `
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
                   value="${settings.weightFlowMultiplier !== undefined ? settings.weightFlowMultiplier : 1.0}"
                   step="0.1" min="0" max="5">
            <button class="settings-btn-primary"
                    onclick="handleReaSettingSave('weightFlowMultiplier', document.getElementById('weightFlowMultiplierInput').value)">
              Save
            </button>
          </div>
        </div>
        <p class="setting-description">Multiplier for projected weight calculation. Higher values stop shots earlier.</p>
      </div>
      <div class="settings-divider"><hr /></div>
      <div class="settings-section-flex">
        <div class="setting-row-flex">
          <div class="setting-label-bold">
            <p id="volume-flow-multiplier-label">Volume Flow Multiplier (s)</p>
          </div>
          <div class="setting-control-flex">
            <input type="number" id="volumeFlowMultiplierInput" aria-labelledby="volume-flow-multiplier-label" class="settings-input-primary"
                   value="${settings.volumeFlowMultiplier !== undefined ? settings.volumeFlowMultiplier : 0.3}"
                   step="0.05" min="0" max="2">
            <button class="settings-btn-primary"
                    onclick="handleReaSettingSave('volumeFlowMultiplier', document.getElementById('volumeFlowMultiplierInput').value)">
              Save
            </button>
          </div>
        </div>
        <p class="setting-description">Look-ahead time in seconds for projected volume calculation. Accounts for system lag.</p>
      </div>
    </div>
  `;
}

export function renderReaSettingsSection(settings = {}) {
  return `
    <div class="settings-flex-container">
      <div class="settings-page-title">
        <p>Bridge Application Settings</p>
      </div>
      <div class="settings-divider"><hr /></div>
      <div class="settings-section-flex">
        <div class="setting-row-flex-column">
          <div class="setting-label-bold">
            <p id="gateway-mode-label">Gateway Mode</p>
          </div>
          <div class="toggle-button-group" role="group" aria-labelledby="gateway-mode-label">
            <button class="toggle-btn ${settings.gatewayMode === 'disabled' ? 'active' : 'inactive'}" onclick="handleReaSettingSave('gatewayMode', 'disabled')">Disabled</button>
            <button class="toggle-btn ${settings.gatewayMode === 'tracking' ? 'active' : 'inactive'}" onclick="handleReaSettingSave('gatewayMode', 'tracking')">Tracking</button>
            <button class="toggle-btn ${settings.gatewayMode === 'full' ? 'active' : 'inactive'}" onclick="handleReaSettingSave('gatewayMode', 'full')">Full</button>
          </div>
        </div>
        <p class="setting-description">Controls how the gateway monitors and controls the espresso machine</p>
      </div>
      <div class="settings-divider"><hr /></div>
      <div class="settings-section-flex">
        <div class="setting-row-flex">
          <div class="setting-label-bold">
            <p id="log-level-label">Log Level</p>
          </div>
          <div class="setting-control-flex">
            <select id="logLevelSelect" class="settings-input-wide" onchange="handleReaSettingSave('logLevel', this.value)">
              <option value="INFO" ${settings.logLevel === 'INFO' ? 'selected' : ''}>INFO</option>
              <option value="WARNING" ${settings.logLevel === 'WARNING' ? 'selected' : ''}>WARNING</option>
              <option value="SEVERE" ${settings.logLevel === 'SEVERE' ? 'selected' : ''}>SEVERE</option>
            </select>
          </div>
        </div>
        <p class="setting-description">Controls the verbosity of Bridge application logging</p>
      </div>
    </div>
  `;
}
