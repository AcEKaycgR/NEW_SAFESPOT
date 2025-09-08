/**
 * Authentication utilities for API calls
 * Provides mock authentication for development/testing
 */

export interface AuthHeaders {
  'Authorization': string;
  'Content-Type': string;
}

/**
 * Get authentication headers for API calls
 * In production, this would get real user data from authentication context
 */
export function getAuthHeaders(): AuthHeaders {
  // Mock user data for development/testing
  // Format expected by backend: "Bearer userId:email:name"
  const mockUser = {
    id: '123',
    email: 'test@example.com',
    name: 'TestUser'
  };

  return {
    'Authorization': `Bearer ${mockUser.id}:${mockUser.email}:${mockUser.name}`,
    'Content-Type': 'application/json'
  };
}

/**
 * Make an authenticated fetch request
 */
export async function authenticatedFetch(url: string, options: RequestInit = {}) {
  const authHeaders = getAuthHeaders();
  
  return fetch(url, {
    ...options,
    headers: {
      ...authHeaders,
      ...options.headers
    }
  });
}
