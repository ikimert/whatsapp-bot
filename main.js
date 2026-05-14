const { app, BrowserWindow, shell } = require('electron');
const fs = require('node:fs');
const path = require('node:path');

const rendererUrl = process.env.ELECTRON_RENDERER_URL || 'http://localhost:5173';

function loadFallbackPage(window) {
  const html = `
    <!doctype html>
    <html lang="tr">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>WhatsApp Randevu</title>
        <style>
          body {
            margin: 0;
            min-height: 100vh;
            display: grid;
            place-items: center;
            background: #18181b;
            color: #f4f4f5;
            font-family: Arial, sans-serif;
          }
          main {
            max-width: 560px;
            padding: 32px;
            line-height: 1.5;
          }
          code {
            color: #25d366;
          }
        </style>
      </head>
      <body>
        <main>
          <h1>Uygulama arayuzu bulunamadi</h1>
          <p>Test icin <code>npm start</code> komutunu kok klasorde calistirin. Paketleme icin once web arayuzunu build etmek gerekir.</p>
        </main>
      </body>
    </html>
  `;

  window.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`).catch((error) => {
    console.error(`[electron] Yedek sayfa yuklenemedi: ${error.message}`);
  });
}

function createWindow() {
  const win = new BrowserWindow({
    title: 'WhatsApp Randevu',
    width: 1280,
    height: 860,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#18181b',
    show: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url).catch((error) => {
      console.error(`[electron] Harici link acilamadi: ${error.message}`);
    });

    return { action: 'deny' };
  });

  win.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    console.error(`[electron] Sayfa yuklenemedi: ${validatedURL} (${errorCode}) ${errorDescription}`);
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(rendererUrl).catch((error) => {
      console.error(`[electron] Vite arayuzu yuklenemedi: ${error.message}`);
      loadFallbackPage(win);
    });
    return;
  }

  const indexPath = path.join(__dirname, 'whatsap otonasyonu', 'dist', 'index.html');

  if (fs.existsSync(indexPath)) {
    win.loadFile(indexPath).catch((error) => {
      console.error(`[electron] Build arayuzu yuklenemedi: ${error.message}`);
      loadFallbackPage(win);
    });
    return;
  }

  loadFallbackPage(win);
}

app.setAppUserModelId('com.whatsapp.randevu');

app.whenReady().then(createWindow).catch((error) => {
  console.error(`[electron] Uygulama baslatilamadi: ${error.message}`);
  app.quit();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
