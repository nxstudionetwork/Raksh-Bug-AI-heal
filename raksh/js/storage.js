const Storage = {
  get(key, defaultValue = null) {
    try {
      const data = localStorage.getItem(`raksh_${key}`);
      return data ? JSON.parse(data) : defaultValue;
    } catch {
      return defaultValue;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(`raksh_${key}`, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(`raksh_${key}`);
      return true;
    } catch {
      return false;
    }
  },

  clear() {
    try {
      Object.keys(localStorage)
        .filter(k => k.startsWith('raksh_'))
        .forEach(k => localStorage.removeItem(k));
      return true;
    } catch {
      return false;
    }
  },

  getScanHistory() {
    return this.get('scan_history', []);
  },

  addScanHistory(entry) {
    const history = this.getScanHistory();
    history.unshift({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      timestamp: Date.now(),
      ...entry
    });
    if (history.length > 500) history.length = 500;
    this.set('scan_history', history);
    return history;
  },

  clearScanHistory() {
    return this.set('scan_history', []);
  },

  getNotifications() {
    const stored = this.get('notifications', null);
    if (Array.isArray(stored) && stored.length) return stored;
    const seeded = Array.isArray(MockData?.notifications) ? MockData.notifications : [];
    if (seeded.length) {
      this.set('notifications', seeded);
      return seeded;
    }
    // Generate mock notifications if none exist
    const mockNotifs = this.generateMockNotifications(50);
    this.set('notifications', mockNotifs);
    return mockNotifs;
  },

  generateMockNotifications(count) {
    const types = ['safe', 'warning', 'critical', 'info', 'system'];
    const safeTitles = ['No threats detected in your latest scan', 'Security check passed', 'All systems operating normally', 'Device is secure'];
    const warnTitles = ['Suspicious link detected. Review before opening', 'Unusual login attempt detected', 'New device login detected', 'Password expiring soon'];
    const critTitles = ['Potential phishing attempt detected', 'Critical threat blocked', 'Malware detected and quarantined', 'Account compromise alert'];
    const infoTitles = ['Protection database updated successfully', 'New security feature available', 'Weekly security report ready', 'System maintenance completed'];
    const sysTitles = ['Connected Apps settings have been updated', 'Profile settings saved', 'Preferences updated', 'Backup completed successfully'];
    
    const safeTexts = ['Your latest scan found no threats. Your device is secure.', 'All security checks passed. No suspicious activity detected.', 'RAKSH protection is active and monitoring your device.', 'No vulnerabilities found in your system.'];
    const warnTexts = ['A link in your recent message appears suspicious. We recommend reviewing it before opening.', 'Someone tried to log in from an unknown location. Verify if this was you.', 'A new device was used to access your account. If this wasn\'t you, secure your account.', 'Your password will expire in 7 days. Consider updating it soon.'];
    const critTexts = ['RAKSH blocked a phishing attempt on your device. The malicious link has been neutralized.', 'A malicious file was detected and quarantined. Your system is protected.', 'A scam message was intercepted successfully. The threat has been neutralized.', 'Suspicious activity detected on your banking app. Immediate action recommended.'];
    const infoTexts = ['RAKSH protection database has been updated with the latest threat signatures.', 'A new security feature is now available. Check your settings to enable it.', 'Your weekly security report is ready for review. View it in the dashboard.', 'System maintenance has been completed. All services are running normally.'];
    const sysTexts = ['Your Connected Apps settings have been updated successfully.', 'Profile settings have been saved.', 'Your preferences have been updated.', 'Your data has been backed up successfully.'];
    
    const now = Date.now();
    const notifs = [];
    for (let i = 0; i < count; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      let title, text;
      if (type === 'safe') {
        title = safeTitles[Math.floor(Math.random() * safeTitles.length)];
        text = safeTexts[Math.floor(Math.random() * safeTexts.length)];
      } else if (type === 'warning') {
        title = warnTitles[Math.floor(Math.random() * warnTitles.length)];
        text = warnTexts[Math.floor(Math.random() * warnTexts.length)];
      } else if (type === 'critical') {
        title = critTitles[Math.floor(Math.random() * critTitles.length)];
        text = critTexts[Math.floor(Math.random() * critTexts.length)];
      } else if (type === 'info') {
        title = infoTitles[Math.floor(Math.random() * infoTitles.length)];
        text = infoTexts[Math.floor(Math.random() * infoTexts.length)];
      } else {
        title = sysTitles[Math.floor(Math.random() * sysTitles.length)];
        text = sysTexts[Math.floor(Math.random() * sysTexts.length)];
      }
      notifs.push({
        id: 'n' + i + '_' + Math.random().toString(36).substr(2, 9),
        type,
        title,
        text,
        read: Math.random() > 0.5,
        timestamp: now - Math.floor(Math.random() * 14 * 24 * 60 * 60 * 1000)
      });
    }
    notifs.sort((a, b) => b.timestamp - a.timestamp);
    return notifs;
  },

  addNotification(notification) {
    const notifications = this.getNotifications();
    notifications.unshift({
      id: Date.now().toString(36),
      read: false,
      timestamp: Date.now(),
      ...notification
    });
    if (notifications.length > 200) notifications.length = 200;
    this.set('notifications', notifications);
    UI.updateNotificationBadge();
    return notifications;
  },

  markNotificationRead(id) {
    const notifications = this.getNotifications();
    const n = notifications.find(n => n.id === id);
    if (n) n.read = true;
    this.set('notifications', notifications);
    UI.updateNotificationBadge();
  },

  markAllNotificationsRead() {
    const notifications = this.getNotifications();
    notifications.forEach(n => n.read = true);
    this.set('notifications', notifications);
    UI.updateNotificationBadge();
  },

  deleteNotification(id) {
    let notifications = this.getNotifications();
    notifications = notifications.filter(n => n.id !== id);
    this.set('notifications', notifications);
    UI.updateNotificationBadge();
  },

  clearAllNotifications() {
    this.set('notifications', []);
    UI.updateNotificationBadge();
  },

  getSettings() {
    return this.get('settings', {
      theme: 'dark',
      accentColor: '#6366f1',
      notifications: true,
      language: 'en',
      animations: true,
      autoSave: true,
      privacyMode: false,
      fontSize: 'normal',
      highContrast: false
    });
  },

  updateSettings(settings) {
    const current = this.getSettings();
    this.set('settings', { ...current, ...settings });
  },

  getProfile() {
    return this.get('profile', {
      name: 'User',
      email: 'user@raksh.security',
      avatar: null,
      joinDate: new Date().toLocaleDateString(),
      totalScans: 0,
      threatsBlocked: 0,
      safeScans: 0,
      achievements: ['first_scan'],
      securityLevel: 'Bronze',
      scanStreak: 0
    });
  },

  updateProfile(profile) {
    const current = this.getProfile();
    this.set('profile', { ...current, ...profile });
  },

  getBookmarks() {
    return this.get('bookmarks', []);
  },

  toggleBookmark(id) {
    const bookmarks = this.getBookmarks();
    const idx = bookmarks.indexOf(id);
    if (idx === -1) bookmarks.push(id);
    else bookmarks.splice(idx, 1);
    this.set('bookmarks', bookmarks);
    return bookmarks;
  },

  isBookmarked(id) {
    return this.getBookmarks().includes(id);
  },

  getStats() {
    return this.get('stats', {
      messagesScanned: 0,
      safeMessages: 0,
      suspiciousMessages: 0,
      highRiskMessages: 0,
      criticalThreats: 0,
      urlsChecked: 0,
      qrScanned: 0,
      imagesAnalyzed: 0,
      filesScanned: 0,
      voiceChecked: 0,
      totalScans: 0
    });
  },

  incrementStat(key) {
    const stats = this.getStats();
    if (stats[key] !== undefined) stats[key]++;
    stats.totalScans = Object.values(stats).reduce((a, b) => typeof b === 'number' ? a + b : a, 0);
    this.set('stats', stats);
  },

  getPinnedScans() {
    return this.get('pinned_scans', []);
  },

  togglePinnedScan(id) {
    const pinned = this.getPinnedScans();
    const idx = pinned.indexOf(id);
    if (idx === -1) pinned.push(id);
    else pinned.splice(idx, 1);
    this.set('pinned_scans', pinned);
    return pinned;
  },

  isPinned(id) {
    return this.getPinnedScans().includes(id);
  },

  getOnboardingComplete() {
    return this.get('onboarding_done', false);
  },

  setOnboardingComplete(val) {
    return this.set('onboarding_done', val);
  },

  getDailyTipIndex() {
    const idx = this.get('daily_tip_idx', 0);
    this.set('daily_tip_idx', (idx + 1) % CyberTips.length);
    return idx;
  },

  getCommunityAlerts() {
    return this.get('community_alerts', DATA.communityAlerts);
  },

  getSecurityHealth() {
    const stats = this.getStats();
    const total = stats.totalScans || 1;
    const safeRatio = (stats.safeMessages || 0) / Math.max(total, 1);
    const threatRatio = (stats.criticalThreats || 0) / Math.max(total, 1);
    const baseScore = 70;
    const safeBonus = safeRatio * 20;
    const threatPenalty = threatRatio * 30;
    const streakBonus = Math.min((this.getProfile().scanStreak || 0) * 2, 10);
    return Math.min(100, Math.max(0, Math.round(baseScore + safeBonus - threatPenalty + streakBonus)));
  },

  getDashboardData() {
    return {
      stats: this.getStats(),
      scanHistory: this.getScanHistory().slice(0, 8),
      trendingScams: DATA.trendingScams,
      trendingThreats: DATA.trendingThreats,
      communityAlerts: this.getCommunityAlerts(),
      securityHealth: this.getSecurityHealth(),
      dailyTip: CyberTips[this.getDailyTipIndex()],
      pinnedScans: this.getPinnedScans()
    };
  }
};
