import {
  API_BASE_URL,
  DEFAULT_REFRESH_INTERVAL,
  DEFAULT_MAIN_CATEGORY_KEY,
} from "./config.js";
import { renderSettingsPage } from "./pages/settings-page.js";

export default function createPlugin(host) {
  let activeSettingsCategory = null;
  let activeMainCategoryKey = DEFAULT_MAIN_CATEGORY_KEY;

  function log(msg) {
    host.log(`[settings] ${msg}`);
  }

  async function fetchJson(path, label) {
    const response = await fetch(`${API_BASE_URL}${path}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${label}: ${response.status} ${response.statusText}`);
    }
    return response.json();
  }

  async function fetchReaSettings() {
    try { return await fetchJson('/settings', 'REA settings'); } catch (e) { log(e.message); return {}; }
  }

  async function fetchDe1Settings() {
    try { return await fetchJson('/machine/settings', 'machine settings'); } catch (e) { log(e.message); return {}; }
  }

  async function fetchDe1AdvancedSettings() {
    try { return await fetchJson('/machine/settings/advanced', 'advanced machine settings'); } catch (e) { log(e.message); return {}; }
  }

  async function fetchCalibrationSettings() {
    try { return await fetchJson('/machine/calibration', 'calibration settings'); } catch (e) { log(e.message); return {}; }
  }

  async function fetchPresenceSettings() {
    try { return await fetchJson('/presence/settings', 'presence settings'); } catch (e) { log(e.message); return {}; }
  }

  async function fetchWebUISkins() {
    try { return await fetchJson('/webui/skins', 'web ui skins'); } catch (e) { log(e.message); return []; }
  }

  async function fetchAppInfo() {
    try { return await fetchJson('/info', 'app info'); } catch (e) { log(e.message); return null; }
  }

  async function fetchMachineInfo() {
    try { return await fetchJson('/machine/info', 'machine info'); } catch (e) { log(e.message); return null; }
  }

  function getStoredActiveHours() {
    return [];
  }

  async function renderSourcePage() {
    const [
      reaSettings,
      de1Settings,
      de1AdvancedSettings,
      webUISkins,
      calibrationSettings,
      presenceSettings,
      appInfo,
      machineInfo,
    ] = await Promise.all([
      fetchReaSettings(),
      fetchDe1Settings(),
      fetchDe1AdvancedSettings(),
      fetchWebUISkins(),
      fetchCalibrationSettings(),
      fetchPresenceSettings(),
      fetchAppInfo(),
      fetchMachineInfo(),
    ]);

    return renderSettingsPage({
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
      activeHours: getStoredActiveHours(),
    });
  }

  return {
    id: "settings.reaplugin",
    version: "0.1.0",

    onLoad(settings) {
      log(`Loaded with refresh interval: ${settings?.RefreshInterval ?? DEFAULT_REFRESH_INTERVAL}s`);
    },

    onUnload() {
      log("Unloaded");
    },

    onEvent(_event) {},

    __httpRequestHandler(request) {
      if (request.endpoint === "ui") {
        return Promise.resolve(renderSourcePage()).then((body) => ({
          requestId: request.requestId,
          status: 200,
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "no-cache",
          },
          body,
        }));
      }

      return {
        requestId: request.requestId,
        status: 404,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Endpoint not found" }),
      };
    },
  };
}
