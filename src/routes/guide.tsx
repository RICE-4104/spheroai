import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";

export const Route = createFileRoute("/guide")({
  head: () => ({
    meta: [
      { title: "Sphero scripting guide — Sphero AI" },
      { name: "description", content: "How to write JavaScript and block code to control your Sphero Mini." },
    ],
  }),
  component: GuidePage,
});

function GuidePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <main className="flex-1 px-4 py-10">
        <article className="mx-auto max-w-2xl space-y-8">
          <header>
            <h1 className="text-3xl font-bold tracking-tight">Customization Guide</h1>
            <p className="text-muted-foreground mt-2">
              Write your own scripts to drive your Sphero Mini. You can type JavaScript directly,
              or drag visual blocks together — both are powered by the same Sphero API.
            </p>
          </header>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Getting started</h2>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>Sign in on the <strong>Sign in</strong> page so your work auto-saves.</li>
              <li>Pair your Sphero Mini on the <strong>Chat</strong> tab (Bluetooth must be on).</li>
              <li>Open the <strong>Code</strong> tab, pick JavaScript or Blocks, then press <em>Run</em>.</li>
            </ol>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Available functions</h2>
            <p className="text-sm text-muted-foreground">
              Inside your script, you have these global functions. All return promises — use <code>await</code>.
            </p>
            <div className="rounded-md border border-border bg-card p-4 font-mono text-xs space-y-2">
              <div><span className="text-primary">await setColor</span>(r, g, b) <span className="text-muted-foreground">// 0–255 each</span></div>
              <div><span className="text-primary">await roll</span>(speed, headingDeg, durationMs) <span className="text-muted-foreground">// speed 0–255, heading 0–359</span></div>
              <div><span className="text-primary">await spin</span>(headingDeg)</div>
              <div><span className="text-primary">await stop</span>()</div>
              <div><span className="text-primary">await wait</span>(ms)</div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Example: rainbow square</h2>
            <pre className="rounded-md border border-border bg-card p-4 text-xs overflow-x-auto"><code>{`const colors = [[255,0,0],[255,180,0],[0,255,0],[0,150,255]];
for (let i = 0; i < 4; i++) {
  const [r,g,b] = colors[i];
  await setColor(r, g, b);
  await roll(80, i * 90, 1000);
  await wait(200);
}
await stop();`}</code></pre>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Blocks mode</h2>
            <p className="text-sm text-muted-foreground">
              Prefer drag-and-drop? Switch the toggle at the top of the Code page to <strong>Blocks</strong>.
              Blocks compile to the same JavaScript shown above, so anything you build visually you can
              later view and tweak as code.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Saving progress</h2>
            <p className="text-sm text-muted-foreground">
              When signed in, every script you create appears in the sidebar on the Code page.
              Click any saved script to load it; edits autosave a moment after you stop typing.
            </p>
          </section>
        </article>
      </main>
    </div>
  );
}
