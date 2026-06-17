import { store as globalStore } from '../store';
import { getFlashData } from '../utils/flashSession';
import { showFlashDataPanel } from '../components/flashPanel';
import { isFeatureEnabled } from '../quota/quota-manager';

/**
 * @param {import('../store.js').DandelionStore} [store]
 */
export async function getFlashDataIfEnabled(store = globalStore) {
  if (!isFeatureEnabled('flashData')) return {};
  const config = await store.getActiveConfig();
  if (config.flashData?.enabled === false) return {};
  return (await getFlashData(config.flashData?.maxAge)) || {};
}

/**
 * @param {import('../store.js').DandelionStore} [store]
 */
export async function showFlashDataPanelIfEnabled(store = globalStore) {
  if (!isFeatureEnabled('flashData')) return;
  const config = await store.getActiveConfig();
  if (config.flashData?.enabled === false) return;
  showFlashDataPanel();
}
