// Minimal Sphero Mini BLE driver (Web Bluetooth).
// Protocol reference: Sphero V2 API used by Mini.

const SERVICE = "00010001-574f-4f20-5370-6865726f2121";
const API_CHAR = "00010002-574f-4f20-5370-6865726f2121";
const ANTIDOS_SERVICE = "00020001-574f-4f20-5370-6865726f2121";
const ANTIDOS_CHAR = "00020005-574f-4f20-5370-6865726f2121";

// Device IDs
const DID_POWER = 0x13;
const DID_DRIVING = 0x16;
const DID_USER_IO = 0x1a;

// Command IDs
const CID_WAKE = 0x0d;
const CID_SLEEP = 0x01;
const CID_DRIVE = 0x07;
const CID_LED = 0x0e;

const SOP = 0x8d;
const EOP = 0xd8;
const ESC = 0xab;
const FLAGS = 0x0a;

function escapeBytes(bytes: number[]): number[] {
  const out: number[] = [];
  for (const b of bytes) {
    if (b === SOP || b === EOP || b === ESC) {
      out.push(ESC, b & ~0x88);
    } else out.push(b);
  }
  return out;
}

let seq = 0;
function buildPacket(did: number, cid: number, data: number[] = []): Uint8Array {
  const s = seq++ & 0xff;
  const body = [FLAGS, did, cid, s, ...data];
  const sum = body.reduce((a, b) => (a + b) & 0xff, 0);
  const checksum = ~sum & 0xff;
  const escaped = escapeBytes([...body, checksum]);
  return new Uint8Array([SOP, ...escaped, EOP]);
}

export type SpheroConnection = {
  device: BluetoothDevice;
  api: BluetoothRemoteGATTCharacteristic;
  disconnect: () => Promise<void>;
};

let conn: SpheroConnection | null = null;

export function getConnection() {
  return conn;
}

export class SpheroError extends Error {
  hint: string;
  constructor(message: string, hint: string) {
    super(message);
    this.hint = hint;
    this.name = "SpheroError";
  }
}

function diagnoseBluetoothEnvironment(): SpheroError | null {
  if (typeof navigator === "undefined") return null;
  const nav = navigator as unknown as { bluetooth?: unknown; userAgent?: string };
  if (!nav.bluetooth) {
    const ua = nav.userAgent || "";
    if (/Firefox|FxiOS/i.test(ua)) {
      return new SpheroError(
        "Firefox doesn't support Web Bluetooth.",
        "Open this page in Chrome, Edge, or Brave on desktop, or Chrome on Android.",
      );
    }
    if (/iPhone|iPad|iPod/i.test(ua)) {
      return new SpheroError(
        "iOS browsers don't support Web Bluetooth.",
        "Use a desktop browser (Chrome/Edge) or Android Chrome. On iOS you'd need a native app.",
      );
    }
    return new SpheroError(
      "Web Bluetooth isn't available here.",
      "Use Chrome, Edge, or Brave on desktop or Android. Make sure the page is loaded over HTTPS or localhost.",
    );
  }
  if (typeof window !== "undefined" && window.self !== window.top) {
    return new SpheroError(
      "Bluetooth is blocked inside this preview frame.",
      "Click 'Open in new tab' to launch the app standalone — browsers don't allow Bluetooth in embedded frames.",
    );
  }
  if (typeof window !== "undefined" && window.isSecureContext === false) {
    return new SpheroError(
      "This page isn't a secure context.",
      "Open the app over HTTPS (or http://localhost). Web Bluetooth refuses to run on plain HTTP.",
    );
  }
  return null;
}

export async function connectSphero(): Promise<SpheroConnection> {
  const envError = diagnoseBluetoothEnvironment();
  if (envError) throw envError;

  let device: BluetoothDevice;
  try {
    device = await navigator.bluetooth.requestDevice({
      // Sphero Mini broadcasts as "SM-XXXX"; older Sphero / Sprk+ as "SK-" / "SB-".
      filters: [
        { namePrefix: "SM-" },
        { namePrefix: "SK-" },
        { namePrefix: "SB-" },
        { services: [SERVICE] },
      ],
      optionalServices: [SERVICE, ANTIDOS_SERVICE],
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/cancelled|User cancelled|chose not/i.test(msg)) {
      throw new SpheroError(
        "No Sphero picked.",
        "Wake your Sphero by setting it on the charger or shaking it, then click Connect and pick it from the list.",
      );
    }
    if (/permissions policy|disallowed|SecurityError/i.test(msg)) {
      throw new SpheroError(
        "The browser blocked the Bluetooth picker.",
        "Open the app in its own tab (not inside an iframe) and try again. On Linux, install BlueZ ≥ 5.43.",
      );
    }
    if (/globally disabled|Bluetooth adapter not available|adapter is off/i.test(msg)) {
      throw new SpheroError(
        "Your computer's Bluetooth is turned off.",
        "Turn Bluetooth on in your OS settings, then click Connect again.",
      );
    }
    throw new SpheroError(
      "Couldn't open the Bluetooth picker.",
      `Make sure Bluetooth is on and your Sphero is awake. Details: ${msg}`,
    );
  }

  let server: BluetoothRemoteGATTServer;
  try {
    server = await device.gatt!.connect();
  } catch (e) {
    throw new SpheroError(
      "Couldn't connect to the Sphero.",
      "Move closer (within ~3 m), wake the robot (shake it or put it on the charger), then try again. If another device is connected to it, disconnect that first.",
    );
  }

  try {
    // Anti-DOS unlock
    const antiSvc = await server.getPrimaryService(ANTIDOS_SERVICE);
    const antiChar = await antiSvc.getCharacteristic(ANTIDOS_CHAR);
    const unlock = new TextEncoder().encode("usetheforce...band");
    await antiChar.writeValue(unlock.buffer as ArrayBuffer);
  } catch (e) {
    throw new SpheroError(
      "Couldn't unlock the Sphero.",
      "This usually means the device you picked isn't a Sphero Mini. Forget it from your OS Bluetooth settings and try again.",
    );
  }

  const svc = await server.getPrimaryService(SERVICE);
  const api = await svc.getCharacteristic(API_CHAR);

  conn = {
    device,
    api,
    async disconnect() {
      try {
        await sleepRobot();
      } catch {
        // ignore
      }
      device.gatt?.disconnect();
      conn = null;
    },
  };

  device.addEventListener("gattserverdisconnected", () => {
    conn = null;
  });

  await wake();
  await setColor(0, 255, 100);
  return conn;
}

async function write(packet: Uint8Array) {
  if (!conn) throw new Error("Sphero not connected");
  await conn.api.writeValue(packet.buffer as ArrayBuffer);
}

export async function wake() {
  await write(buildPacket(DID_POWER, CID_WAKE));
}

export async function sleepRobot() {
  await write(buildPacket(DID_POWER, CID_SLEEP));
}

export async function setColor(r: number, g: number, b: number) {
  // mask 0x0E = front LED RGB
  await write(buildPacket(DID_USER_IO, CID_LED, [0x00, 0x0e, r & 0xff, g & 0xff, b & 0xff]));
}

export async function roll(speed: number, headingDeg: number, durationMs = 1000) {
  const s = Math.max(0, Math.min(255, Math.round(speed)));
  const h = ((Math.round(headingDeg) % 360) + 360) % 360;
  const flag = 0x00; // forward
  await write(buildPacket(DID_DRIVING, CID_DRIVE, [s, (h >> 8) & 0xff, h & 0xff, flag]));
  if (durationMs > 0) {
    await new Promise((r) => setTimeout(r, durationMs));
    await stop(h);
  }
}

export async function stop(headingDeg = 0) {
  const h = ((Math.round(headingDeg) % 360) + 360) % 360;
  await write(buildPacket(DID_DRIVING, CID_DRIVE, [0, (h >> 8) & 0xff, h & 0xff, 0x00]));
}

export async function spin(headingDeg: number) {
  const h = ((Math.round(headingDeg) % 360) + 360) % 360;
  await write(buildPacket(DID_DRIVING, CID_DRIVE, [0, (h >> 8) & 0xff, h & 0xff, 0x00]));
}
