# SpheroAI
<img src="https://github.com/RICE-4104/spheroai/blob/main/logo.png?raw=true" height="150" align="right"/>
Talk to your Sphero using AI.

## Windows desktop app

The `electron/` folder wraps the app in a proper Windows shell so Web Bluetooth talks to the OS Bluetooth stack instead of a browser prompt.

### Build a `.exe`

On any machine with Node 20+:

```bash
bun install
bunx electron-packager . SpheroAI \
  --platform=win32 --arch=x64 \
  --out=electron-release --overwrite \
  --ignore='^/src' --ignore='^/public' --ignore='^/electron-release' \
  --ignore='^/\\.'
```

Output: `electron-release/SpheroAI-win32-x64/SpheroAI.exe` — double-clickable.

### Run in dev

```bash
bunx electron .
```

By default the app loads `https://sphero-talkie-bot.lovable.app`. Point it elsewhere with `SPHEROAI_URL=http://localhost:8080 bunx electron .`.

### Story
Me (Lorenzo) and Ali (the creator of the Repo) had a playdate. Somehow we became AI bros after I showed Ali sir Tuffness lovable AI. We started vibe coding and we just couldn't stop. We installed Wispr Flow and now we've gotten kind of addicted to AI. Please help us, please, please, please! Could you please pay us $300 so that we can pay for medical bills, which will hopefully get the AI out of our heads? Ahhhh!

### Song
 so basically, one time, by the way, it's me, Ali. I was looking for a job, then I found a job.
