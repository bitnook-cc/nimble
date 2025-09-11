/**
 * API utility for making requests to the backend
 * - In development: calls localhost:3001
 * - In production: calls /api (proxied by Vercel)
 */

const getApiUrl = () => {
  // Check if we're in the browser
  if (typeof window !== 'undefined') {
    // In production, use the relative /api path (Vercel will rewrite it)
    if (window.location.hostname !== 'localhost') {
      return '/api';
    }
  }
  // In development, use the local API server
  return 'http://localhost:3001';
};

export const apiUrl = getApiUrl();

/**
 * Wrapper around fetch for API calls
 */
export const apiFetch = async (
  endpoint: string,
  options?: RequestInit
): Promise<Response> => {
  const url = `${getApiUrl()}${endpoint}`;
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
};

/**
 * GET request helper
 */
export const apiGet = async <T = any>(endpoint: string): Promise<T> => {
  const response = await apiFetch(endpoint);
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  return response.json();
};

/**
 * POST request helper
 */
export const apiPost = async <T = any>(
  endpoint: string,
  data?: any
): Promise<T> => {
  const response = await apiFetch(endpoint, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  return response.json();
};