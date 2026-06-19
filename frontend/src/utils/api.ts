import { useAuthStore } from '../store/authStore';

const BASE_URL = 'http://localhost:5000/api';

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const { accessToken, refreshToken, setAuth, clearAuth } = useAuthStore.getState();

  const headers = new Headers(options.headers || {});
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const config = {
    ...options,
    headers
  };

  let response = await fetch(`${BASE_URL}${endpoint}`, config);

  // If unauthorized, attempt to silent refresh
  if ((response.status === 401 || response.status === 403) && refreshToken) {
    try {
      const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: refreshToken })
      });

      if (refreshRes.ok) {
        const data = await refreshRes.json();
        const currentUser = useAuthStore.getState().user;
        if (currentUser && data.accessToken) {
          setAuth(currentUser, data.accessToken, refreshToken);
          
          // Retry the request with the new access token
          headers.set('Authorization', `Bearer ${data.accessToken}`);
          response = await fetch(`${BASE_URL}${endpoint}`, config);
        }
      } else {
        clearAuth();
        if (typeof window !== 'undefined') window.location.href = '/login';
      }
    } catch (err) {
      clearAuth();
      if (typeof window !== 'undefined') window.location.href = '/login';
    }
  }

  return response;
}
