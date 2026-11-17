const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  const res = await fetch(url, config);
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    let errMsg = errBody.error || errBody.detail;
    if (!errMsg && typeof errBody === 'object') {
      // Extract Django field validation error messages
      const msgs = Object.entries(errBody).map(([field, errs]) => {
        const text = Array.isArray(errs) ? errs.join(', ') : String(errs);
        return `${field}: ${text}`;
      });
      if (msgs.length > 0) {
        errMsg = msgs.join(' | ');
      }
    }
    throw new Error(errMsg || `HTTP Error ${res.status}`);
  }

  // Handle 204 No Content (DELETE responses)
  if (res.status === 204) {
    return { success: true };
  }

  const text = await res.text();
  return text ? JSON.parse(text) : {};
}

export const api = {
  // Campaigns
  campaigns: {
    async list(params = {}) {
      const query = new URLSearchParams(params).toString();
      return await request(`/campaigns/${query ? `?${query}` : ''}`);
    },
    async get(id) {
      return await request(`/campaigns/${id}/`);
    },
    async create(data) {
      return await request('/campaigns/', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    async update(id, data) {
      return await request(`/campaigns/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
    async delete(id) {
      return await request(`/campaigns/${id}/`, { method: 'DELETE' });
    },
    async send(id) {
      return await request(`/campaigns/${id}/send/`, { method: 'POST' });
    },
    async schedule(id, scheduledAt) {
      return await request(`/campaigns/${id}/schedule/`, {
        method: 'POST',
        body: JSON.stringify({ scheduled_at: scheduledAt }),
      });
    },
    async testSend(id, testEmail) {
      return await request(`/campaigns/${id}/test-send/`, {
        method: 'POST',
        body: JSON.stringify({ test_email: testEmail }),
      });
    },
    async getStats(id) {
      return await request(`/campaigns/${id}/stats/`);
    },
    async getDashboardOverview() {
      return await request('/campaigns/dashboard-overview/');
    },
    async uploadAttachment(file) {
      const formData = new FormData();
      formData.append('file', file);
      const url = `${BASE_URL}/campaigns/upload-attachment/`;
      const res = await fetch(url, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP Error ${res.status}`);
      }
      return await res.json();
    },
  },

  // Contacts
  contacts: {
    async list(params = {}) {
      const query = new URLSearchParams(params).toString();
      return await request(`/contacts/contacts/${query ? `?${query}` : ''}`);
    },
    async create(data) {
      return await request('/contacts/contacts/', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    async bulkImport(contacts, listId = null) {
      return await request('/contacts/contacts/bulk-import/', {
        method: 'POST',
        body: JSON.stringify({ contacts, list_id: listId }),
      });
    },
    async delete(id) {
      return await request(`/contacts/contacts/${id}/`, { method: 'DELETE' });
    },
  },

  // Lists
  lists: {
    async list(params = {}) {
      const query = new URLSearchParams(params).toString();
      return await request(`/contacts/lists/${query ? `?${query}` : ''}`);
    },
    async create(data) {
      return await request('/contacts/lists/', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    async delete(id) {
      return await request(`/contacts/lists/${id}/`, { method: 'DELETE' });
    },
  },

  // Telemetry Events & Live Notifications
  telemetry: {
    async recentEvents(limit = 20) {
      const res = await request(`/telemetry/events/?limit=${limit}`);
      return res.results || res;
    },
    async getNotifications() {
      const res = await request('/telemetry/notifications/');
      return res.notifications || [];
    },
    async markNotificationsAsRead(id = null) {
      return await request('/telemetry/notifications/', {
        method: 'POST',
        body: JSON.stringify({ action: id ? 'mark_read' : 'mark_all_read', id }),
      });
    },
    async clearAllNotifications() {
      return await request('/telemetry/notifications/', {
        method: 'POST',
        body: JSON.stringify({ action: 'clear_all' }),
      });
    },
  },

  // Suppression
  suppression: {
    async list(params = {}) {
      const query = new URLSearchParams(params).toString();
      return await request(`/contacts/suppression/${query ? `?${query}` : ''}`);
    },
    async add(email, reason = 'ADMIN_SUPPRESSION') {
      return await request('/contacts/suppression/', {
        method: 'POST',
        body: JSON.stringify({ email, reason }),
      });
    },
    async delete(email) {
      return await request(`/contacts/suppression/${encodeURIComponent(email)}/`, {
        method: 'DELETE',
      });
    },
  },

  // Users & Auth
  users: {
    async login(email, password) {
      return await request('/users/login/', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
    },
    async list() {
      return await request('/users/list/');
    },
    async invite(email, role = 'admin', inviterEmail = '') {
      return await request('/users/invite/', {
        method: 'POST',
        body: JSON.stringify({ email, role, inviter_email: inviterEmail }),
      });
    },
    async getInvites() {
      return await request('/users/invite/');
    },
    async acceptInvite(token, password, firstName = '', lastName = '') {
      return await request('/users/accept-invite/', {
        method: 'POST',
        body: JSON.stringify({
          token,
          password,
          first_name: firstName,
          last_name: lastName,
        }),
      });
    },
  },
};
