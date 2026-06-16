import { store as globalStore } from '../store.js';

async function getExcludesForActiveProfile(store = globalStore) {
  const fullConfig = await store.getFullConfig();
  const activeProfileName = fullConfig.activeProfile;
  const excludesString = fullConfig.profiles[activeProfileName]?.formSkrining?.excludes || '';

  return excludesString.split(';').filter(Boolean);
}

async function saveExcludesForActiveProfile(excludesArray, store = globalStore) {
  const fullConfig = await store.getFullConfig();
  const activeProfileName = fullConfig.activeProfile;

  if (!fullConfig.profiles[activeProfileName]) {
    fullConfig.profiles[activeProfileName] = {};
  }
  if (!fullConfig.profiles[activeProfileName].formSkrining) {
    fullConfig.profiles[activeProfileName].formSkrining = {};
  }

  fullConfig.profiles[activeProfileName].formSkrining.excludes = excludesArray.join(';');
  await store.setConfig(fullConfig);
}

export async function isExcluded(dataName, store = globalStore) {
  const excludesList = await getExcludesForActiveProfile(store);

  return excludesList.includes(dataName);
}

export async function toggleExclude(dataName, store = globalStore) {
  const excludesList = await getExcludesForActiveProfile(store);
  const index = excludesList.indexOf(dataName);

  if (index > -1) {
    excludesList.splice(index, 1);
    await saveExcludesForActiveProfile(excludesList, store);

    return false;
  } else {
    excludesList.push(dataName);
    await saveExcludesForActiveProfile(excludesList, store);

    return true;
  }
}
