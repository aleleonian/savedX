import { app, BrowserWindow } from 'electron';
import { XBot } from 'xbot-js';

function createWindow() {
  const win = new BrowserWindow({ width: 800, height: 600 });
  win.loadURL('https://www.latigo.com.ar');
}

app.whenReady().then(async () => {
  createWindow();

  const bot = new XBot();
  try {
    await bot.init();
    console.log('[savedX] ✅ XBot initialized');
  } catch (err) {
    console.error('[savedX] ❌ Error during XBot init:', err.message);
  }
});
