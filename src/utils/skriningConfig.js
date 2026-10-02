import { store as globalStore } from '../store.js';

/**
 * Reads the skrining answers object from the active profile.
 * @param {import('../store.js').DandelionStore} [store]
 * @returns {Promise<Object>}
 */
export async function getAnswers(store = globalStore) {
  const config = await store.getActiveConfig();
  const answers = config.skrining?.answers;
  return typeof answers === 'object' && answers !== null ? answers : {};
}

/**
 * Replaces the whole skrining answers object in the active profile.
 * @param {Object} answers
 * @param {import('../store.js').DandelionStore} [store]
 * @returns {Promise<void>}
 */
export async function saveAnswers(answers, store = globalStore) {
  const config = await store.getFullConfig();
  const profile = config.profiles?.[config.activeProfile];

  if (profile) {
    if (!profile.skrining) profile.skrining = {};
    profile.skrining.answers = answers;
  }

  await store.setConfig(config);
}

/**
 * Stores one radio answer, keyed by the first radio id of the question.
 * @param {string} key - Radio id of the first option, e.g. answer8AA
 * @param {string} value - Radio value, e.g. B
 * @param {import('../store.js').DandelionStore} [store]
 * @returns {Promise<void>}
 */
export async function addAnswer(key, value, store = globalStore) {
  const answers = await getAnswers(store);
  answers[key] = value;
  await saveAnswers(answers, store);
}

/**
 * Removes one stored radio answer.
 * @param {string} key
 * @param {import('../store.js').DandelionStore} [store]
 * @returns {Promise<void>}
 */
export async function removeAnswer(key, store = globalStore) {
  const answers = await getAnswers(store);
  delete answers[key];
  await saveAnswers(answers, store);
}

/**
 * Checks whether a question already has a stored answer.
 * @param {string} key
 * @param {import('../store.js').DandelionStore} [store]
 * @returns {Promise<boolean>}
 */
export async function isAnswerPinned(key, store = globalStore) {
  const answers = await getAnswers(store);
  return Object.hasOwn(answers, key);
}

/**
 * Reads the skrining excludes list of the active profile as an array.
 * @param {import('../store.js').DandelionStore} [store]
 * @returns {Promise<string[]>}
 */
export async function getSkriningExcludes(store = globalStore) {
  const config = await store.getActiveConfig();
  return (config.skrining?.excludes || '').split(';').filter(Boolean);
}

/**
 * Adds or removes one question id from the skrining excludes list.
 * @param {string} key - Radio id of the first option, e.g. answer8AA
 * @param {import('../store.js').DandelionStore} [store]
 * @returns {Promise<boolean>} True when now excluded, false when now included.
 */
export async function toggleSkriningExclude(key, store = globalStore) {
  const excludes = await getSkriningExcludes(store);
  const index = excludes.indexOf(key);

  if (index > -1) {
    excludes.splice(index, 1);
  } else {
    excludes.push(key);
  }

  const config = await store.getFullConfig();
  const profile = config.profiles?.[config.activeProfile];

  if (profile) {
    if (!profile.skrining) profile.skrining = {};
    profile.skrining.excludes = excludes.join(';');
  }

  await store.setConfig(config);

  return index === -1;
}
