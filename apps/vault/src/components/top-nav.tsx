"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getPortalUrl } from "@/lib/portal-url";

interface User {
  id: string;
  email?: string;
  tags?: string[];
}

interface TopNavProps {
  onMenuClick?: () => void;
}

export function TopNav({ onMenuClick }: TopNavProps = {}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  useEffect(() => {
    let active = true;
    const check = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (active) {
        setUser(error || !user ? null : { id: user.id, email: user.email });
        setLoading(false);
      }
    };
    void check();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "INITIAL_SESSION") {
        setTimeout(() => {
          void check();
          router.refresh();
        }, 0);
      }
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase, router]);

  const handleLogin = () => {
    // Redirect to portal login
    window.location.href = getPortalUrl();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.refresh();
  };

  if (loading) {
    return (
      <nav className="bg-black text-white">
        <div className="max-w-[120rem] mx-auto px-12 py-2.5 lg:py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <h1 className="text-2xl font-heading font-bold">Nimble</h1>
              <span className="ml-2 text-sm text-white/70">Vault</span>
            </div>
            <div className="h-9 w-20 bg-white/20 animate-pulse rounded"></div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-black text-white">
      <div className="max-w-[120rem] mx-auto px-12 py-2.5 lg:py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Mobile menu button */}
            {onMenuClick && (
              <button
                onClick={onMenuClick}
                className="md:hidden p-2 hover:bg-white/10 rounded-md transition-colors"
                aria-label="Toggle navigation menu"
              >
                <Menu className="w-5 h-5" aria-hidden="true" />
              </button>
            )}

            <div className="flex items-center">
              <h1 className="text-2xl font-heading font-bold">Nimble</h1>
              <span className="ml-2 text-sm text-white/70">Vault</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <div className="text-sm text-white/80">
                  Welcome, {user.email || `User ${user.id.slice(0, 8)}`}
                  {user.tags && user.tags.length > 0 && (
                    <span className="ml-2 text-xs bg-white/20 px-2 py-1 rounded">
                      {user.tags.join(", ")}
                    </span>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="text-white border-white/30 hover:bg-white/10"
                >
                  Logout
                </Button>
              </>
            ) : (
              <Button
                onClick={handleLogin}
                className="bg-primary text-white hover:bg-destructive"
              >
                Login
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
