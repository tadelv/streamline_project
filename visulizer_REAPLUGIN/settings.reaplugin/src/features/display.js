export function renderBrightnessSection(currentBrightness = 75) {
  return `
    <div class="space-y-6 px-[60px] py-[80px]">
      <div>
        <h2 class="text-[28px] font-bold text-[var(--text-primary)] mb-4">Screen Brightness</h2>
        <p class="text-[var(--text-primary)] text-[20px] mb-6 opacity-75">Adjust screen brightness level.</p>
      </div>
      <div class="bg-[var(--box-color)] rounded-lg p-6">
        <input type="range" id="brightness-slider" min="0" max="100" value="${currentBrightness}" class="brightness-slider flex-grow w-full" onchange="handleBrightnessChange(this.value)">
      </div>
    </div>
  `;
}

export function renderWakeLockSection(wakeLockEnabled = false) {
  return `
    <div class="space-y-6 px-[60px] py-[80px]">
      <div>
        <h2 class="text-[28px] font-bold text-[var(--text-primary)] mb-4">Wake Lock Settings</h2>
        <p class="text-[var(--text-primary)] text-[20px] mb-6 opacity-75">Control screen wake-lock to prevent the display from sleeping during operation.</p>
      </div>
      <div class="bg-[var(--box-color)] rounded-lg p-6">
        <div class="flex items-center justify-between">
          <div>
            <label class="text-[24px] font-semibold text-[var(--text-primary)]">Enable Wake Lock</label>
            <p class="text-[18px] text-[var(--text-primary)] opacity-75 mt-1">Keep the screen on while the app is active</p>
          </div>
          <input type="checkbox" id="wake-lock-toggle" class="toggle toggle-lg toggle-primary" ${wakeLockEnabled ? 'checked' : ''} onchange="handleWakeLockToggle(this.checked)">
        </div>
      </div>
      <div class="text-[18px] text-[var(--text-primary)] opacity-75 mt-4">
        <p><strong>Note:</strong> Wake-lock automatically releases when the display service disconnects.</p>
      </div>
    </div>
  `;
}
