import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, useCallback } from "react";
import { Play, Save, Plus, Trash2, Code2, Blocks } from "lucide-react";
import Editor from "@monaco-editor/react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppHeader } from "@/components/AppHeader";
import { runUserScript } from "@/lib/sphero-runtime";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/editor")({
  head: () => ({
    meta: [
      { title: "Code editor — Sphero AI" },
      { name: "description", content: "Write JavaScript or drag blocks to program your Sphero Mini." },
    ],
  }),
  component: EditorPage,
});

type Script = {
  id: string;
  name: string;
  kind: "js" | "blocks";
  code: string;
  blocks_xml: string | null;
};

const DEFAULT_JS = `// Drive in a square, cycling color each side.
const colors = [[255,0,0],[255,180,0],[0,255,0],[0,150,255]];
for (let i = 0; i < 4; i++) {
  const [r,g,b] = colors[i];
  await setColor(r, g, b);
  await roll(80, i * 90, 1000);
  await wait(200);
}
await stop();`;

const LOCAL_KEY = "sphero.editor.draft";

function EditorPage() {
  const [mode, setMode] = useState<"js" | "blocks">("js");
  const [code, setCode] = useState(DEFAULT_JS);
  const [blocksXml, setBlocksXml] = useState<string | null>(null);
  const [name, setName] = useState("Untitled");
  const [scripts, setScripts] = useState<Script[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  // Auth + script list
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) =>
      setUserId(session?.user?.id ?? null),
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) {
      setScripts([]);
      try {
        const draft = localStorage.getItem(LOCAL_KEY);
        if (draft) {
          const d = JSON.parse(draft);
          setCode(d.code ?? DEFAULT_JS);
          setName(d.name ?? "Untitled");
          setMode(d.kind ?? "js");
          setBlocksXml(d.blocks_xml ?? null);
        }
      } catch {}
      return;
    }
    supabase
      .from("scripts")
      .select("*")
      .order("updated_at", { ascending: false })
      .then(({ data }) => setScripts((data as Script[]) ?? []));
  }, [userId]);

  // Persist local draft when no user
  useEffect(() => {
    if (userId) return;
    localStorage.setItem(
      LOCAL_KEY,
      JSON.stringify({ code, name, kind: mode, blocks_xml: blocksXml }),
    );
  }, [code, name, mode, blocksXml, userId]);

  const loadScript = (s: Script) => {
    setCurrentId(s.id);
    setName(s.name);
    setMode(s.kind);
    setCode(s.code);
    setBlocksXml(s.blocks_xml);
  };

  const newScript = () => {
    setCurrentId(null);
    setName("Untitled");
    setCode(DEFAULT_JS);
    setBlocksXml(null);
    setMode("js");
  };

  const save = async () => {
    if (!userId) {
      toast.error("Sign in to save scripts to the cloud.");
      return;
    }
    const payload = { name, kind: mode, code, blocks_xml: blocksXml, user_id: userId };
    if (currentId) {
      const { error } = await supabase.from("scripts").update(payload).eq("id", currentId);
      if (error) return toast.error(error.message);
      toast.success("Saved");
    } else {
      const { data, error } = await supabase.from("scripts").insert(payload).select().single();
      if (error) return toast.error(error.message);
      setCurrentId(data.id);
      toast.success("Saved");
    }
    const { data } = await supabase
      .from("scripts")
      .select("*")
      .order("updated_at", { ascending: false });
    setScripts((data as Script[]) ?? []);
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("scripts").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setScripts((s) => s.filter((x) => x.id !== id));
    if (currentId === id) newScript();
  };

  const run = async () => {
    setRunning(true);
    try {
      await runUserScript(code);
      toast.success("Done");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Toaster />
      <AppHeader />
      <div className="flex-1 flex flex-col md:flex-row min-h-0">
        {/* Sidebar */}
        <aside className="md:w-64 border-b md:border-b-0 md:border-r border-border bg-card/30 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">My scripts</h2>
            <Button size="sm" variant="ghost" onClick={newScript}>
              <Plus className="size-4" />
            </Button>
          </div>
          {!userId && (
            <p className="text-xs text-muted-foreground">
              Sign in to save scripts. Drafts stay in this browser.
            </p>
          )}
          <ul className="space-y-1">
            {scripts.map((s) => (
              <li
                key={s.id}
                className={cn(
                  "group flex items-center justify-between rounded-md px-2 py-1.5 text-sm cursor-pointer",
                  currentId === s.id ? "bg-secondary" : "hover:bg-muted",
                )}
                onClick={() => loadScript(s)}
              >
                <span className="truncate flex items-center gap-2">
                  {s.kind === "blocks" ? <Blocks className="size-3.5" /> : <Code2 className="size-3.5" />}
                  {s.name}
                </span>
                <button
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    remove(s.id);
                  }}
                >
                  <Trash2 className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* Main editor */}
        <main className="flex-1 flex flex-col min-h-0">
          <div className="border-b border-border p-3 flex flex-wrap items-center gap-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="max-w-xs"
              placeholder="Script name"
            />
            <div className="inline-flex rounded-md border border-border overflow-hidden">
              <button
                onClick={() => setMode("js")}
                className={cn(
                  "px-3 py-1.5 text-sm flex items-center gap-1.5",
                  mode === "js" ? "bg-secondary text-secondary-foreground" : "hover:bg-muted",
                )}
              >
                <Code2 className="size-4" /> JavaScript
              </button>
              <button
                onClick={() => setMode("blocks")}
                className={cn(
                  "px-3 py-1.5 text-sm flex items-center gap-1.5",
                  mode === "blocks" ? "bg-secondary text-secondary-foreground" : "hover:bg-muted",
                )}
              >
                <Blocks className="size-4" /> Blocks
              </button>
            </div>
            <div className="flex-1" />
            <Button variant="outline" onClick={save}>
              <Save className="size-4" /> Save
            </Button>
            <Button onClick={run} disabled={running}>
              <Play className="size-4" /> {running ? "Running…" : "Run"}
            </Button>
          </div>

          <div className="flex-1 min-h-[500px]">
            {mode === "js" ? (
              <Editor
                height="100%"
                defaultLanguage="javascript"
                theme="vs-dark"
                value={code}
                onChange={(v) => setCode(v ?? "")}
                options={{ fontSize: 13, minimap: { enabled: false }, scrollBeyondLastLine: false }}
              />
            ) : (
              <BlocklyPane
                xml={blocksXml}
                onChange={(generatedCode, xml) => {
                  setCode(generatedCode);
                  setBlocksXml(xml);
                }}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function BlocklyPane({
  xml,
  onChange,
}: {
  xml: string | null;
  onChange: (code: string, xml: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const wsRef = useRef<unknown>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const init = useCallback(async () => {
    if (!ref.current) return;
    const Blockly = await import("blockly");
    const { javascriptGenerator } = await import("blockly/javascript");
    const { registerSpheroBlocks, SPHERO_TOOLBOX } = await import("@/lib/sphero-blocks");
    registerSpheroBlocks();
    const ws = Blockly.inject(ref.current, {
      toolbox: SPHERO_TOOLBOX as unknown as Blockly.utils.toolbox.ToolboxDefinition,
      theme: Blockly.Themes.Classic,
      grid: { spacing: 20, length: 1, colour: "#333", snap: true },
      trashcan: true,
    });
    wsRef.current = ws;
    if (xml) {
      try {
        Blockly.Xml.domToWorkspace(Blockly.utils.xml.textToDom(xml), ws);
      } catch (e) {
        console.warn("Failed to load blocks XML", e);
      }
    }
    ws.addChangeListener(() => {
      const code = javascriptGenerator.workspaceToCode(ws);
      const dom = Blockly.Xml.workspaceToDom(ws);
      const xmlText = Blockly.Xml.domToText(dom);
      onChangeRef.current(code, xmlText);
    });
  }, [xml]);

  useEffect(() => {
    init();
    return () => {
      try {
        (wsRef.current as { dispose?: () => void } | null)?.dispose?.();
      } catch {}
      wsRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={ref} className="h-full w-full" style={{ minHeight: 500 }} />;
}
