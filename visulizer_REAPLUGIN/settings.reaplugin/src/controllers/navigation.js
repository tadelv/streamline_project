export function getCategoryTitle(category) {
  switch (category) {
    case 'rea': return 'REA Application Settings';
    case 'flowmultiplier': return 'Flow Multiplier Settings';
    case 'steam': return 'Steam Settings';
    case 'hotwater': return 'Hot Water Settings';
    case 'watertank': return 'Water Tank Settings';
    case 'flush': return 'Flush Settings';
    case 'fanthreshold': return 'Fan Threshold Settings';
    case 'usbchargermode': return 'USB Charger Mode Settings';
    case 'de1advanced': return 'Machine Advanced Settings';
    case 'brightness': return 'Screen Brightness';
    case 'wakelock': return 'Wake Lock Settings';
    case 'presence': return 'Presence Detection';
    case 'updates': return 'Updates Settings';
    default: return 'Settings';
  }
}

export function getDefaultSubcategory(settingsTree, categoryKey) {
  return settingsTree?.[categoryKey]?.subcategories?.[0]?.settingsCategory || null;
}

export function findSettingsSearchResults(settingsTree, searchTerm) {
  const results = [];

  for (const [key, category] of Object.entries(settingsTree || {})) {
    if (category.name.toLowerCase().includes(searchTerm)) {
      results.push({ type: 'category', key, name: category.name });
    }

    category.subcategories.forEach((subcat) => {
      if (subcat.name.toLowerCase().includes(searchTerm)) {
        results.push({
          type: 'subcategory',
          categoryKey: key,
          subcatKey: subcat.id,
          settingsCategory: subcat.settingsCategory,
          name: subcat.name,
        });
      }
    });
  }

  return results;
}

export function buildSearchCategoryResults(settingsTree, results) {
  const categoryResults = {};
  results.forEach((result) => {
    if (result.type === 'category') {
      if (!categoryResults[result.key]) {
        categoryResults[result.key] = {
          name: result.name,
          subcategories: [],
          isSearchMatch: true,
        };
      }
      return;
    }

    if (!categoryResults[result.categoryKey]) {
      categoryResults[result.categoryKey] = {
        name: settingsTree[result.categoryKey].name,
        subcategories: [],
        isSearchMatch: false,
      };
    }
    categoryResults[result.categoryKey].subcategories.push(result);
  });

  return categoryResults;
}
