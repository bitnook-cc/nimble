import { apiUrl } from '@/lib/utils/api';

interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

interface AuthResponse {
  user?: User;
  error?: string;
}

class AuthService {
  private static instance: AuthService;
  private user: User | null = null;

  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async fetchUser(): Promise<AuthResponse> {
    try {
      const response = await fetch(`${apiUrl}/auth/user`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        this.user = data.user;
        return { user: data.user };
      } else if (response.status === 401) {
        this.user = null;
        return { error: 'Not authenticated' };
      } else {
        throw new Error('Failed to fetch user');
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      return { error: 'Failed to fetch user' };
    }
  }

  async logout(): Promise<void> {
    try {
      const response = await fetch(`${apiUrl}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        this.user = null;
        // Reload the page to clear any client-side state
        window.location.reload();
      } else {
        throw new Error('Failed to logout');
      }
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }

  login(): void {
    // Redirect to the Google OAuth login endpoint
    window.location.href = `${apiUrl}/auth/google`;
  }

  getUser(): User | null {
    return this.user;
  }

  isAuthenticated(): boolean {
    return this.user !== null;
  }
}

export const authService = AuthService.getInstance();