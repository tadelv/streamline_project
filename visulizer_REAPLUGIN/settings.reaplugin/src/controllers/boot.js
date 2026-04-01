export function renderRefreshState(categoryTitle) {
  return {
    type: 'refresh',
    categoryTitle,
  };
}

export function renderActiveSettingsView(activeCategory) {
  return {
    type: 'active-view',
    activeCategory,
  };
}

export function initializeSettingsPage(activeMainCategoryKey) {
  return {
    type: 'initialize',
    activeMainCategoryKey,
  };
}

export function bootSettingsPage(activeMainCategoryKey, activeSettingsCategory) {
  return {
    type: 'boot',
    activeMainCategoryKey,
    activeSettingsCategory,
  };
}
