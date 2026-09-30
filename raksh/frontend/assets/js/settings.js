function _snakeToCamel(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const res = {};
  for (const [k, v] of Object.entries(obj)) {
    res[k.replace(/_([a-z])/g, (_, c) => c.toUpperCase())] = v;
  }
  return res;
}

function _camelToSnake(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const res = {};
  for (const [k, v] of Object.entries(obj)) {
    res[k.replace(/([A-Z])/g, '_$1').toLowerCase()] = v;
  }
  return res;
}

document.addEventListener('DOMContentLoaded', async () => {
  if (!document.getElementById('settingsPage')) return;
  try {
    const settings = await API.getSettings();
    window._cachedSettings = _snakeToCamel(settings);
    initSettingsPage();
  } catch {
    window._cachedSettings = Storage.getSettings();
    initSettingsPage();
  }
});

const CONNECTED_APPS = [
  { id: 'whatsapp', name: 'WhatsApp', icon: '\uD83D\uDCAC', status: 'connected', permission: 'Read+Write', lastSync: '2 min ago', protection: 'active' },
  { id: 'telegram', name: 'Telegram', icon: '\u2708\uFE0F', status: 'connected', permission: 'Read', lastSync: '15 min ago', protection: 'active' },
  { id: 'discord', name: 'Discord', icon: '\uD83C\uDFAE', status: 'disconnected', permission: 'Read', lastSync: 'never', protection: 'inactive' },
  { id: 'slack', name: 'Slack', icon: '\uD83D\uDCBC', status: 'pending', permission: 'Read+Write', lastSync: 'pending', protection: 'inactive' },
  { id: 'teams', name: 'Microsoft Teams', icon: '\uD83D\uDCC5', status: 'disconnected', permission: 'Read', lastSync: 'never', protection: 'inactive' },
  { id: 'gchat', name: 'Google Chat', icon: '\uD83D\uDCAD', status: 'connected', permission: 'Read+Write', lastSync: '1 hour ago', protection: 'active' },
  { id: 'email', name: 'Email', icon: '\uD83D\uDCE7', status: 'connected', permission: 'Read', lastSync: 'just now', protection: 'active' },
  { id: 'sms', name: 'SMS', icon: '\uD83D\uDCF1', status: 'disconnected', permission: 'Read', lastSync: 'never', protection: 'inactive' }
];

function initSettingsPage() {
  const settings = window._cachedSettings || Storage.getSettings();

  const toggleMap = {
    aiProtectionToggle: 'aiProtection',
    privacyToggle: 'privacyMode',
    autoScanToggle: 'autoScan',
    enableNotifToggle: 'notificationsEnabled',
    criticalAlertToggle: 'criticalAlerts',
    warningAlertToggle: 'warningAlerts',
    soundToggle: 'sound',
    desktopNotifToggle: 'desktopNotif',
    autoSaveToggle: 'autoSave',
    timeFormatToggle: 'timeFormat24h',
    secAutoScanToggle: 'secAutoScan',
    smartNotifToggle: 'smartNotif',
    safeBrowsingToggle: 'safeBrowsing',
    secPrivacyToggle: 'secPrivacy',
    reduceMotionToggle: 'reduceMotion',
    highContrastToggle: 'highContrast',
    keyboardNavToggle: 'keyboardNav',
    screenReaderToggle: 'screenReader'
  };

  Object.entries(toggleMap).forEach(([id, key]) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.checked = settings[key] !== undefined ? settings[key] : true;
    el.addEventListener('change', async () => {
      window._cachedSettings = { ...window._cachedSettings, [key]: el.checked };
      try { await API.updateSettings(_camelToSnake(window._cachedSettings)); } catch {}
      UI.showToast(`${key.replace(/([A-Z])/g, ' $1').trim()} ${el.checked ? 'enabled' : 'disabled'}`, 'info');
    });
  });

  const selectMap = {
    languageSelect: { key: 'language', values: ['en', 'hi', 'ta', 'te', 'bn', 'mr'] },
    dateFormatSelect: { key: 'dateFormat', values: ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'] },
    aiDetectionLevel: { key: 'aiDetectionLevel', values: ['low', 'balanced', 'high'] },
    textSizeSelect: { key: 'textSize', values: ['small', 'medium', 'large'] }
  };

  Object.entries(selectMap).forEach(([id, config]) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (settings[config.key] && config.values.includes(settings[config.key])) {
      el.value = settings[config.key];
    }
    el.addEventListener('change', async () => {
      window._cachedSettings = { ...window._cachedSettings, [config.key]: el.value };
      try { await API.updateSettings(_camelToSnake(window._cachedSettings)); } catch {}
      UI.showToast(`${config.key.replace(/([A-Z])/g, ' $1').trim()} set to ${el.value}`, 'info');
    });
  });

  document.getElementById('changePasswordBtn')?.addEventListener('click', () => {
    UI.showToast('Password change request sent to your email', 'success');
  });

  document.getElementById('resetPrefsBtn')?.addEventListener('click', () => {
    UI.showConfirmDialog('Reset all preferences to defaults? This will not affect your data.', async (confirmed) => {
      if (!confirmed) return;
      const defaults = {
        theme: 'dark', accentColor: '#6366f1', notifications: true, language: 'en',
        animations: true, autoSave: true, privacyMode: false, fontSize: 'normal',
        highContrast: false, aiProtection: true, autoScan: true, notificationsEnabled: true,
        criticalAlerts: true, warningAlerts: true, sound: true, desktopNotif: false,
        secAutoScan: true, smartNotif: true, safeBrowsing: true, secPrivacy: false,
        aiDetectionLevel: 'balanced', reduceMotion: false, keyboardNav: true,
        screenReader: false, textSize: 'medium', timeFormat24h: false, dateFormat: 'DD/MM/YYYY'
      };
      window._cachedSettings = defaults;
      try { await API.updateSettings(_camelToSnake(defaults)); } catch {}
      UI.showToast('Preferences reset to defaults', 'success');
      setTimeout(() => location.reload(), 800);
    });
  });

  document.getElementById('exportPdfBtn')?.addEventListener('click', exportScanHistoryPDF);
  document.getElementById('exportTxtBtn')?.addEventListener('click', exportScanHistoryTXT);
  document.getElementById('clearLocalDataBtn')?.addEventListener('click', clearLocalDataHandler);
  document.getElementById('backupSettingsBtn')?.addEventListener('click', backupSettingsHandler);
  document.getElementById('restoreSettingsBtn')?.addEventListener('click', restoreSettingsHandler);
  document.getElementById('termsLink')?.addEventListener('click', () => UI.showToast('Opening terms...', 'info'));
  document.getElementById('supportLink')?.addEventListener('click', () => UI.showToast('Opening support...', 'info'));

  renderConnectedApps();
}

function clearLocalDataHandler() {
  UI.showConfirmDialog('Clear all local data? This will remove scan history, stats, and all stored data. This cannot be undone.', (confirmed) => {
    if (!confirmed) return;
    Storage.clear();
    UI.showToast('All local data cleared', 'warning');
    setTimeout(() => location.reload(), 1000);
  });
}

function exportScanHistoryTXT() {
  const history = Storage.getScanHistory();
  const lines = history.length ? history.map(h => `[${h.date}] ${h.type}: ${h.category || 'N/A'} (${h.severity || 'N/A'} - ${h.riskScore || 0}%)`.trim()).join('\n') : 'No scan history found.';
  const blob = new Blob([`RAKSH Scan History\nExported: ${new Date().toLocaleString()}\n${'='.repeat(40)}\n\n${lines}`], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `raksh_scan_history_${Date.now()}.txt`; a.click();
  URL.revokeObjectURL(url);
  UI.showToast('Scan history exported as TXT', 'success');
}

function exportScanHistoryPDF() {
  const history = Storage.getScanHistory();
  const lines = history.length ? history.map(h => `[${h.date}] ${h.type}: ${h.category || 'N/A'} (${h.severity || 'N/A'} - ${h.riskScore || 0}%)`.trim()).join('\n') : 'No scan history found.';
  const html = `<html><head><meta charset="utf-8"><style>body{font-family:sans-serif;padding:20px;background:#f5f5f5;}h1{font-size:18px;color:#333;}hr{border:1px solid #ccc;}.entry{padding:6px 0;border-bottom:1px solid #eee;font-size:13px;}</style></head><body><h1>RAKSH Scan History</h1><p>Exported: ${new Date().toLocaleString()}</p><hr>${lines.split('\n').map(l => `<div class="entry">${l}</div>`).join('')}</body></html>`;
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `raksh_scan_history_${Date.now()}.pdf`; a.click();
  URL.revokeObjectURL(url);
  UI.showToast('Scan history exported as PDF', 'success');
}

function backupSettingsHandler() {
  const settings = window._cachedSettings || Storage.getSettings();
  const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `raksh_settings_backup_${Date.now()}.json`; a.click();
  URL.revokeObjectURL(url);
  UI.showToast('Settings backed up', 'success');
}

function restoreSettingsHandler() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        Storage.set('settings', data);
        UI.showToast('Settings restored', 'success');
        setTimeout(() => location.reload(), 800);
      } catch {
        UI.showToast('Invalid backup file', 'error');
      }
    };
    reader.readAsText(file);
  });
  input.click();
}

function renderConnectedApps() {
  const grid = document.getElementById('connectedAppsGrid');
  if (!grid) return;

  grid.innerHTML = CONNECTED_APPS.map(app => {
    const connected = app.status === 'connected';
    const pending = app.status === 'pending';
    const statusClass = pending ? 'status-pending' : (connected ? 'status-connected' : 'status-disconnected');
    const statusLabel = pending ? 'Pending' : (connected ? 'Connected' : 'Disconnected');
    const protClass = app.protection === 'active' ? 'prot-active' : 'prot-inactive';
    const protLabel = app.protection === 'active' ? 'Active' : 'Inactive';

    return `
      <div class="app-card" data-app="${app.id}">
        <div class="app-card-icon">${app.icon}</div>
        <div class="app-card-name">${app.name}</div>
        <span class="app-status-badge ${statusClass}">${statusLabel}</span>
        <div class="app-card-info">
          <div>Permission: ${app.permission}</div>
          <div>Last Sync: ${app.lastSync}</div>
          <div>Protection: <span class="app-prot-status ${protClass}">${protLabel}</span></div>
        </div>
        <div class="app-card-footer">
          <button class="btn btn-sm ${connected ? 'btn-danger' : (pending ? 'btn-secondary' : 'btn-primary')}" data-app="${app.id}">
            ${pending ? 'Awaiting' : (connected ? 'Disconnect' : 'Connect')}
          </button>
        </div>
      </div>
    `;
  }).join('');

  grid.querySelectorAll('.app-card-footer .btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const appId = btn.getAttribute('data-app');
      const app = CONNECTED_APPS.find(a => a.id === appId);
      if (!app) return;

      if (app.status === 'connected') {
        app.status = 'disconnected';
        app.protection = 'inactive';
        app.lastSync = 'never';
        UI.showToast(`${app.name} disconnected`, 'info');
      } else if (app.status === 'disconnected') {
        app.status = 'connected';
        app.protection = 'active';
        app.lastSync = 'just now';
        UI.showToast(`${app.name} connected`, 'success');
      }
      renderConnectedApps();
    });
  });
}
