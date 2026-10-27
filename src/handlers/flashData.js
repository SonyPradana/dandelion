import { store as globalStore } from '../store';
import {
  getFlashData,
  setFlashData,
  isSkriningMandiri,
  REGISTER_FORM_SOURCE,
} from '../utils/flashSession';
import { showFlashDataPanel } from '../components/flashPanel';
import { isFeatureEnabled } from '../quota/quota-manager';

/**
 * @param {import('../store.js').DandelionStore} [store]
 */
export async function getFlashDataIfEnabled(store = globalStore) {
  const config = await store.getActiveConfig();
  const data = await getFlashData(config.flashData?.maxAge);
  if (data?._source === REGISTER_FORM_SOURCE) return data;
  if (!isFeatureEnabled('flashData')) return {};
  if (config.flashData?.enabled === false) return {};
  return data || {};
}

/**
 * @param {import('../store.js').DandelionStore} [store]
 */
export async function showFlashDataPanelIfEnabled(store = globalStore) {
  if (!isFeatureEnabled('flashData')) return;
  const config = await store.getActiveConfig();
  if (config.flashData?.enabled === false) return;

  const defaults = config.zenMode?.defaultPinneds;
  const flashData = await getFlashData(config.flashData?.maxAge, store);
  if (flashData?._source === REGISTER_FORM_SOURCE && isSkriningMandiri(flashData)) {
    const pinneds = { ...(defaults || {}), ...(flashData.pinneds || {}) };
    delete pinneds['skrining mandiri'];
    await setFlashData({ pinneds }, store);
    showFlashDataPanel({ initialData: pinneds, clearOnOpen: false });
    return;
  }

  showFlashDataPanel({ initialData: defaults });
}
