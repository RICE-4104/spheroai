// Electron entry for the Sphero AI desktop build.
// Web Bluetooth is disabled by default in Electron; we have to handle
// `select-bluetooth-device` explicitly or `navigator.bluetooth.requestDevice`
// hangs forever.

const { app, BrowserWindow, session } = require("electron");
const path = require("path");

let mainWindow;
let bluetoothCallback = null;
const discoveredDevices = new Map();

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 760,
    backgroundColor: "#0b0b0f",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      // Web Bluetooth requires this experimental flag on some Electron versions.
      enableBlinkFeatures: "WebBluetooth",
    },
  });

  // The renderer asks for a device; we forward the list back to it via the IPC
  // channel `bluetooth-pairing-request`, and the page picks one with
  // `selectBluetoothDevice(deviceId)` from preload — or we simply auto-pick the
  // first matching Sphero, which is what most users want.
  mainWindow.webContents.on(
    "select-bluetooth-device",
    (event, deviceList, callback) => {
      event.preventDefault();
      bluetoothCallback = callback;
      for (const d of deviceList) discoveredDevices.set(d.deviceId, d);

      const sphero = deviceList.find((d) => /^SM-|^SK-|^SB-/i.test(d.deviceName || ""));
      if (sphero) {
        bluetoothCallback = null;
        callback(sphero.deviceId);
      }
      // Otherwise keep scanning; Chromium will fire this event again with more
      // devices until the user cancels or one matches.
    },
  );

  // Auto-grant Bluetooth permission prompts.
  session.defaultSession.setPermissionCheckHandler((_wc, permission) => {
    if (permission === "bluetooth") return true;
    return false;
  });
  session.defaultSession.setBluetoothPairingHandler((_details, callback) => {
    // Sphero Mini doesn't require a PIN — just confirm.
    callback({ confirmed: true });
  });

  const indexHtml = path.join(__dirname, "..", "dist", "client", "index.html");
  mainWindow.loadFile(indexHtml).catch(() => {
    // Fallback to dev server during local development.
    mainWindow.loadURL("http://localhost:8080");
  });
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
