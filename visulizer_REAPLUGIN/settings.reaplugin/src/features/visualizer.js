const VISUALIZER_PLUGIN_ID = "visualizer.reaplugin";

export function renderVisualizerSettingsForm() {
  return '\n                        <div id="visualizer-form-container" class="w-full mt-6">' +
    '\n                            <div class="grid grid-cols-4">' +
    '\n                                <div class="col-span-3 flex flex-col gap-6">' +
    '\n                                    <div class="flex flex-col gap-2">' +
    '\n                                        <label for="visualizer-username" class="text-[var(--text-primary)] text-[24px]">Username:</label>' +
    '\n                                        <input type="text" id="visualizer-username" class="w-full max-w-[500px] p-3 rounded-lg border border-[var(--border-color)] bg-[var(--profile-button-background-color)] text-[var(--text-primary)] text-[24px] focus:outline-none focus:ring-2 focus:ring-[var(--mimoja-blue)]" placeholder="Enter your Visualizer username">' +
    '\n                                    </div>' +
    '\n                                    <div class="flex flex-col gap-2">' +
    '\n                                        <label for="visualizer-password" class="text-[var(--text-primary)] text-[24px]">Password:</label>' +
    '\n                                        <input type="password" id="visualizer-password" class="w-full max-w-[500px] p-3 rounded-lg border border-[var(--border-color)] bg-[var(--profile-button-background-color)] text-[var(--text-primary)] text-[24px] focus:outline-none focus:ring-2 focus:ring-[var(--mimoja-blue)]" placeholder="Enter your Visualizer password">' +
    '\n                                    </div>' +
    '\n                                    <div class="flex items-center gap-4">' +
    '\n                                        <label for="visualizer-auto-upload" class="text-[var(--text-primary)] text-[24px]">Auto-upload shots to Visualizer</label>' +
    '\n                                        <input type="checkbox" id="visualizer-auto-upload" class="w-8 h-8">' +
    '\n                                    </div>' +
    '\n                                    <div class="flex items-center gap-4">' +
    '\n                                        <label for="visualizer-min-duration" class="text-[var(--text-primary)] text-[24px]">Minimum Shot Duration (seconds):</label>' +
    '\n                                        <input type="number" id="visualizer-min-duration" class="w-24 p-3 rounded-lg border border-[var(--border-color)] bg-[var(--profile-button-background-color)] text-[var(--text-primary)] text-[24px] focus:outline-none focus:ring-2 focus:ring-[var(--mimoja-blue)]" min="1" value="5">' +
    '\n                                    </div>' +
    '\n                                </div>' +
    '\n                                <div class="col-span-1 col-end-5 flex justify-end">' +
    '\n                                    <button id="save-visualizer-credentials" class=" w-[150px] h-[50px] pt-3 pb-[15px] border border-solid border-[var(--mimoja-blue)] text-[var(--mimoja-blue)] rounded-[22.5px]">' +
    '\n                                        Save Credentials' +
    '\n                                    </button>' +
    '\n                                </div>' +
    '\n                            </div>' +
    '\n                        </div>\n';
}

export function renderVisualizerSection() {
  return [
    '                <div class="flex flex-col gap-[60px] items-start relative w-full max-w-full overflow-x-hidden">',
    '                    <div class="flex flex-col font-[\'Inter:Semi_Bold\',sans-serif] font-semibold justify-center leading-[0] not-italic relative text-[var(--text-primary)] text-[36px] text-center w-full">',
    '                        <p class="leading-[1.2]">Extensions Settings</p>',
    '                    </div>',
    '                    <div class="flex flex-col items-start relative w-full max-w-full">',
    '                        <div class="flex flex-col gap-[30px] items-start relative w-full max-w-full">',
    '                            <div class="flex items-center justify-between relative w-full max-w-full">',
    '                                <div class="flex flex-col font-[\'Inter:Bold\',sans-serif] font-bold justify-center leading-[0] not-italic relative text-[#385a92] text-[30px]">',
    '                                    <p class="leading-[1.2]">Visualizer</p>',
    '                                    <p class="font-[\'Inter:Regular\',sans-serif] font-normal leading-[1.4] not-italic relative text-[var(--text-primary)] text-[24px] w-full">',
    '                        Enable or disable the Visualizer extension',
    '                    </p>',
    '                                </div>',
    '                                <select id="visualizer-enabled" class="bg-[#385a92] border-2 border-[#385a92] border-solid h-[62.88px] rounded-[2617.374px] w-[200px] text-white text-[24px] p-2">',
    '                                    <option value="true">Enabled</option>',
    '                                    <option value="false">Disabled</option>',
    '                                </select>',
    '                            </div>',
    '                             <div class="justify-between grid-cols-4 mt-2 w-full">',
    renderVisualizerSettingsForm(),
    '                    </div>',
    '                        </div>',
    '                    </div>',
    '                </div>',
  ].join('\n');
}

export function getVisualizerElements(doc = document) {
  return {
    saveButton: doc.getElementById('save-visualizer-credentials'),
    usernameInput: doc.getElementById('visualizer-username'),
    passwordInput: doc.getElementById('visualizer-password'),
    autoUploadCheckbox: doc.getElementById('visualizer-auto-upload'),
    minDurationInput: doc.getElementById('visualizer-min-duration'),
    enabledSelect: doc.getElementById('visualizer-enabled'),
    formContainer: doc.getElementById('visualizer-form-container'),
  };
}

export function setVisualizerFormVisibility(enabledSelect, formContainer) {
  if (!enabledSelect || !formContainer) return;
  formContainer.style.display = enabledSelect.value === 'false' ? 'none' : 'block';
}

export async function verifyVisualizerCredentials(username, password) {
  const response = await fetch('http://localhost:8080/api/v1/plugins/' + VISUALIZER_PLUGIN_ID + '/verifyCredentials', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  try {
    return await response.json();
  } catch {
    const errorText = await response.text();
    throw new Error(errorText || 'Invalid response format');
  }
}

export async function saveVisualizerSettings(settingsPayload) {
  const response = await fetch('http://localhost:8080/api/v1/plugins/' + VISUALIZER_PLUGIN_ID + '/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settingsPayload),
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

export async function fetchVisualizerSavedSettings() {
  const response = await fetch('http://localhost:8080/api/v1/plugins/' + VISUALIZER_PLUGIN_ID + '/settings');
  if (!response.ok) return null;

  try {
    return await response.json();
  } catch {
    const errorText = await response.text();
    throw new Error(errorText || 'Failed to load Visualizer settings: Invalid response format');
  }
}

export function applyVisualizerSettingsToForm(savedSettings, elements, storage = localStorage) {
  const {
    usernameInput,
    passwordInput,
    autoUploadCheckbox,
    minDurationInput,
    enabledSelect,
    formContainer,
  } = elements;

  if (usernameInput) usernameInput.value = savedSettings && savedSettings.Username ? savedSettings.Username : '';
  if (passwordInput) passwordInput.value = '';
  if (autoUploadCheckbox && savedSettings && typeof savedSettings.AutoUpload !== 'undefined') {
    autoUploadCheckbox.checked = !!savedSettings.AutoUpload;
  }
  if (minDurationInput && savedSettings && typeof savedSettings.Length !== 'undefined') {
    minDurationInput.value = parseInt(savedSettings.Length, 10) || 5;
  }
  if (enabledSelect) {
    const storedEnabled = storage.getItem('visualizerEnabled');
    enabledSelect.value = storedEnabled !== null ? storedEnabled : 'true';
  }
  setVisualizerFormVisibility(enabledSelect, formContainer);
}
