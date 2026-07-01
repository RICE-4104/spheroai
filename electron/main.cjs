// SpheroAI — Electron desktop wrapper (Windows/macOS/Linux).
// Loads the published Lovable app and adds the OS-level Bluetooth handlers
// that browsers block. This is the same idea as Nativefier, but with a real
// `select-bluetooth-device` handler so navigator.bluetooth actually works.

const { app, BrowserWindow, session } = require("electron");
const path = require("path");

const APP_URL = process.env.SPHEROAI_URL || "https://sphero-talkie-bot.lovable.app";

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 760,
    backgroundColor: "#0b0b0f",
    title: "SpheroAI",
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      enableBlinkFeatures: "WebBluetooth",
    },
  });

  // Auto-pick the first Sphero the OS discovers.
  mainWindow.webContents.on(
    "select-bluetooth-device",
    (event, deviceList, callback) => {
      event.preventDefault();
      const sphero = deviceList.find((d) =>
        /^SM-|^SK-|^SB-/i.test(d.deviceName || ""),
      );
      if (sphero) callback(sphero.deviceId);
      // Otherwise let scanning continue; this handler fires again as more
      // devices show up. If the user closes the picker we get an empty list.
    },
  );

  // Grant Bluetooth permission automatically.
  session.defaultSession.setPermissionCheckHandler((_wc, permission) => {
    return permission === "bluetooth";
  });
  session.defaultSession.setBluetoothPairingHandler((_details, callback) => {
    callback({ confirmed: true });
  });

  // Prefer the local production build if it exists (dist/client/index.html),
  // otherwise load the hosted app. This lets us ship an offline-capable .exe
  // when built with `bun run build`, and fall back to the live URL otherwise.
  const localIndex = path.join(__dirname, "..", "dist", "client", "index.html");
  const fs = require("fs");
  if (fs.existsSync(localIndex)) {
    mainWindow.loadFile(localIndex).catch(() => mainWindow.loadURL(APP_URL));
  } else {
    mainWindow.loadURL(APP_URL);
  }
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
