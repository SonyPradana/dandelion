/**
 * Parses the "Not Checked" master list into an array.
 * @param {Object} profileConfig - The active profile configuration.
 * @returns {string[]}
 */
export function parseNotCheckedList(profileConfig) {
  const listString = profileConfig?.notCheckedList || '';
  return listString.split(';').filter(Boolean);
}

/**
 * Checks if a specific ID exists in the "Not Checked" master list.
 * @param {string} id - The row ID to check.
 * @param {Object} profileConfig - The active profile configuration.
 * @returns {boolean}
 */
export function isInNotCheckedList(id, profileConfig) {
  const list = parseNotCheckedList(profileConfig);
  return list.includes(id);
}

/**
 * Logic to toggle an ID in the master list. Returns updated string and new state.
 * @param {string} id - The row ID to toggle.
 * @param {string} currentListString - The current semicolon-separated string.
 * @returns {{ updatedList: string, nowPresent: boolean }}
 */
export function toggleNotCheckedLogic(id, currentListString = '') {
  const list = currentListString.split(';').filter(Boolean);
  const index = list.indexOf(id);
  let nowPresent = false;

  if (index > -1) {
    list.splice(index, 1);
    nowPresent = false;
  } else {
    list.push(id);
    nowPresent = true;
  }

  return {
    updatedList: list.join(';'),
    nowPresent,
  };
}
