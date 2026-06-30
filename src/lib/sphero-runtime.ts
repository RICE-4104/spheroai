import { roll, setColor, spin, stop, getConnection } from "@/lib/sphero";

export const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function runUserScript(code: string) {
  if (!getConnection()) throw new Error("Sphero not connected. Pair it on the Chat tab.");
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  const fn = new Function(
    "setColor",
    "roll",
    "spin",
    "stop",
    "wait",
    `return (async () => { ${code} \n})();`,
  );
  await fn(setColor, roll, spin, stop, wait);
}
