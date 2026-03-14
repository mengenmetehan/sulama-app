// ============================================================
// API SERVİS
// ============================================================
// Backend URL'ini buradan değiştir.
// Geliştirme: PC'nin local IP adresi (ipconfig ile bul)
// Production: Sunucu adresi
// ============================================================

// ⚠️ BU IP'Yİ KENDİ PC'NİN IP'Sİ İLE DEĞİŞTİR
// PowerShell'de "ipconfig" yaz, "IPv4 Address" kısmına bak
// Örnek: 192.168.1.42
const API_BASE = 'https://sulama-backend-production.up.railway.app/api/irrigation';

// Timeout süresi (ms)
const TIMEOUT = 10000;

async function request(endpoint, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);

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
  // Motor kontrol
  motorOn: () => request('/motor/on', { method: 'POST' }),
  motorOff: () => request('/motor/off', { method: 'POST' }),

  // Durum
  getStatus: () => request('/status'),
  getDashboard: () => request('/dashboard'),
  getHealth: () => request('/health'),

  // Zamanlayıcılar
  getSchedules: () => request('/schedules'),
  createSchedule: (data) => request('/schedules', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateSchedule: (id, data) => request(`/schedules/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteSchedule: (id) => request(`/schedules/${id}`, { method: 'DELETE' }),
  toggleSchedule: (id) => request(`/schedules/${id}/toggle`, { method: 'POST' }),

  // Sensörler
  getSensors: (hours = 24) => request(`/sensors?hours=${hours}`),

  // Loglar
  getLogs: (days = 7) => request(`/logs?days=${days}`),
};

export default api;
