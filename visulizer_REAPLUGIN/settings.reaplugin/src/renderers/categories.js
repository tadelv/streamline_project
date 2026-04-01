import { getCategoryTitle } from "../controllers/navigation.js";
import { renderErrorState, renderFallbackCategoryContent } from "./common.js";

export function renderReaCategoryContent(category, { settingsCache, renderFlowMultiplierSettings, renderReaSettingsForm }) {
  switch (category) {
    case 'flowmultiplier':
      return settingsCache.rea ? renderFlowMultiplierSettings(settingsCache.rea) : renderErrorState(getCategoryTitle(category), settingsCache.reaError || 'Failed to load REA settings');
    case 'rea':
      return settingsCache.rea ? renderReaSettingsForm(settingsCache.rea) : renderErrorState(getCategoryTitle(category), settingsCache.reaError || 'Failed to load REA settings');
    default:
      return null;
  }
}

export function renderMachineCategoryContent(category, deps) {
  const {
    settingsCache,
    de1Settings,
    renderSteamSettings,
    renderHotWaterSettings,
    renderWaterTankSettings,
    renderFlushSettingsForm,
    renderFanThresholdSettings,
    renderUsbChargerModeSettings,
    renderDe1AdvancedSettingsForm,
    renderMiscellaneousSettings,
  } = deps;

  switch (category) {
    case 'steam':
      return settingsCache.de1 ? renderSteamSettings(settingsCache.de1) : renderErrorState(getCategoryTitle(category), settingsCache.de1Error || 'Failed to load machine settings');
    case 'hotwater':
      return settingsCache.de1 ? renderHotWaterSettings(settingsCache.de1) : renderErrorState(getCategoryTitle(category), settingsCache.de1Error || 'Failed to load machine settings');
    case 'watertank':
      return settingsCache.de1 ? renderWaterTankSettings(settingsCache.de1) : renderErrorState(getCategoryTitle(category), settingsCache.de1Error || 'Failed to load machine settings');
    case 'flush':
      return settingsCache.de1 ? renderFlushSettingsForm(settingsCache.de1) : renderErrorState(getCategoryTitle(category), settingsCache.de1Error || 'Failed to load machine settings');
    case 'fanthreshold':
      return settingsCache.de1 ? renderFanThresholdSettings(settingsCache.de1) : renderErrorState(getCategoryTitle(category), settingsCache.de1Error || 'Failed to load machine settings');
    case 'usbchargermode':
      return settingsCache.de1 ? renderUsbChargerModeSettings(settingsCache.de1) : renderErrorState(getCategoryTitle(category), settingsCache.de1Error || 'Failed to load machine settings');
    case 'de1advanced':
      return settingsCache.de1Advanced ? renderDe1AdvancedSettingsForm(settingsCache.de1Advanced) : renderErrorState(getCategoryTitle(category), settingsCache.de1AdvancedError || 'Failed to load advanced settings');
    case 'fan':
      return renderFanThresholdSettings(settingsCache.de1 || de1Settings);
    case 'de1':
      return renderMiscellaneousSettings();
    default:
      return null;
  }
}

export function renderDeviceCategoryContent(category, { renderBluetoothMachineSettings, renderBluetoothScaleSettings }) {
  switch (category) {
    case 'ble_machine':
      return renderBluetoothMachineSettings();
    case 'ble_scale':
      return renderBluetoothScaleSettings();
    default:
      return null;
  }
}

export function renderUiCategoryContent(category, deps) {
  const {
    renderBrightnessSettings,
    renderWakeLockSettings,
    renderPresenceSettings,
    renderUpdatesSettings,
    renderSkinSettings,
    renderLanguageSettings,
    renderExtensionsSettings,
    renderUserManualSettings,
  } = deps;

  switch (category) {
    case 'brightness':
      return renderBrightnessSettings();
    case 'wakelock':
      return renderWakeLockSettings();
    case 'presence':
      return renderPresenceSettings();
    case 'updates':
      return renderUpdatesSettings();
    case 'appearance':
      return renderSkinSettings();
    case 'language':
      return renderLanguageSettings();
    case 'extensions':
      return renderExtensionsSettings();
    case 'help':
      return renderUserManualSettings();
    default:
      return null;
  }
}

export function renderMaintenanceCategoryContent(category, { renderCalibrationSettings, renderMaintenanceSettings, renderMiscellaneousSettings }) {
  switch (category) {
    case 'calibration':
    case 'refillkit':
    case 'voltage':
    case 'stopatweight':
    case 'slowstart':
      return renderCalibrationSettings();
    case 'maintenance':
    case 'transportmode':
      return renderMaintenanceSettings();
    case 'misc':
      return renderMiscellaneousSettings();
    default:
      return null;
  }
}

export function resolveCategoryContent(category, displayName, deps = {}) {
  return renderReaCategoryContent(category, deps)
    || renderMachineCategoryContent(category, deps)
    || renderDeviceCategoryContent(category, deps)
    || renderUiCategoryContent(category, deps)
    || renderMaintenanceCategoryContent(category, deps)
    || renderFallbackCategoryContent(displayName);
}
