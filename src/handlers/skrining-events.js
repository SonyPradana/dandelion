import bus from '../utils/hooks';
import { notify } from '../components/notification';
import { incrementBatch } from '../utils/productivityTracker';

bus.on('skriningForm:didFill', async (ctx) => {
  const { result } = ctx;

  await incrementBatch({
    radio: result.radio,
    dropdown: result.dropdown,
    freetext: result.freetext,
  });

  if (document.activeElement && document.activeElement !== document.body) {
    document.activeElement.blur();
  }

  notify.info('Selesai', `Berhasil, ${result.total} ditemukan.`, 2500);

  if (result.total > 0) {
    setTimeout(() => {
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: 'smooth',
      });
    }, 100);
  }
});
