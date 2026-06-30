import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CircleDot, LogOut, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const links = [
  { to: "/", label: "Chat" },
  { to: "/editor", label: "Code" },
  { to: "/guide", label: "Guide" },
] as const;

export function AppHeader() {
  const [email, setEmail] = useState<string | null>(null);
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) =>
      setEmail(session?.user?.email ?? null),
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <header className="border-b border-border px-4 sm:px-6 py-3 flex items-center justify-between gap-3 bg-background/80 backdrop-blur">
      <div className="flex items-center gap-6">
        <Link to="/" className="flex items-center gap-2">
          <CircleDot className="size-5 text-primary" />
          <span className="font-semibold">Sphero AI</span>
        </Link>
        <nav className="flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm transition-colors",
                pathname === l.to
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted",
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-2">
        {email ? (
          <>
            <span className="hidden sm:inline text-xs text-muted-foreground">{email}</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={async () => {
                await supabase.auth.signOut();
                navigate({ to: "/auth" });
              }}
            >
              <LogOut className="size-4" /> Sign out
            </Button>
          </>
        ) : (
          <Button size="sm" variant="outline" onClick={() => navigate({ to: "/auth" })}>
            <LogIn className="size-4" /> Sign in
          </Button>
        )}
      </div>
    </header>
  );
}
