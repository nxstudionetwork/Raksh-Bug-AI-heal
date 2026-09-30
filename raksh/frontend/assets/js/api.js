const API = (() => {
  const BASE_URL = (location.protocol === 'file:' ? 'http://localhost:8080' : '') + '/api';
  let ws = null;
  let wsReconnectTimer = null;
  let wsCallbacks = {};

  function getToken() {
    return localStorage.getItem('raksh_access_token');
  }

  function setToken(token) {
    localStorage.setItem('raksh_access_token', token);
  }

  function getRefreshToken() {
    return localStorage.getItem('raksh_refresh_token');
  }

  function setTokens(access, refresh) {
    setToken(access);
    localStorage.setItem('raksh_refresh_token', refresh);
  }

  function clearTokens() {
    localStorage.removeItem('raksh_access_token');
    localStorage.removeItem('raksh_refresh_token');
  }

  async function request(endpoint, options = {}) {
    const token = getToken();
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
    let res = await fetch(url, { ...options, headers });

    if (res.status === 401 && getRefreshToken()) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        headers['Authorization'] = `Bearer ${getToken()}`;
        res = await fetch(url, { ...options, headers });
      }
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || `Request failed: ${res.status}`);
    }

    const text = await res.text();
    return text ? JSON.parse(text) : null;
  }

  async function refreshAccessToken() {
    try {
      const refresh = getRefreshToken();
      if (!refresh) return false;
      const res = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refresh }),
      });
      if (!res.ok) { clearTokens(); return false; }
      const data = await res.json();
      setTokens(data.access_token, data.refresh_token);
      return true;
    } catch { clearTokens(); return false; }
  }

  function connectWebSocket(callbacks = {}) {
    wsCallbacks = callbacks;
    const token = getToken();
    if (!token) return;

    if (ws) ws.close();
    const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
    const host = location.host || 'localhost:8080';
    ws = new WebSocket(`${protocol}://${host}/ws?token=${token}`);

    ws.onopen = () => { if (wsCallbacks.onOpen) wsCallbacks.onOpen(); };
    ws.onclose = () => {
      if (wsCallbacks.onClose) wsCallbacks.onClose();
      wsReconnectTimer = setTimeout(() => connectWebSocket(callbacks), 3000);
    };
    ws.onerror = () => ws?.close();
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (wsCallbacks.onMessage) wsCallbacks.onMessage(msg);
        if (msg.event === 'scan_complete' && wsCallbacks.onScanComplete) wsCallbacks.onScanComplete(msg.data);
        if (msg.event === 'new_notification' && wsCallbacks.onNotification) wsCallbacks.onNotification(msg.data);
        if (msg.event === 'app_connected' && wsCallbacks.onAppConnected) wsCallbacks.onAppConnected(msg.data);
        if (msg.event === 'app_disconnected' && wsCallbacks.onAppDisconnected) wsCallbacks.onAppDisconnected(msg.data);
      } catch { /* ignore parse errors */ }
    };
  }

  function disconnectWebSocket() {
    if (wsReconnectTimer) { clearTimeout(wsReconnectTimer); wsReconnectTimer = null; }
    if (ws) { ws.close(); ws = null; }
  }

  return {
    // --- Auth ---
    async register(name, email, password) {
      const data = await request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      });
      if (data.access_token) setTokens(data.access_token, data.refresh_token);
      return data;
    },

    async login(email, password) {
      const data = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (data.access_token) setTokens(data.access_token, data.refresh_token);
      return data;
    },

    logout() {
      clearTokens();
      disconnectWebSocket();
    },

    isAuthenticated() {
      return !!getToken();
    },

    async refreshToken() {
      return refreshAccessToken();
    },

    async forgotPassword(email) {
      return request('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
    },

    async resetPassword(token, password) {
      return request('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      });
    },

    async changePassword(currentPassword, newPassword) {
      return request('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });
    },

    // --- Users ---
    async getProfile() {
      return request('/users/me');
    },

    async updateProfile(data) {
      return request('/users/me', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },

    async deleteAccount() {
      return request('/users/me', { method: 'DELETE' });
    },

    // --- Dashboard ---
    async getDashboardStats() {
      return request('/dashboard/stats');
    },

    async getDashboardTrends(days = 30) {
      return request(`/dashboard/trends?days=${days}`);
    },

    // --- Scans ---
    async analyzeMessage(data) {
      return request('/scans/analyze', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    async getScanHistory(params = {}) {
      const qs = new URLSearchParams();
      if (params.skip !== undefined) qs.set('skip', params.skip);
      if (params.limit !== undefined) qs.set('limit', params.limit);
      if (params.severity) qs.set('severity', params.severity);
      if (params.category) qs.set('category', params.category);
      const query = qs.toString();
      return request(`/scans/${query ? '?' + query : ''}`);
    },

    async getScanStats() {
      return request('/scans/stats');
    },

    async getScan(id) {
      return request(`/scans/${id}`);
    },

    // --- Messages ---
    async createMessage(data) {
      return request('/messages/', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    async getMessages(params = {}) {
      const qs = new URLSearchParams();
      if (params.skip !== undefined) qs.set('skip', params.skip);
      if (params.limit !== undefined) qs.set('limit', params.limit);
      if (params.source) qs.set('source', params.source);
      const query = qs.toString();
      return request(`/messages/${query ? '?' + query : ''}`);
    },

    async getMessage(id) {
      return request(`/messages/${id}`);
    },

    // --- Notifications ---
    async getNotifications(params = {}) {
      const qs = new URLSearchParams();
      if (params.skip !== undefined) qs.set('skip', params.skip);
      if (params.limit !== undefined) qs.set('limit', params.limit);
      if (params.notif_type) qs.set('notif_type', params.notif_type);
      const query = qs.toString();
      return request(`/notifications/${query ? '?' + query : ''}`);
    },

    async getUnreadCount() {
      return request('/notifications/unread-count');
    },

    async markNotificationRead(id) {
      return request(`/notifications/${id}/read`, { method: 'PUT' });
    },

    async markAllNotificationsRead() {
      return request('/notifications/read-all', { method: 'PUT' });
    },

    async deleteNotification(id) {
      return request(`/notifications/${id}`, { method: 'DELETE' });
    },

    async clearAllNotifications() {
      return request('/notifications/', { method: 'DELETE' });
    },

    // --- Connected Apps ---
    async getConnectedApps() {
      return request('/connected-apps/');
    },

    async connectApp(data) {
      return request('/connected-apps/', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    async updateApp(id, data) {
      return request(`/connected-apps/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },

    async disconnectApp(id) {
      return request(`/connected-apps/${id}`, { method: 'DELETE' });
    },

    // --- Settings ---
    async getSettings() {
      return request('/settings/');
    },

    async updateSettings(data) {
      return request('/settings/', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },

    // --- Files ---
    async uploadFile(file, scanId = null) {
      const token = getToken();
      const formData = new FormData();
      formData.append('file', file);
      if (scanId) formData.append('scan_id', scanId);

      const res = await fetch(`${BASE_URL}/files/upload`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || 'Upload failed');
      }
      return res.json();
    },

    async getFiles(params = {}) {
      const qs = new URLSearchParams();
      if (params.skip) qs.set('skip', params.skip);
      if (params.limit) qs.set('limit', params.limit);
      if (params.file_type) qs.set('file_type', params.file_type);
      const query = qs.toString();
      return request(`/files/${query ? '?' + query : ''}`);
    },

    async deleteFile(id) {
      return request(`/files/${id}`, { method: 'DELETE' });
    },

    // --- AI Analysis ---
    async analyzeText(text) {
      return this.analyzeMessage({
        source: 'manual',
        sender: 'unknown',
        receiver: 'me',
        message_content: text,
      });
    },

    async analyzeUrl(url) {
      return this.analyzeMessage({
        source: 'manual',
        sender: 'unknown',
        receiver: 'me',
        message_content: url,
        urls: [url],
      });
    },

    async analyzeFile(file) {
      const uploadResult = await this.uploadFile(file);
      if (uploadResult.scan_id) {
        return this.getScan(uploadResult.scan_id);
      }
      return uploadResult;
    },

    async getAIResponse(query) {
      try {
        const result = await this.analyzeText(query);
        return {
          response: result.explanation || 'Analysis complete. No specific explanation available.',
          risk_score: result.risk_score,
          severity: result.severity,
          threat_category: result.threat_category,
          recommendation: result.recommendation,
        };
      } catch {
        return {
          response: 'Unable to analyze at this time. Please try again.',
          risk_score: 0,
          severity: 'unknown',
          threat_category: 'unknown',
          recommendation: null,
        };
      }
    },

    // --- Health ---
    async healthCheck() {
      return request('/health/');
    },

    async dbHealth() {
      return request('/health/db');
    },

    // --- WebSocket ---
    connectWebSocket,
    disconnectWebSocket,
    setTokens,
    clearTokens,
    getToken,
  };
})();
