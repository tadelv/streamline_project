import { getBrowserBootstrapData, settingsTree } from "../config.js";
import { renderSettingsPageHead, renderSettingsPageLayout } from "./layout.js";
import { renderVisualizerSection } from "../features/visualizer.js";
import { renderPresenceSection } from "../features/presence.js";
import { renderBrightnessSection, renderWakeLockSection } from "../features/display.js";
import { renderFlowMultiplierSection, renderReaSettingsSection } from "../features/rea.js";
import {
  renderSteamSection,
  renderHotWaterSection,
  renderWaterTankSection,
  renderFlushSection,
  renderFanThresholdSection,
  renderUsbChargerModeSection,
} from "../features/machine.js";
import { renderBluetoothMachineSection, renderBluetoothScaleSection } from "../features/bluetooth.js";
import { renderCalibrationSection, renderMaintenanceSection, renderDe1AdvancedSection } from "../features/advanced.js";
import { renderUpdatesSection, renderHelpSection, renderAppearanceSection, renderLanguageSection } from "../features/static-pages.js";
import {
  getCategoryTitle,
  getDefaultSubcategory,
} from "../controllers/navigation.js";
import { buildSourceBootstrapScript } from "./bootstrap-script.js";

export function renderSettingsPage({
  reaSettings = {},
  de1Settings = {},
  de1AdvancedSettings = {},
  webUISkins = [],
  calibrationSettings = {},
  presenceSettings = {},
  appInfo = null,
  machineInfo = null,
  activeSettingsCategory = null,
  activeMainCategoryKey,
  activeHours = [],
}) {
  const browserBootstrapData = getBrowserBootstrapData({
    reaSettings,
    de1Settings,
    de1AdvancedSettings,
    webUISkins,
    calibrationSettings,
    presenceSettings,
    appInfo,
    machineInfo,
    activeSettingsCategory,
    activeMainCategoryKey,
  });

  const initialCategory = activeSettingsCategory || getDefaultSubcategory(settingsTree, activeMainCategoryKey) || "extensions";
  let initialContent = renderVisualizerSection();

  if (initialCategory === 'presence') {
    initialContent = renderPresenceSection({ presenceSettings, activeHours });
  } else if (initialCategory === 'brightness') {
    initialContent = renderBrightnessSection();
  } else if (initialCategory === 'wakelock') {
    initialContent = renderWakeLockSection();
  } else if (initialCategory === 'flowmultiplier') {
    initialContent = renderFlowMultiplierSection(reaSettings);
  } else if (initialCategory === 'rea') {
    initialContent = renderReaSettingsSection(reaSettings);
  } else if (initialCategory === 'steam') {
    initialContent = renderSteamSection(de1Settings);
  } else if (initialCategory === 'hotwater') {
    initialContent = renderHotWaterSection(de1Settings);
  } else if (initialCategory === 'watertank') {
    initialContent = renderWaterTankSection(de1Settings);
  } else if (initialCategory === 'flush') {
    initialContent = renderFlushSection(de1Settings);
  } else if (initialCategory === 'fanthreshold') {
    initialContent = renderFanThresholdSection(de1Settings);
  } else if (initialCategory === 'usbchargermode') {
    initialContent = renderUsbChargerModeSection(de1Settings);
  } else if (initialCategory === 'ble_machine') {
    initialContent = renderBluetoothMachineSection();
  } else if (initialCategory === 'ble_scale') {
    initialContent = renderBluetoothScaleSection();
  } else if (['calibration', 'refillkit', 'voltage', 'fan', 'stopatweight', 'slowstart'].includes(initialCategory)) {
    initialContent = renderCalibrationSection(calibrationSettings);
  } else if (['maintenance', 'transportmode'].includes(initialCategory)) {
    initialContent = renderMaintenanceSection();
  } else if (initialCategory === 'de1advanced') {
    initialContent = renderDe1AdvancedSection(de1AdvancedSettings);
  } else if (initialCategory === 'updates') {
    initialContent = renderUpdatesSection(appInfo, machineInfo);
  } else if (initialCategory === 'help') {
    initialContent = renderHelpSection();
  } else if (initialCategory === 'appearance') {
    initialContent = renderAppearanceSection();
  } else if (initialCategory === 'language') {
    initialContent = renderLanguageSection();
  }

  return `${renderSettingsPageHead()}
${renderSettingsPageLayout(new Date().toLocaleString())}
<div id="source-templates" style="display:none"><div id="visualizer-template" style="display:none">${renderVisualizerSection()}</div>
<div id="presence-template" style="display:none">${renderPresenceSection({ presenceSettings, activeHours })}</div>
<div id="brightness-template" style="display:none">${renderBrightnessSection()}</div>
<div id="wakelock-template" style="display:none">${renderWakeLockSection()}</div>
<div id="flowmultiplier-template" style="display:none">${renderFlowMultiplierSection(reaSettings)}</div>
<div id="rea-template" style="display:none">${renderReaSettingsSection(reaSettings)}</div>
<div id="steam-template" style="display:none">${renderSteamSection(de1Settings)}</div>
<div id="hotwater-template" style="display:none">${renderHotWaterSection(de1Settings)}</div>
<div id="watertank-template" style="display:none">${renderWaterTankSection(de1Settings)}</div>
<div id="flush-template" style="display:none">${renderFlushSection(de1Settings)}</div>
<div id="fanthreshold-template" style="display:none">${renderFanThresholdSection(de1Settings)}</div>
<div id="usbchargermode-template" style="display:none">${renderUsbChargerModeSection(de1Settings)}</div>
<div id="ble_machine-template" style="display:none">${renderBluetoothMachineSection()}</div>
<div id="ble_scale-template" style="display:none">${renderBluetoothScaleSection()}</div>
<div id="calibration-template" style="display:none">${renderCalibrationSection(calibrationSettings)}</div>
<div id="maintenance-template" style="display:none">${renderMaintenanceSection()}</div>
<div id="de1advanced-template" style="display:none">${renderDe1AdvancedSection(de1AdvancedSettings)}</div>
<div id="updates-template" style="display:none">${renderUpdatesSection(appInfo, machineInfo)}</div>
<div id="help-template" style="display:none">${renderHelpSection()}</div>
<div id="appearance-template" style="display:none">${renderAppearanceSection()}</div>
<div id="language-template" style="display:none">${renderLanguageSection()}</div>
</div>
<script>
${buildSourceBootstrapScript(browserBootstrapData)}
</script>
</body>
</html>`;
}
