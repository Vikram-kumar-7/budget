let API_URL = import.meta.env.VITE_API_URL || '/api';
if (API_URL.startsWith('http') && !API_URL.endsWith('/api') && !API_URL.endsWith('/api/')) {
  API_URL = API_URL.endsWith('/') ? `${API_URL}api` : `${API_URL}/api`;
}

class Api {
  constructor() {
    // Support both token keys for backward compat
    this.token = localStorage.getItem('bm_token') || localStorage.getItem('token');
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('bm_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('bm_token');
    localStorage.removeItem('token');
  }

  async request(endpoint, options = {}) {
    const url = `${API_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['x-auth-token'] = this.token;
    }

    const response = await fetch(url, { ...options, headers });

    // Handle empty responses (e.g. 204 No Content)
    let data = {};
    const text = await response.text();
    if (text) {
      try { data = JSON.parse(text); } catch { data = { msg: text }; }
    }

    if (!response.ok) {
      if (response.status === 401) {
        this.clearToken();
        window.dispatchEvent(new CustomEvent('auth-failed'));
      }
      throw new Error(data.msg || 'Something went wrong');
    }

    return data;
  }

  get(endpoint) { return this.request(endpoint, { method: 'GET' }); }
  post(endpoint, body) { return this.request(endpoint, { method: 'POST', body: JSON.stringify(body) }); }
  put(endpoint, body) { return this.request(endpoint, { method: 'PUT', body: JSON.stringify(body) }); }
  patch(endpoint, body) { return this.request(endpoint, { method: 'PATCH', body: JSON.stringify(body) }); }
  delete(endpoint) { return this.request(endpoint, { method: 'DELETE' }); }
}

export const api = new Api();
