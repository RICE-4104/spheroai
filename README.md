# SpheroAI
<img src="https://github.com/RICE-4104/spheroai/blob/main/logo.png?raw=true" height="150" align="right"/>
Talk to your Sphero using AI.

## Windows desktop app (Nativefier)

Package the published app as a standalone Windows `.exe` using Nativefier:

```bash
npm install -g nativefier
bun run package:nativefier
```

Output: `electron-release/SpheroAI-win32-x64/SpheroAI.exe` — double-clickable, no browser needed.

The script wraps `https://sphero-talkie-bot.lovable.app` with Web Bluetooth enabled (`enableBlinkFeatures: WebBluetooth`) and injects `electron/nativefier-inject.js` for dark-mode polish. Drop a 256×256 `build/icon.ico` if you want a custom taskbar icon.

### Fallback: custom Electron wrapper

Nativefier can't register the main-process `select-bluetooth-device` handler, so if the BLE picker never appears, use the bundled custom Electron shell instead — it auto-picks any `SM-`/`SK-`/`SB-` device:

```bash
bun run package:win     # → electron-release/SpheroAI-win32-x64/SpheroAI.exe
bun run electron        # dev run
```

### Story
Me (Lorenzo) and Ali (the creator of the Repo) had a playdate. Somehow we became AI bros after I showed Ali sir Tuffness lovable AI. We started vibe coding and we just couldn't stop. We installed Wispr Flow and now we've gotten kind of addicted to AI. Please help us, please, please, please! Could you please pay us $300 so that we can pay for medical bills, which will hopefully get the AI out of our heads? Ahhhh!

### Song
 so basically, one time, by the way, it's me, Ali. I was looking for a job, then I found a job.
