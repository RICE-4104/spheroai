import { createFileRoute } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Bluetooth, BluetoothConnected, Send, CircleDot } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { connectSphero, getConnection, roll, setColor, spin, stop } from "@/lib/sphero";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sphero AI — chat with your robot" },
      { name: "description", content: "An AI chatbot that drives your Sphero Mini over Web Bluetooth." },
    ],
  }),
  component: Page,
});

function Page() {
  const [connected, setConnected] = useState(false);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status, addToolResult } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    async onToolCall({ toolCall }) {
      try {
        if (!getConnection()) throw new Error("Sphero not connected");
        const input = toolCall.input as Record<string, number>;
        switch (toolCall.toolName) {
          case "roll":
            await roll(input.speed, input.heading, input.durationMs);
            break;
          case "setColor":
            await setColor(input.r, input.g, input.b);
            break;
          case "spin":
            await spin(input.heading);
            break;
          case "stop":
            await stop();
            break;
        }
        addToolResult({ tool: toolCall.toolName, toolCallId: toolCall.toolCallId, output: "ok" });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        addToolResult({ tool: toolCall.toolName, toolCallId: toolCall.toolCallId, output: `error: ${msg}` });
      }
    },
    onError: (err) => toast.error(err.message),
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleConnect = async () => {
    try {
      await connectSphero();
      setConnected(true);
      toast.success("Sphero connected!");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || status === "streaming" || status === "submitted") return;
    sendMessage({ text });
    setInput("");
  };

  const busy = status === "streaming" || status === "submitted";

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Toaster />
      <AppHeader />
      <div className="border-b border-border px-6 py-2 flex items-center justify-end">
        <Button onClick={handleConnect} variant={connected ? "secondary" : "default"} size="sm">
          {connected ? <BluetoothConnected className="size-4" /> : <Bluetooth className="size-4" />}
          {connected ? "Connected" : "Connect Sphero"}
        </Button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-2xl space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground py-16">
              <p className="text-sm">Connect your Sphero Mini, then try:</p>
              <ul className="mt-3 text-sm space-y-1">
                <li>"Turn red and drive forward for 2 seconds"</li>
                <li>"Do a little dance"</li>
                <li>"Spin to face left, then go that way fast"</li>
              </ul>
            </div>
          )}
          {messages.map((m: UIMessage) => (
            <Message key={m.id} message={m} />
          ))}
          {busy && <div className="text-sm text-muted-foreground italic">Thinking…</div>}
        </div>
      </div>

      <form onSubmit={handleSend} className="border-t border-border p-4">
        <div className="mx-auto max-w-2xl flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={connected ? "Tell your Sphero what to do…" : "Connect your Sphero first"}
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Button type="submit" disabled={busy || !input.trim()} size="icon">
            <Send className="size-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}

function Message({ message }: { message: UIMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={isUser ? "flex justify-end" : "flex justify-start"}>
      <div
        className={
          isUser
            ? "rounded-2xl bg-primary text-primary-foreground px-4 py-2 max-w-[80%]"
            : "max-w-[85%] space-y-2"
        }
      >
        {message.parts.map((part, i) => {
          if (part.type === "text") {
            return isUser ? (
              <p key={i} className="text-sm whitespace-pre-wrap">{part.text}</p>
            ) : (
              <div key={i} className="prose prose-sm dark:prose-invert max-w-none text-sm">
                <ReactMarkdown>{part.text}</ReactMarkdown>
              </div>
            );
          }
          if (part.type.startsWith("tool-")) {
            const tp = part as { type: string; state?: string; input?: unknown };
            const name = part.type.replace(/^tool-/, "");
            return (
              <div key={i} className="text-xs rounded-md border border-border bg-muted/50 px-2 py-1 font-mono text-muted-foreground">
                <span className="text-foreground">⚙ {name}</span>
                {tp.input ? ` ${JSON.stringify(tp.input)}` : ""}
                {tp.state === "output-available" ? " ✓" : ""}
              </div>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}
