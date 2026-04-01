export function renderLoadingState(title) {
  return `
    <div class="settings-loading-state">
      <div class="settings-page-title"><p>${title}</p></div>
      <div style="color: var(--text-primary); padding: 16px; font-size: 24px; text-align: center; width: 100%;">Loading settings...</div>
    </div>
  `;
}

export function renderErrorState(title, message) {
  return `
    <div class="settings-loading-state" role="alert">
      <div class="settings-page-title"><p>${title}</p></div>
      <div class="settings-error-text">Failed to load settings: ${message}</div>
      <button class="settings-btn-primary" style="margin: 0 auto;" onclick="window.retryLoadSettings()">Retry</button>
    </div>
  `;
}

export function renderFallbackCategoryContent(displayName) {
  return '\n      <div class="settings-flex-container">' +
    '\n        <div class="settings-page-title"><p>' + displayName + '</p></div>' +
    '\n        <div class="settings-divider"><hr /></div>' +
    '\n        <div class="setting-description"><p>Settings content for ' + displayName + ' coming soon.</p></div>' +
    '\n      </div>';
}
