// ============================================================
// API SERVİS
// ============================================================
const BASE_URL = 'https://sulama-backend-production.up.railway.app';
const API_BASE = `${BASE_URL}/api/irrigation`;
const AUTH_BASE = `${BASE_URL}/api/auth`;

// Timeout süresi (ms)
const TIMEOUT = 10000;

// In-memory token (uygulama kapanınca sıfırlanır)
let _token = null;
let _onUnauthorized = null;

export function setToken(token) {
  _token = token;
}

export function clearToken() {
  _token = null;
}

// AuthContext tarafından set edilir, 401 gelince çağrılır
export function setOnUnauthorized(callback) {
  _onUnauthorized = callback;
}

async function request(url, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (_token) {
    headers['Authorization'] = `Bearer ${_token}`;
  }

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers,
    });

    clearTimeout(timeoutId);

    if (res.status === 401) {
      clearToken();
      _onUnauthorized?.();
      throw new Error('Oturum süresi doldu, lütfen tekrar giriş yapın');
    }

    if (!res.ok) {
      const errorBody = await res.text().catch(() => '');
      throw new Error(`API Hatası ${res.status}: ${errorBody}`);
    }

    // 204 No Content için boş dön
    if (res.status === 204) return null;

    return res.json();
  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      throw new Error('Bağlantı zaman aşımına uğradı');
    }
    throw error;
  }
}

const api = {
  // Auth
  login: (username, password) => request(`${AUTH_BASE}/login`, {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  }),

  // Motor kontrol
  motorOn: () => request(`${API_BASE}/motor/on`, { method: 'POST' }),
  motorOff: () => request(`${API_BASE}/motor/off`, { method: 'POST' }),

  // Durum
  getStatus: () => request(`${API_BASE}/status`),
  getDashboard: () => request(`${API_BASE}/dashboard`),
  getHealth: () => request(`${API_BASE}/health`),

  // Zamanlayıcılar
  getSchedules: () => request(`${API_BASE}/schedules`),
  createSchedule: (data) => request(`${API_BASE}/schedules`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateSchedule: (id, data) => request(`${API_BASE}/schedules/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteSchedule: (id) => request(`${API_BASE}/schedules/${id}`, { method: 'DELETE' }),
  toggleSchedule: (id) => request(`${API_BASE}/schedules/${id}/toggle`, { method: 'POST' }),

  // Sensörler
  getSensors: (hours = 24) => request(`${API_BASE}/sensors?hours=${hours}`),

  // Loglar
  getLogs: (days = 7) => request(`${API_BASE}/logs?days=${days}`),
};

export default api;
