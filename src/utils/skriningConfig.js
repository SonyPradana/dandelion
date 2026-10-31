import { store as globalStore } from '../store.js';

/**
 * Resolves the profile key for one operation. Reading `activeProfile` once at
 * the start keeps the read and the write bound to the same profile even when a
 * profile switch lands in between.
 * @param {import('../store.js').DandelionStore} store
 * @param {string|null} [profileKey]
 * @returns {Promise<string>}
 */
async function resolveProfileKey(store, profileKey) {
  if (profileKey) return profileKey;
  const config = await store.getFullConfig();
  return config.activeProfile;
}

/**
 * Reads the skrining answers object from one profile.
 * @param {import('../store.js').DandelionStore} [store]
 * @param {string|null} [profileKey]
 * @returns {Promise<Object>}
 */
export async function getAnswers(store = globalStore, profileKey = null) {
  const key = await resolveProfileKey(store, profileKey);
  const config = await store.getFullConfig();
  const answers = config.profiles?.[key]?.skrining?.answers;
  return typeof answers === 'object' && answers !== null ? { ...answers } : {};
}

/**
 * Replaces the whole skrining answers object in one profile.
 * @param {Object} answers
 * @param {import('../store.js').DandelionStore} [store]
 * @param {string|null} [profileKey]
 * @returns {Promise<void>}
 */
export async function saveAnswers(answers, store = globalStore, profileKey = null) {
  const key = await resolveProfileKey(store, profileKey);

  await store.updateProfile(key, (profile) => {
    if (!profile.skrining) profile.skrining = {};
    profile.skrining.answers = { ...answers };
  });
}

/**
 * Stores one radio answer, keyed by the first radio id of the question.
 * @param {string} key - Radio id of the first option, e.g. answer8AA
 * @param {string} value - Radio value, e.g. B
 * @param {import('../store.js').DandelionStore} [store]
 * @param {string|null} [profileKey]
 * @returns {Promise<void>}
 */
export async function addAnswer(key, value, store = globalStore, profileKey = null) {
  const resolved = await resolveProfileKey(store, profileKey);

  await store.updateProfile(resolved, (profile) => {
    if (!profile.skrining) profile.skrining = {};
    const answers = profile.skrining.answers;
    const next = typeof answers === 'object' && answers !== null ? answers : {};
    next[key] = value;
    profile.skrining.answers = next;
  });
}

/**
 * Removes one stored radio answer.
 * @param {string} key
 * @param {import('../store.js').DandelionStore} [store]
 * @param {string|null} [profileKey]
 * @returns {Promise<void>}
 */
export async function removeAnswer(key, store = globalStore, profileKey = null) {
  const resolved = await resolveProfileKey(store, profileKey);

  await store.updateProfile(resolved, (profile) => {
    const answers = profile.skrining?.answers;
    if (typeof answers !== 'object' || answers === null) return;
    delete answers[key];
  });
}

/**
 * Checks whether a question already has a stored answer.
 * @param {string} key
 * @param {import('../store.js').DandelionStore} [store]
 * @param {string|null} [profileKey]
 * @returns {Promise<boolean>}
 */
export async function isAnswerPinned(key, store = globalStore, profileKey = null) {
  const answers = await getAnswers(store, profileKey);
  return Object.hasOwn(answers, key);
}

/**
 * Reads the skrining excludes list of one profile as an array.
 * @param {import('../store.js').DandelionStore} [store]
 * @param {string|null} [profileKey]
 * @returns {Promise<string[]>}
 */
export async function getSkriningExcludes(store = globalStore, profileKey = null) {
  const key = await resolveProfileKey(store, profileKey);
  const config = await store.getFullConfig();
  return (config.profiles?.[key]?.skrining?.excludes || '').split(';').filter(Boolean);
}

/**
 * Adds or removes one question id from the skrining excludes list.
 * @param {string} key - Radio id of the first option, e.g. answer8AA
 * @param {import('../store.js').DandelionStore} [store]
 * @param {string|null} [profileKey]
 * @returns {Promise<boolean>} True when now excluded, false when now included.
 */
export async function toggleSkriningExclude(key, store = globalStore, profileKey = null) {
  const resolved = await resolveProfileKey(store, profileKey);

  return await store.updateProfile(resolved, (profile) => {
    if (!profile.skrining) profile.skrining = {};
    const excludes = [...new Set((profile.skrining.excludes || '').split(';').filter(Boolean))];
    const index = excludes.indexOf(key);

    if (index > -1) {
      excludes.splice(index, 1);
    } else {
      excludes.push(key);
    }

    profile.skrining.excludes = excludes.join(';');
    return index === -1;
  });
}
