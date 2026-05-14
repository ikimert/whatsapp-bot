# WhatsApp Randevu Electron Kurulumu

Bu dokuman, projeye Electron masaustu test ortami eklenirken yapilan degisiklikleri ve sifirdan ayni kurulumu yapmak icin gereken adimlari anlatir.

## 1. Degistirilen ve Eklenen Dosyalar

### Kok `package.json`

Electron uygulamasinin ana paket tanimi kok klasordeki `package.json` dosyasina eklendi.

Eklenen alanlar:

```json
{
  "name": "whatsapp-randevu-electron",
  "version": "0.1.0",
  "private": true,
  "description": "WhatsApp randevu otomasyonu icin Electron masaustu kabugu.",
  "main": "main.js"
}
```

Eklenen scriptler:

```json
{
  "start": "node scripts/dev-electron.js",
  "electron:dev": "node scripts/dev-electron.js",
  "electron:open": "electron .",
  "build:web": "npm run build --prefix \"whatsap otonasyonu\"",
  "dist": "npm run build:web && electron-builder"
}
```

Eklenen paketleme ayari:

```json
{
  "build": {
    "appId": "com.whatsapp.randevu",
    "productName": "WhatsApp Randevu",
    "files": [
      "main.js",
      "preload.js",
      "whatsap otonasyonu/dist/**/*"
    ],
    "directories": {
      "output": "release"
    }
  }
}
```

Kullanilan Electron bagimliliklari:

```json
{
  "devDependencies": {
    "electron": "^42.0.1",
    "electron-builder": "^26.8.1"
  }
}
```

### Kok `package-lock.json`

`package.json` metadata ve script degisiklikleriyle uyumlu olacak sekilde guncellendi.

### Kok `main.js`

Electron ana sureci yeniden duzenlendi.

Eklenenler:

- `BrowserWindow` ile masaustu penceresi aciliyor.
- Varsayilan pencere boyutu `1280x860`, minimum boyut `1024x700`.
- Pencere basligi `WhatsApp Randevu`.
- Guvenli web ayarlari:
  - `contextIsolation: true`
  - `nodeIntegration: false`
  - `sandbox: true`
  - `preload: preload.js`
- Test modunda `ELECTRON_RENDERER_URL` varsa Vite adresi yukleniyor.
- Paketlenmis modda `whatsap otonasyonu/dist/index.html` yukleniyor.
- Build bulunamazsa kullaniciya aciklama gosteren fallback HTML yukleniyor.
- Harici linkler Electron icinde acilmak yerine sistem tarayicisina yonlendiriliyor.
- Sayfa yukleme hatalari console'a yazdiriliyor.
- Windows icin `app.setAppUserModelId('com.whatsapp.randevu')` eklendi.

Cikarilan/degistirilen davranis:

- Eski `win.loadURL('http://localhost:5173')` sabit ve kontrolsuz kullanim kaldirildi.
- `ready-to-show` beklenerek pencere gostermek yerine pencere dogrudan `show: true` ile aciliyor. Bu, Windows test ortaminda pencerenin gorunmeden kalmasini engellemek icin yapildi.

### Kok `preload.js`

Yeni dosya eklendi.

Amaci:

- Electron ana ortamindan renderer tarafina kontrollu ve guvenli bilgi gecirmek.
- `window.desktopApp` altinda platform ve versiyon bilgilerini sunmak.

Icerik ozeti:

```js
contextBridge.exposeInMainWorld('desktopApp', {
  platform: process.platform,
  versions: {
    chrome: process.versions.chrome,
    electron: process.versions.electron,
    node: process.versions.node,
  },
});
```

### Kok `scripts/dev-electron.js`

Yeni launcher dosyasi eklendi.

Amaci:

- Backend API'yi baslatmak.
- Frontend Vite dev server'i baslatmak.
- Iki servis de hazir olunca Electron penceresini acmak.
- Electron kapandiginda API ve Vite sureclerini de temiz kapatmak.

Onemli davranislar:

- Backend icin `npm run server` calistirir.
- Frontend icin `npm run dev` calistirir.
- Backend hazirlik kontrolu: `http://localhost:3001`
- Frontend hazirlik kontrolu: `http://localhost:5173`
- Windows'ta `npm.cmd` dogrudan `spawn` edilmez; `cmd.exe /d /s /c npm.cmd ...` uzerinden calistirilir.
- Child process ortamindan `ELECTRON_RUN_AS_NODE` silinir.
- Electron kapandiginda alt surecler `taskkill /T /F` ile kapatilir.

### Kok `baslat-electron.bat`

Yeni Windows baslatma dosyasi eklendi.

Icerik:

```bat
@echo off
cd /d "%~dp0"
set ELECTRON_RUN_AS_NODE=
npm.cmd start
if errorlevel 1 pause
```

Amaci:

- Proje kokune gecmek.
- `ELECTRON_RUN_AS_NODE` ortam degiskenini temizlemek.
- `npm.cmd start` ile tum test sistemini baslatmak.
- Hata olursa pencereyi kapatmadan bekletmek.

### `whatsap otonasyonu/package.json`

Frontend projesinin Vite dev scripti sabit port kullanacak sekilde degistirildi.

Eski:

```json
"dev": "vite"
```

Yeni:

```json
"dev": "vite --host localhost --port 5173 --strictPort"
```

Neden:

- Electron launcher, Vite'in kesin olarak `localhost:5173` uzerinde calisacagini varsayar.
- `--strictPort`, port doluysa sessizce baska porta gecilmesini engeller. Boylece Electron yanlis adrese baglanmaz.

### `whatsap otonasyonu/index.html`

Sayfa basligi guncellendi.

Eski:

```html
<title>Arena Web Dev App</title>
```

Yeni:

```html
<title>WhatsApp Randevu</title>
```

### `whatsap otonasyonu/dist/index.html`

`npm.cmd run build:web` calistirilinca olusan production web build dosyasidir.

Kalici olarak kaynak kod elle burada degistirilmedi; Vite build ciktisidir.

### Silinen Dosyalar

Kalici bir proje dosyasi silinmedi.

Gecici debug dosyalari olusturulup temizlendi:

- `electron-start.log`
- `electron-start.err`

## 2. `npm run start` Ne Yapar?

Kok klasorde calistirilan komut:

```bash
npm.cmd start
```

veya:

```bash
npm run start
```

Aslinda sunu calistirir:

```bash
node scripts/dev-electron.js
```

Adim adim akis:

1. `scripts/dev-electron.js` baslar.
2. Proje kokunu ve frontend klasorunu bulur:
   - Kok: `whatsap otomasyonu yeni`
   - Frontend/backend app klasoru: `whatsap otonasyonu`
3. Backend API'yi baslatir:
   ```bash
   npm run server
   ```
4. Backend `server.js` dosyasini calistirir.
5. Backend `localhost:3001` uzerinde dinlemeye baslar.
6. Frontend Vite dev server'i baslatilir:
   ```bash
   npm run dev
   ```
7. Vite `localhost:5173` uzerinde baslar.
8. Launcher iki servisi de HTTP istegiyle kontrol eder:
   - `http://localhost:3001`
   - `http://localhost:5173`
9. Iki servis de cevap verince Electron calistirilir:
   ```bash
   electron .
   ```
10. Electron `main.js` dosyasini ana surec olarak kullanir.
11. Electron penceresi acilir ve `http://localhost:5173` adresindeki Vite arayuzunu yukler.
12. Electron kapatilirsa launcher backend ve frontend sureclerini de kapatir.

## 3. Backend API

Backend API adresi:

```text
http://localhost:3001
```

Ana kontrol endpoint'i:

```text
GET http://localhost:3001/
```

Beklenen cevap:

```text
Webhook Calisiyor
```

Randevu endpointleri:

```text
GET    http://localhost:3001/randevu
POST   http://localhost:3001/randevu
DELETE http://localhost:3001/randevu/:id
```

Webhook endpointleri:

```text
GET  http://localhost:3001/webhook
POST http://localhost:3001/webhook
```

Backend dosyasi:

```text
whatsap otonasyonu/server.js
```

## 4. Frontend Vite

Frontend Vite adresi:

```text
http://localhost:5173
```

Calisan script:

```bash
npm run dev
```

Gercek script:

```bash
vite --host localhost --port 5173 --strictPort
```

Frontend dosyalari:

```text
whatsap otonasyonu/src/main.tsx
whatsap otonasyonu/src/App.tsx
whatsap otonasyonu/src/index.css
```

Frontend, API adresini su sirayla belirler:

1. `VITE_API_URL` varsa onu kullanir.
2. Yoksa varsayilan olarak `http://localhost:3001` kullanir.

Launcher `VITE_API_URL` degerini `http://localhost:3001` olarak verir.

## 5. Electron Nasil Aciliyor?

Electron'u baslatan komut:

```bash
electron .
```

Electron kok `package.json` icindeki su alanı okur:

```json
"main": "main.js"
```

Bu nedenle Electron ana surec olarak kokteki `main.js` dosyasini calistirir.

Test modunda:

1. `scripts/dev-electron.js`, `ELECTRON_RENDERER_URL=http://localhost:5173` degerini verir.
2. `main.js`, bu deger varsa Vite dev server'i yukler.
3. Masaustu penceresinde React/Vite arayuzu acilir.

Paketlenmis modda:

1. `ELECTRON_RENDERER_URL` verilmez.
2. `main.js`, su dosyayi arar:
   ```text
   whatsap otonasyonu/dist/index.html
   ```
3. Dosya varsa onu `loadFile` ile acar.
4. Dosya yoksa fallback hata sayfasi gosterir.

## 6. `baslat-electron.bat` Ne Ise Yarar?

`baslat-electron.bat`, Windows'ta projeyi kolay baslatmak icin eklendi.

Kullanim:

1. Proje kok klasorunu ac.
2. `baslat-electron.bat` dosyasina cift tikla.
3. Komut penceresi acilir.
4. Backend, Vite ve Electron birlikte baslar.
5. Test bitince Electron penceresini ve gerekirse komut penceresini kapat.

Dosyanin yaptiklari:

- `cd /d "%~dp0"` ile `.bat` dosyasinin bulundugu kok klasore gecer.
- `set ELECTRON_RUN_AS_NODE=` ile Electron'u bozabilecek ortam degiskenini temizler.
- `npm.cmd start` ile launcher'i calistirir.
- Hata olursa `pause` ile pencereyi acik tutar.

Windows PowerShell'de `npm` bazen execution policy nedeniyle calismayabilir. Bu yuzden dokumanda ve dosyalarda `npm.cmd` kullanimi tercih edildi.

## 7. Windows'ta Karsilasilan Hatalar ve Cozumleri

### `spawn EINVAL`

Problem:

Node.js icinden Windows'ta su sekilde dogrudan `npm.cmd` calistirmak hata verdi:

```js
spawn('npm.cmd', ['run', 'dev'])
```

Hata:

```text
Error: spawn EINVAL
```

Kok neden:

Windows ve kullanilan Node surumunde `.cmd` dosyasini dogrudan `spawn` etmek stabil calismadi.

Cozum:

`scripts/dev-electron.js` icinde Windows icin `npm.cmd` dogrudan calistirilmadi. Bunun yerine `cmd.exe` uzerinden calistirildi:

```js
cmd.exe /d /s /c npm.cmd run dev
```

Kodda bunun karsiligi:

```js
const npmCommand = process.platform === 'win32' ? 'cmd.exe' : 'npm';

function npmArgs(args) {
  if (process.platform !== 'win32') {
    return args;
  }

  return ['/d', '/s', '/c', ['npm.cmd', ...args].join(' ')];
}
```

### `ELECTRON_RUN_AS_NODE`

Problem:

Sistemde `ELECTRON_RUN_AS_NODE=1` ortam degiskeni vardi.

Bu durumda Electron, normal masaustu uygulamasi gibi degil Node.js gibi calisti. Sonuc olarak `main.js` icinde:

```js
const { app } = require('electron');
```

beklenen Electron `app` nesnesini vermedi ve su hata olustu:

```text
TypeError: Cannot read properties of undefined (reading 'setAppUserModelId')
```

Kok neden:

`ELECTRON_RUN_AS_NODE=1`, Electron runtime davranisini degistirir. Electron penceresi acmak yerine Node modunda calisir.

Cozum:

Launcher child process ortamindan bu degiskeni siliyor:

```js
function childEnv(overrides = {}) {
  const env = {
    ...process.env,
    ...overrides,
  };

  delete env.ELECTRON_RUN_AS_NODE;
  return env;
}
```

Ayrica `baslat-electron.bat` icinde de temizleniyor:

```bat
set ELECTRON_RUN_AS_NODE=
```

### `ready-to-show` ile pencerenin gorunmemesi

Problem:

Ilk kurulumda Electron penceresi `show: false` ile olusturulup `ready-to-show` eventi bekleniyordu.

Windows test ortaminda servisler ve Electron surecleri calissa bile pencere gorunur hale gelmedi.

Kok neden:

`ready-to-show` olayi bazi grafik/renderer kosullarinda beklenen anda tetiklenmeyebilir veya pencere gorunurlugu test ortaminda takilabilir.

Cozum:

Pencere dogrudan gorunur acilacak sekilde degistirildi:

```js
const win = new BrowserWindow({
  show: true
});
```

Ve eski bekleme blogu kaldirildi:

```js
win.once('ready-to-show', () => {
  win.show();
});
```

### Vite'in `127.0.0.1` yerine `localhost/[::1]` uzerinde acilmasi

Problem:

Vite bazen `localhost` icin IPv6 loopback (`[::1]`) uzerinde dinledi. Launcher ise ilk denemede `127.0.0.1` bekliyordu.

Bu nedenle Vite calistigi halde kontrol istegi basarisiz oldu.

Cozum:

Tum adresler `localhost` ile hizalandi:

```text
Backend:  http://localhost:3001
Frontend: http://localhost:5173
```

Vite scripti de sabitlendi:

```json
"dev": "vite --host localhost --port 5173 --strictPort"
```

## 8. Sifirdan Calistirma

Kok klasore gec:

```bash
cd "C:\Users\user\OneDrive\Desktop\whatsap otomasyonu yeni"
```

Electron bagimlilikleri yoksa kokte kur:

```bash
npm.cmd install
```

Frontend/backend bagimlilikleri yoksa app klasorunde kur:

```bash
cd "whatsap otonasyonu"
npm.cmd install
cd ..
```

Test ortamını baslat:

```bash
npm.cmd start
```

Alternatif olarak:

```text
baslat-electron.bat
```

## 9. Dogrulama

Backend kontrol:

```bash
curl http://localhost:3001/
```

Beklenen:

```text
Webhook Calisiyor
```

Frontend kontrol:

```bash
curl http://localhost:5173/
```

Beklenen:

```text
HTML cevabi ve HTTP 200
```

Production web build kontrol:

```bash
npm.cmd run build:web
```

Beklenen:

```text
vite build basarili olur ve whatsap otonasyonu/dist/index.html uretilir
```

## 10. Kapatma

Electron penceresini kapatinca launcher API ve Vite sureclerini de kapatir.

Gerekirse Windows'ta manuel kontrol icin:

```powershell
Get-Process electron,node -ErrorAction SilentlyContinue
```

Elle kapatmak gerekirse ana `npm.cmd start` surecini veya acik komut penceresini kapatmak yeterlidir.
