import { getActiveConfig } from '../configuration';
import { getFlashData, clearFlashData } from '../utils/flashSession';
import { showFlashDataPanel } from '../components/flashPanel';

export async function getFlashDataIfEnabled() {
  const config = await getActiveConfig();
  if (config.flashData?.enabled === false) return {};
  return (await getFlashData()) || {};
}

export async function showFlashDataPanelIfEnabled() {
  const config = await getActiveConfig();
  if (config.flashData?.enabled === false) return;
  showFlashDataPanel();
}
