import { getActiveConfig } from '../configuration';
import { getFlashData, clearFlashData } from '../utils/flashSession';
import { showFlashDataPanel } from '../components/flashPanel';
import { isFeatureEnabled } from '../quota/quota-manager';

export async function getFlashDataIfEnabled() {
  if (!isFeatureEnabled('flashData')) return {};
  const config = await getActiveConfig();
  if (config.flashData?.enabled === false) return {};
  return (await getFlashData()) || {};
}

export async function showFlashDataPanelIfEnabled() {
  if (!isFeatureEnabled('flashData')) return;
  const config = await getActiveConfig();
  if (config.flashData?.enabled === false) return;
  showFlashDataPanel();
}
