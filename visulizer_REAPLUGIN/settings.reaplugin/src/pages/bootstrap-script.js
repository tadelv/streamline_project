import { browserRuntimeSource } from "../runtime/browser-runtime.js";

export function buildSourceBootstrapScript(browserBootstrapData) {
  return `window.__SETTINGS_BOOTSTRAP__ = ${JSON.stringify(browserBootstrapData)};
${browserRuntimeSource}`;
}
