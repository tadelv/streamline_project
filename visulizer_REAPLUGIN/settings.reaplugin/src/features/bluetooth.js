export function renderBluetoothMachineSection() {
  return `
    <div class="space-y-6 px-[60px] py-[80px]">
      <div>
        <h2 class="text-[28px] font-bold text-[var(--text-primary)] mb-4">Bluetooth Machine</h2>
        <p class="text-[var(--text-primary)] text-[20px] mb-6 opacity-75">Scan and manage espresso machine Bluetooth devices.</p>
      </div>
      <div class="bg-[var(--box-color)] rounded-lg p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-[24px] font-semibold text-[var(--text-primary)]">Machines</h3>
          <button class="settings-btn-primary" onclick="handleScanDevices('Machine')">Scan</button>
        </div>
        <div id="bluetooth-machine-devices-container" class="space-y-3">
          <p class="text-[var(--text-primary)] opacity-75 text-[18px]">No device data yet. Press Scan to search for nearby devices.</p>
        </div>
      </div>
    </div>
  `;
}

export function renderBluetoothScaleSection() {
  return `
    <div class="space-y-6 px-[60px] py-[80px]">
      <div>
        <h2 class="text-[28px] font-bold text-[var(--text-primary)] mb-4">Bluetooth Scale</h2>
        <p class="text-[var(--text-primary)] text-[20px] mb-6 opacity-75">Scan and manage scale Bluetooth devices.</p>
      </div>
      <div class="bg-[var(--box-color)] rounded-lg p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-[24px] font-semibold text-[var(--text-primary)]">Scales</h3>
          <button class="settings-btn-primary" onclick="handleScanDevices('Scale')">Scan</button>
        </div>
        <div id="bluetooth-scale-devices-container" class="space-y-3">
          <p class="text-[var(--text-primary)] opacity-75 text-[18px]">No device data yet. Press Scan to search for nearby devices.</p>
        </div>
      </div>
    </div>
  `;
}
