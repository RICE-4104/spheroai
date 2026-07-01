import { useState } from "react";
import { Bluetooth, BluetoothConnected, HelpCircle, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { connectSphero, SpheroError } from "@/lib/sphero";

type Props = {
  connected: boolean;
  onConnected: () => void;
  onDisconnected?: () => void;
};

export function ConnectSphero({ connected, onConnected }: Props) {
  const [helpOpen, setHelpOpen] = useState(false);
  const [errorTitle, setErrorTitle] = useState<string | null>(null);
  const [errorHint, setErrorHint] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  const inIframe = typeof window !== "undefined" && window.self !== window.top;

  const openStandalone = () => {
    window.open(window.location.href, "_blank", "noopener");
  };

  const handleConnect = async () => {
    setErrorTitle(null);
    setErrorHint(null);
    setConnecting(true);
    try {
      await connectSphero();
      onConnected();
      toast.success("Sphero connected!");
    } catch (e) {
      if (e instanceof SpheroError) {
        setErrorTitle(e.message);
        setErrorHint(e.hint);
        setHelpOpen(true);
      } else {
        const msg = e instanceof Error ? e.message : String(e);
        setErrorTitle("Couldn't connect to Sphero.");
        setErrorHint(msg);
        setHelpOpen(true);
      }
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={handleConnect}
        disabled={connecting}
        variant={connected ? "secondary" : "default"}
        size="sm"
      >
        {connected ? (
          <BluetoothConnected className="size-4" />
        ) : (
          <Bluetooth className="size-4" />
        )}
        {connected ? "Connected" : connecting ? "Connecting…" : "Connect Sphero"}
      </Button>
      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="ghost" aria-label="Connection help">
            <HelpCircle className="size-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{errorTitle ?? "How to connect your Sphero Mini"}</DialogTitle>
            <DialogDescription>
              {errorHint ?? "Follow these steps the first time you pair the robot."}
            </DialogDescription>
          </DialogHeader>
          <ol className="text-sm space-y-2 list-decimal pl-5 text-muted-foreground">
            <li>Use Chrome, Edge, or Brave on desktop, or Chrome on Android. Firefox and iOS aren't supported.</li>
            <li>Turn Bluetooth on in your operating system.</li>
            <li>Wake the Sphero Mini: put it on the charger or shake it until the LED pulses.</li>
            <li>Click <b>Connect Sphero</b> and pick the <code>SM-XXXX</code> entry.</li>
            <li>If the picker is empty, move within ~3 m and disconnect the Sphero from any other phone/app first.</li>
          </ol>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            {inIframe && (
              <Button variant="outline" onClick={openStandalone}>
                <ExternalLink className="size-4" /> Open in new tab
              </Button>
            )}
            <Button onClick={handleConnect} disabled={connecting}>
              Try again
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
