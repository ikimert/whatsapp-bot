const { spawn } = require('node:child_process');
const http = require('node:http');
const https = require('node:https');
const path = require('node:path');

const rootDir = path.resolve(__dirname, '..');
const appDir = path.join(rootDir, 'whatsap otonasyonu');
const rendererUrl = process.env.ELECTRON_RENDERER_URL || 'http://localhost:5173';
const apiUrl = process.env.VITE_API_URL || 'http://localhost:3001';
const npmCommand = process.platform === 'win32' ? 'cmd.exe' : 'npm';
const children = new Set();
let shuttingDown = false;

function log(message) {
  console.log(`[electron-dev] ${message}`);
}

function npmArgs(args) {
  if (process.platform !== 'win32') {
    return args;
  }

  return ['/d', '/s', '/c', ['npm.cmd', ...args].join(' ')];
}

function childEnv(overrides = {}) {
  const env = {
    ...process.env,
    ...overrides,
  };

  delete env.ELECTRON_RUN_AS_NODE;
  return env;
}

function spawnManaged(name, command, args, options = {}) {
  let child;

  try {
    child = spawn(command, args, {
      cwd: options.cwd || rootDir,
      env: childEnv(options.env),
      stdio: 'inherit',
      windowsHide: false,
    });
  } catch (error) {
    console.error(`[electron-dev] ${name} baslatilamadi: ${error.message}`);
    shutdown(1);
    return null;
  }

  children.add(child);

  child.on('error', (error) => {
    console.error(`[electron-dev] ${name} baslatilamadi: ${error.message}`);
    shutdown(1);
  });

  child.on('exit', (code, signal) => {
    children.delete(child);

    if (shuttingDown) {
      return;
    }

    if (name === 'electron') {
      shutdown(code || 0);
      return;
    }

    console.error(
      `[electron-dev] ${name} beklenmeden kapandi. Kod: ${code ?? 'yok'}, sinyal: ${signal ?? 'yok'}`,
    );
    shutdown(code || 1);
  });

  return child;
}

function waitForUrl(targetUrl, timeoutMs = 60000, intervalMs = 500) {
  const startedAt = Date.now();

  return new Promise((resolve, reject) => {
    const attempt = () => {
      const parsedUrl = new URL(targetUrl);
      const client = parsedUrl.protocol === 'https:' ? https : http;
      const request = client.get(parsedUrl, (response) => {
        response.resume();
        resolve();
      });

      request.setTimeout(2500, () => {
        request.destroy(new Error('timeout'));
      });

      request.on('error', (error) => {
        if (Date.now() - startedAt >= timeoutMs) {
          reject(new Error(`${targetUrl} hazir olmadi: ${error.message}`));
          return;
        }

        setTimeout(attempt, intervalMs);
      });
    };

    attempt();
  });
}

function stopChild(child) {
  if (!child?.pid || child.killed) {
    return;
  }

  if (process.platform === 'win32') {
    spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], {
      stdio: 'ignore',
      windowsHide: true,
    });
    return;
  }

  child.kill('SIGTERM');
}

function shutdown(exitCode = 0) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  log('calisan servisler kapatiliyor...');

  for (const child of Array.from(children).reverse()) {
    stopChild(child);
  }

  setTimeout(() => process.exit(exitCode), 500).unref();
}

async function main() {
  try {
    log('API ve Vite baslatiliyor...');

    const apiProcess = spawnManaged('api', npmCommand, npmArgs(['run', 'server']), {
      cwd: appDir,
      env: {
        PORT: '3001',
      },
    });

    const viteProcess = spawnManaged('vite', npmCommand, npmArgs(['run', 'dev']), {
      cwd: appDir,
      env: {
        VITE_API_URL: apiUrl,
      },
    });

    if (!apiProcess || !viteProcess) {
      return;
    }

    await Promise.all([waitForUrl(apiUrl), waitForUrl(rendererUrl)]);

    log('Electron penceresi aciliyor...');

    const electronPath = require('electron');
    spawnManaged('electron', electronPath, ['.'], {
      cwd: rootDir,
      env: {
        ELECTRON_RENDERER_URL: rendererUrl,
        VITE_API_URL: apiUrl,
      },
    });
  } catch (error) {
    console.error(`[electron-dev] Baslatma hatasi: ${error.message}`);
    shutdown(1);
  }
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
process.on('uncaughtException', (error) => {
  console.error(`[electron-dev] Beklenmeyen hata: ${error.message}`);
  shutdown(1);
});

main();
