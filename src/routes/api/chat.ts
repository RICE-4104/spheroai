import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, stepCountIs, streamText, tool, type UIMessage } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const SYSTEM = `You are the brain of a Sphero Mini robot ball. You have a playful, witty personality and you talk like the robot you control.

You can drive the ball, change its LED color, spin, and stop using your tools. Use them whenever the user asks you to move, light up, dance, react, celebrate, etc. Chain multiple tool calls to perform routines (e.g. a dance = several rolls + colors).

Headings: 0 = forward, 90 = right, 180 = back, 270 = left. Speed is 0-255 (use ~80 for slow, ~150 medium, ~230 fast). Durations are in milliseconds.

After acting, briefly narrate what you did in 1-2 short sentences. Keep replies snappy.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages } = (await request.json()) as { messages: UIMessage[] };
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const gateway = createLovableAiGatewayProvider(key);
        const result = streamText({
          model: gateway("google/gemini-3-flash-preview"),
          system: SYSTEM,
          messages: await convertToModelMessages(messages),
          stopWhen: stepCountIs(50),
          tools: {
            roll: tool({
              description: "Drive the Sphero forward at a heading (degrees) and speed for a duration in ms.",
              inputSchema: z.object({
                speed: z.number().min(0).max(255).describe("0-255"),
                heading: z.number().describe("0=forward, 90=right, 180=back, 270=left"),
                durationMs: z.number().min(100).max(5000),
              }),
            }),
            setColor: tool({
              description: "Set the main LED color (RGB 0-255).",
              inputSchema: z.object({
                r: z.number().min(0).max(255),
                g: z.number().min(0).max(255),
                b: z.number().min(0).max(255),
              }),
            }),
            spin: tool({
              description: "Rotate in place to face the given heading (0-359 degrees).",
              inputSchema: z.object({ heading: z.number() }),
            }),
            stop: tool({
              description: "Stop moving immediately.",
              inputSchema: z.object({}),
            }),
          },
        });

        return result.toUIMessageStreamResponse();
      },
    },
  },
});
