"use client";

import { LogIn, LogOut, User } from "lucide-react";
import { useEffect, useState } from "react";

import { authService } from "@/lib/services/auth-service";

import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

export function AuthButton() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check authentication status on mount
    authService.fetchUser().then((response) => {
      if (response.user) {
        setUser(response.user);
      }
      setLoading(false);
    });
  }, []);

  const handleLogin = async () => {
    try {
      setLoading(true);
      await authService.login();
      // Fetch user data after successful login
      const response = await authService.fetchUser();
      if (response.user) {
        setUser(response.user);
        // Emit auth-changed event for other components
        window.dispatchEvent(new CustomEvent('auth-changed', { detail: { authenticated: true } }));
      }
    } catch (error) {
      console.error('Login failed:', error);
      // You could show a toast notification here
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    setUser(null);
    // Emit auth-changed event for other components
    window.dispatchEvent(new CustomEvent('auth-changed', { detail: { authenticated: false } }));
  };

  if (loading) {
    return (
      <Button variant="ghost" size="sm" disabled>
        <User className="w-4 h-4" />
      </Button>
    );
  }

  if (!user) {
    return (
      <Button variant="outline" size="sm" onClick={handleLogin}>
        <LogIn className="w-4 h-4 mr-2" />
        Sign in with Google
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {user.loginCount && (
        <span className="text-xs text-muted-foreground font-medium">
          Logins: {user.loginCount}
        </span>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="p-0 hover:opacity-80 transition-opacity">
            <Avatar className="h-8 w-8 ring-2 ring-transparent hover:ring-primary/50 transition-all cursor-pointer">
              <AvatarImage src={user.picture} alt={user.name} />
              <AvatarFallback>
                {user.name?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <div className="flex items-center justify-start gap-2 p-2">
            <div className="flex flex-col space-y-1 leading-none">
              <p className="font-medium">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              {user.loginCount && (
                <p className="text-xs text-muted-foreground">
                  Total logins: {user.loginCount}
                </p>
              )}
            </div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}