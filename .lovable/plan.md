## Goal

1. Make the app dark-themed (so it looks native as a desktop app).
2. Ship it as a Windows desktop `.exe` bundle that runs like a real Windows app, with Bluetooth working the way Windows apps expect (system-level BLE picker, not a browser prompt).

## Approach note on "Nativefier"

Nativefier is deprecated and, more importantly, it just wraps a remote URL in a stock Chromium shell — it does not implement the `select-bluetooth-device` handler, so `navigator.bluetooth.requestDevice` hangs forever inside a Nativefier build. The project already has a proper Electron shell (`electron/main.cjs`) that *does* implement that handler and auto-picks the Sphero. That is the correct "Nativefier-style" wrapper for this app, so I'll keep and extend it rather than swap to Nativefier.

If you'd rather I use Nativefier literally (accepting that Bluetooth won't work), tell me and I'll switch.

## 1. Dark mode

- Force the app into permanent dark mode by adding `class="dark"` to `<html>` in `src/routes/__root.tsx` (the existing `.dark` tokens in `src/styles.css` already define the full palette).
- Set `<meta name="color-scheme" content="dark">` and `--background` fallback so there is no white flash on load.
- Update Electron `BrowserWindow` `backgroundColor` to match the dark token (`#0b0b0f` is already set — verify and align).
- Sanity-check `AppHeader`, `ConnectSphero`, chat bubbles, and the editor/guide pages render correctly on dark (they already use semantic tokens, so this should just work; I'll spot-fix any hard-coded light colors I find).

## 2. Windows Electron packaging

Extend the existing Electron setup rather than replace it:

- Confirm `vite.config.ts` produces relative asset paths for `file://` loading. Current config uses `@lovable.dev/vite-tanstack-config` which targets Cloudflare SSR — for Electron we need a **client-only static build** with `base: './'`. I'll add a second build script (`build:electron`) that runs Vite in SPA mode outputting to `dist/electron/` with relative base, plus an `index.html` that mounts the client router (no SSR).
- Update `electron/main.cjs` to load `dist/electron/index.html`, keep the `select-bluetooth-device` auto-pick for `SM-/SK-/SB-` prefixes, and keep the Bluetooth permission + pairing handlers so Windows' BLE stack is used directly.
- Add packaging scripts using `@electron/packager` (per the sandbox's electron guidance — `electron-builder` fails here):
  - `package:win` → `electron-packager . SpheroAI --platform=win32 --arch=x64 --out=electron-release --overwrite`
  - Outputs `electron-release/SpheroAI-win32-x64/SpheroAI.exe` — a double-clickable Windows app.
- Add `electron/preload.cjs` (empty but present) for future IPC, and set `icon` to a bundled `.ico` if one exists (skip otherwise).
- Document the build steps in `README.md`.

## Files touched

```text
src/routes/__root.tsx        # force .dark class + color-scheme meta
src/styles.css               # ensure html/body bg uses --background
electron/main.cjs            # load dist/electron/index.html, dark bg
electron/preload.cjs         # new, minimal
vite.config.ts               # add electron SPA build mode (base: './')
package.json                 # add build:electron, package:win, devDeps: electron, @electron/packager
README.md                    # Windows build instructions
```

## Deliverable

After running `bun run build:electron && bun run package:win` on a Windows machine (or cross-compiled from Linux), the user gets `SpheroAI-win32-x64/SpheroAI.exe` — a dark-themed standalone Windows app that pairs with the Sphero Mini via the OS Bluetooth stack.

## Open question

Do you want me to actually run the Windows packaging inside this sandbox and hand back a downloadable `.zip` of the built app, or just wire up the scripts so you can build it yourself?
