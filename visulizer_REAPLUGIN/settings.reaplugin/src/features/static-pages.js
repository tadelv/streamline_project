export function renderUpdatesSection(appInfo = null, machineInfo = null) {
  const appInfoDetails = appInfo ? `
    <div class="grid gap-4 sm:grid-cols-2">
      <div class="rounded-[10px] border border-[#c9c9c9] p-4 bg-[var(--box-color)]">
        <p class="text-[20px] font-bold text-[#385a92]">Version</p>
        <p class="text-[24px]">${appInfo.version || 'Unknown'}${appInfo.buildNumber ? ' (' + appInfo.buildNumber + ')' : ''}</p>
        <p class="text-[16px] text-[var(--text-secondary)]">Full: ${appInfo.fullVersion || 'N/A'}</p>
        <p class="text-[16px] text-[var(--text-secondary)]">${appInfo.buildTime || 'Build time unavailable'}</p>
      </div>
      <div class="rounded-[10px] border border-[#c9c9c9] p-4 bg-[var(--box-color)]">
        <p class="text-[20px] font-bold text-[#385a92]">Source</p>
        <p class="text-[24px]">${appInfo.branch || 'Unknown'}</p>
        <p class="text-[16px] text-[var(--text-secondary)]">Commit: ${appInfo.commitShort || 'N/A'}</p>
        <p class="text-[16px] text-[var(--text-secondary)]">App Store: ${appInfo.appStore ? 'Yes' : 'No'}</p>
      </div>
    </div>
  ` : `
    <div class="rounded-[10px] border border-[#c9c9c9] p-4 bg-[var(--box-color)]">
      <p class="text-[20px] font-bold text-[#385a92]">Update info</p>
      <p class="text-[24px]">Fetching build metadata...</p>
    </div>
  `;

  const machineDetails = machineInfo ? `
    <div class="rounded-[10px] border border-[#c9c9c9] p-4 bg-[var(--box-color)]">
      <p class="text-[20px] font-bold text-[#385a92]">Machine</p>
      <p class="text-[24px]">${machineInfo.model || 'Unknown'}</p>
      <p class="text-[16px] text-[var(--text-secondary)]">Version: ${machineInfo.version || 'N/A'}</p>
      <p class="text-[16px] text-[var(--text-secondary)]">Serial: ${machineInfo.serialNumber || 'N/A'}</p>
      <p class="text-[16px] text-[var(--text-secondary)]">GHC: ${machineInfo.GHC ? 'Enabled' : 'Disabled'}</p>
    </div>
  ` : `
    <div class="rounded-[10px] border border-[#c9c9c9] p-4 bg-[var(--box-color)]">
      <p class="text-[20px] font-bold text-[#385a92]">Machine Info</p>
      <p class="text-[24px]">Fetching machine info...</p>
    </div>
  `;

  return `
    <div class="content-stretch flex flex-col gap-[60px] items-start relative w-full">
      <div class="flex flex-col font-semibold justify-center text-[var(--text-primary)] text-[36px] text-center w-full">
        <p class="leading-[1.2]">Updates Settings</p>
      </div>
      <div class="content-stretch flex flex-col items-start relative w-full space-y-10">
        <div class="flex flex-col gap-[30px] w-full">
          <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between">
              <div class="font-bold text-[#385a92] text-[30px]">Firmware Update</div>
              <button class="settings-btn-wide" onclick="handleStaticAction('firmware-update')">Check</button>
            </div>
            <p class="text-[24px] text-[var(--text-primary)]">Check for firmware updates</p>
          </div>
          <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between">
              <div class="font-bold text-[#385a92] text-[30px]">App Update</div>
              <button class="settings-btn-wide" onclick="handleStaticAction('app-update')">Check</button>
            </div>
            <p class="text-[24px] text-[var(--text-primary)]">Check for application updates</p>
          </div>
        </div>
        <div class="w-full flex flex-col gap-4">
          <div class="flex flex-col gap-4">
            <p class="font-bold text-[#385a92] text-[30px]">Build Information</p>
            ${appInfoDetails}
          </div>
          <div class="flex flex-col gap-4">
            <p class="font-bold text-[#385a92] text-[30px]">Machine Details</p>
            ${machineDetails}
          </div>
        </div>
      </div>
    </div>
  `;
}

export function renderHelpSection() {
  return `
    <div class="content-stretch flex flex-col gap-[60px] items-start relative w-full">
      <div class="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] min-w-full not-italic relative text-[var(--text-primary)] text-[36px] text-center w-[min-content]">
        <p class="leading-[1.2]">User Manual</p>
      </div>

      <div class="content-stretch flex flex-col items-start relative w-full">
        <div class="content-stretch flex flex-col gap-[30px] items-start relative w-full">
          <div class="content-stretch flex items-center justify-between relative w-full">
            <div class="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative text-[#385a92] text-[30px]">
              <p class="leading-[1.2]">Online Help</p>
            </div>
            <a href="https://decentespresso.com/support/submit" target="_blank" class="bg-[#385a92] h-[62.88px] rounded-[10px] w-[200px] text-white text-[24px] font-bold flex items-center justify-center">
              Visit
            </a>
          </div>
          <p class="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic relative text-[var(--text-primary)] text-[24px] w-full">
            Get support and submit tickets for assistance
          </p>
        </div>
      </div>

      <div class="h-0 relative w-full">
        <hr class="border-t border-[#c9c9c9] w-full" />
      </div>

      <div class="content-stretch flex flex-col items-start relative w-full">
        <div class="content-stretch flex flex-col gap-[30px] items-start relative w-full">
          <div class="content-stretch flex items-center justify-between relative w-full">
            <div class="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative text-[#385a92] text-[30px]">
              <p class="leading-[1.2]">Tutorials</p>
            </div>
            <a href="https://decentespresso.com/doc/quickstart/" target="_blank" class="bg-[#385a92] h-[62.88px] rounded-[10px] w-[200px] text-white text-[24px] font-bold flex items-center justify-center">
              View
            </a>
          </div>
          <p class="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic relative text-[var(--text-primary)] text-[24px] w-full">
            Learn how to get started with your espresso machine
          </p>
        </div>
      </div>

      <div class="content-stretch flex flex-col items-start relative w-full">
        <div class="content-stretch flex flex-col gap-[30px] items-start relative w-full">
          <div class="content-stretch flex items-center justify-between relative w-full">
            <div class="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative text-[#385a92] text-[30px]">
              <p class="leading-[1.2]">Start writing your own skin.</p>
            </div>
            <a href="https://github.com/tadelv/reaprime/blob/main/doc/Skins.md#skinsmd" target="_blank" class="bg-[#385a92] h-[62.88px] rounded-[10px] w-[200px] text-white text-[24px] font-bold flex items-center justify-center">
              View
            </a>
          </div>
          <p class="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic relative text-[var(--text-primary)] text-[24px] w-full">
            Learn how to use streamline-bridge to create custom skins and more.
          </p>
        </div>
      </div>
    </div>
  `;
}

export function renderAppearanceSection() {
  return `
    <div class="settings-flex-container">
      <div class="settings-page-title"><p>Appearance Settings</p></div>
      <div class="settings-divider"><hr /></div>
      <div class="settings-section-flex">
        <div class="setting-row-flex">
          <div class="setting-label-bold"><p>Theme</p></div>
          <button class="settings-btn-wide" onclick="handleStaticAction('theme')">Select</button>
        </div>
        <p class="setting-description">Choose theme, font size, and display appearance options.</p>
      </div>
    </div>
  `;
}

export function renderLanguageSection() {
  return `
    <div class="settings-flex-container">
      <div class="settings-page-title"><p>Language Settings</p></div>
      <div class="settings-divider"><hr /></div>
      <div class="settings-section-flex">
        <div class="setting-row-flex">
          <div class="setting-label-bold"><p>Language</p></div>
          <button class="settings-btn-wide" onclick="handleStaticAction('language')">Select</button>
        </div>
        <p class="setting-description">Choose the language for the application interface.</p>
      </div>
    </div>
  `;
}
