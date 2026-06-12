import { store } from '../store';
import bus from '../utils/hooks';
import { getActiveConfig } from '../configuration';
import { getFlashData } from '../utils/flashSession';
import { showFlashDataPanel } from '../components/flashPanel';
import { isFeatureEnabled } from '../quota/quota-manager';

bus.on('component:flash:panel-open', () => store.clearFlashData());
bus.on('component:flash:save', (data) => store.setFlashData(data));

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
