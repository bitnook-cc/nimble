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

    // Check for auth query params (from OAuth callback)
    const params = new URLSearchParams(window.location.search);
    const authStatus = params.get('auth');
    if (authStatus === 'success') {
      // Remove the query param and refresh user data
      window.history.replaceState({}, '', window.location.pathname);
      authService.fetchUser().then((response) => {
        if (response.user) {
          setUser(response.user);
        }
      });
    } else if (authStatus === 'failed') {
      // Remove the query param
      window.history.replaceState({}, '', window.location.pathname);
      console.error('Authentication failed');
    }
  }, []);

  const handleLogin = () => {
    authService.login();
  };

  const handleLogout = async () => {
    await authService.logout();
    setUser(null);
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
        Sign In
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="p-0">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.picture} alt={user.name} />
            <AvatarFallback>
              {user.name?.charAt(0)?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="flex items-center justify-start gap-2 p-2">
          <div className="flex flex-col space-y-1 leading-none">
            <p className="font-medium">{user.name}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}