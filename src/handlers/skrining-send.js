import bus from '../utils/hooks';
import { sendButton } from '../components/sendButton';
import { controlPanel } from '../components/controlPanel';

export function sendFromFormSkrining(ctx) {
  const submitBtn = document.querySelector('#sv-nav-complete input.sd-navigation__complete-btn');
  if (!submitBtn) {
    const btn = document.getElementById('dandelion-send-btn');
    if (btn) controlPanel.remove(btn);
    return;
  }

  submitBtn.click();
  bus.emit('skrining:send:formSkrining', { result: ctx.result });
}

export function initializeSkriningSend() {
  bus.on('skriningForm:didFill', (ctx) => {
    if (!ctx.result || ctx.result.total <= 0) return;
    if (document.getElementById('dandelion-send-btn')) return;

    const btn = sendButton();

    btn.addEventListener('click', () => sendFromFormSkrining(ctx));

    controlPanel.mount(btn, 2);
  });
}
