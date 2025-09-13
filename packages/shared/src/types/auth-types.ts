/**
 * User type representing an authenticated user
 * This is used both in session and for API responses
 */
export interface AuthUser {
  id: string;
  googleId: string;
  email: string;
  name: string;
  picture?: string | null;
  loginCount: number;
  lastLoginAt: string | Date;
  createdAt: string | Date;
}

/**
 * Response from auth endpoints
 */
export interface AuthResponse {
  user: AuthUser | null;
  isAuthenticated: boolean;
}