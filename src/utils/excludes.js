/**
 * Parses an excludes string into an array.
 * @param {Object} profileConfig - The active profile configuration.
 * @returns {string[]}
 */
export function parseExcludes(profileConfig) {
  const excludesString = profileConfig?.excludes || '';
  return excludesString.split(';').filter(Boolean);
}

/**
 * Checks if a specific data-name is currently excluded.
 * @param {string} dataName - The data-name to check.
 * @param {Object} profileConfig - The active profile configuration.
 * @returns {boolean}
 */
export function isExcluded(dataName, profileConfig) {
  const excludesList = parseExcludes(profileConfig);
  return excludesList.includes(dataName);
}

/**
 * Logic to toggle exclusion. Returns updated excludes string and new state.
 * @param {string} dataName - The data-name to toggle.
 * @param {string} currentExcludesString - The current semicolon-separated string.
 * @returns {{ updatedExcludes: string, nowExcluded: boolean }}
 */
export function toggleExcludeLogic(dataName, currentExcludesString = '') {
  const excludesList = currentExcludesString.split(';').filter(Boolean);
  const index = excludesList.indexOf(dataName);
  let nowExcluded = false;

  if (index > -1) {
    excludesList.splice(index, 1);
    nowExcluded = false;
  } else {
    excludesList.push(dataName);
    nowExcluded = true;
  }

  return {
    updatedExcludes: excludesList.join(';'),
    nowExcluded,
  };
}
