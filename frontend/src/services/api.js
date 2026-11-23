const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('vsg_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers
  };

  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  try {
    const res = await fetch(url, {
      ...options,
      headers
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      if (res.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/register')) {
        localStorage.removeItem('vsg_token');
        localStorage.removeItem('vsg_user');
        window.location.reload();
      }
      throw new Error(data.error || `HTTP ${res.status}: ${res.statusText}`);
    }

    return data;
  } catch (err) {
    throw err;
  }
}

export const api = {
  // Auth & Onboarding
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (data) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => request('/auth/me'),
  logout: () => request('/auth/logout', { method: 'POST' }),
  changePassword: (currentPassword, newPassword) => request('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword })
  }),
  regenerateMyKey: () => request('/auth/regenerate-my-key', { method: 'POST' }),

  // User Management & Admin Approvals
  getUsers: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/users?${query}`);
  },
  approveUser: (id, limits = {}) => request(`/users/${id}/approve`, {
    method: 'POST',
    body: JSON.stringify(limits)
  }),
  rejectUser: (id) => request(`/users/${id}/reject`, { method: 'POST' }),
  revokeUserKey: (id) => request(`/users/${id}/revoke`, { method: 'POST' }),

  // Projects
  getProjects: () => request('/projects'),
  getProject: (id) => request(`/projects/${id}`),
  createProject: (data) => request('/projects', { method: 'POST', body: JSON.stringify(data) }),
  updateProject: (id, data) => request(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  regenerateApiKey: (id) => request(`/projects/${id}/regenerate-key`, { method: 'POST' }),
  deleteProject: (id) => request(`/projects/${id}`, { method: 'DELETE' }),

  // SMTP Accounts
  getSmtpAccounts: () => request('/smtp-accounts'),
  getSmtpAccount: (id) => request(`/smtp-accounts/${id}`),
  createSmtpAccount: (data) => request('/smtp-accounts', { method: 'POST', body: JSON.stringify(data) }),
  updateSmtpAccount: (id, data) => request(`/smtp-accounts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  testSmtpConnection: (id) => request(`/smtp-accounts/${id}/test`, { method: 'POST' }),
  deleteSmtpAccount: (id) => request(`/smtp-accounts/${id}`, { method: 'DELETE' }),

  // Emails & Logs
  getEmailLogs: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/emails?${query}`);
  },
  getEmailDetails: (jobId) => request(`/emails/${jobId}`),
  retryEmail: (jobId) => request(`/emails/${jobId}/retry`, { method: 'POST' }),

  // Queue
  getQueueStats: () => request('/system/queue/stats'),
  cleanQueue: (type, gracePeriodMs = 0) => request('/system/queue/clean', {
    method: 'POST',
    body: JSON.stringify({ type, gracePeriodMs })
  }),

  // Analytics
  getAnalyticsOverview: () => request('/analytics/overview'),
  getAnalyticsDaily: (days = 14) => request(`/analytics/daily?days=${days}`),
  getAnalyticsProjects: () => request('/analytics/projects'),

  // System Health
  getSystemHealth: () => request('/system/health'),
  getSystemLogs: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/system/logs?${query}`);
  }
};
