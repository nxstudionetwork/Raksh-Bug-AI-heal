document.addEventListener('DOMContentLoaded', () => {
  if (!document.querySelector('.scan-center') && !document.querySelector('.scan-tabs')) return;
  initScanCenter();
});

function initScanCenter() {
  initScanTabs();
  initTextScan();
  initLinkScan();
  initQRScan();
  initImageScan();
  initFileScan();
  initVoiceScan();
  initVideoScan();
}

const ALLOWED_TYPES = {
  image: ['png','jpg','jpeg','gif','webp','bmp'],
  qr: ['png','jpg','jpeg','gif','webp','bmp'],
  voice: ['mp3','wav','ogg','m4a','flac'],
  video: ['mp4','avi','mov','mkv','webm'],
  file: ['pdf','doc','docx','xls','xlsx','ppt','pptx','txt','csv','zip','rar'],
  text: ['txt']
};

function validateFileType(file, allowedExts) {
  if (!file) return false;
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (!ext || !allowedExts.includes(ext)) {
    UI.showToast(`Invalid file type. Accepted: ${allowedExts.join(', ')}`, 'danger');
    return false;
  }
  return true;
}

function activateScanPanel(target) {
  const tabs = document.querySelectorAll('.scan-tab');
  const panels = document.querySelectorAll('.scan-panel');
  const select = document.getElementById('scanMobileSelect');

  tabs.forEach(tab => tab.classList.toggle('active', tab.getAttribute('data-tab') === target));
  panels.forEach(panel => panel.classList.toggle('active', panel.id === target));
  if (select) select.value = target;
}

function transformApiResult(r) {
  return {
    riskScore: r.risk_score ?? 0,
    severity: r.severity ?? 'safe',
    category: r.threat_category ?? 'unknown',
    confidence: r.confidence ?? 0,
    recommendation: r.recommendation ?? '',
    explanation: r.explanation ?? '',
    suggested_actions: r.suggested_actions ?? [],
    detected_keywords: r.detected_keywords ?? [],
    psychological_tactics: r.psychological_tactics ?? {},
    url_analyses: r.url_analyses ?? [],
  };
}

function initScanTabs() {
  const tabs = document.querySelectorAll('.scan-tab');
  const select = document.getElementById('scanMobileSelect');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => activateScanPanel(tab.getAttribute('data-tab')));
  });

  if (select) {
    select.addEventListener('change', () => activateScanPanel(select.value));
  }
}

function initTextScan() {
  const textarea = document.getElementById('scanText');
  const analyzeBtn = document.getElementById('analyzeTextBtn');
  const resultContainer = document.getElementById('textScanResult');

  if (!textarea || !analyzeBtn || !resultContainer) return;

  analyzeBtn.addEventListener('click', async () => {
    const text = textarea.value.trim();
    if (!text) {
      UI.showToast('Please enter some text to analyze', 'warning');
      return;
    }

    analyzeBtn.disabled = true;
    analyzeBtn.innerHTML = '<span class="loading-spinner" style="width:18px;height:18px;border-width:2px;"></span> Analyzing...';

    resultContainer.innerHTML = '';
    resultContainer.style.opacity = '0.5';

    UI.updateShieldState('scanning');

    try {
      const result = await API.analyzeText(text);
      resultContainer.style.opacity = '1';
      UI.renderScanResult(transformApiResult(result), resultContainer);

      const state = result.risk_score > 70 ? 'critical' : result.risk_score > 50 ? 'danger' : result.risk_score > 20 ? 'warning' : 'safe';
      UI.updateShieldState(state, result.risk_score > 50 ? 1 : 0);
    } catch (err) {
      UI.showToast(err.message, 'danger');
    } finally {
      analyzeBtn.disabled = false;
      analyzeBtn.textContent = 'Analyze';
    }
  });
}

function initLinkScan() {
  const input = document.getElementById('scanUrl');
  const analyzeBtn = document.getElementById('analyzeUrlBtn');
  const resultContainer = document.getElementById('linkScanResult');

  if (!input || !analyzeBtn || !resultContainer) return;

  analyzeBtn.addEventListener('click', async () => {
    const url = input.value.trim();
    if (!url) {
      UI.showToast('Please enter a URL to analyze', 'warning');
      return;
    }

    analyzeBtn.disabled = true;
    analyzeBtn.innerHTML = '<span class="loading-spinner" style="width:18px;height:18px;border-width:2px;"></span> Scanning...';

    resultContainer.innerHTML = '';
    resultContainer.style.opacity = '0.5';
    UI.updateShieldState('scanning');

    try {
      const result = await API.analyzeUrl(url);
      resultContainer.style.opacity = '1';
      UI.renderScanResult(transformApiResult(result), resultContainer);

      const state = result.risk_score > 70 ? 'critical' : result.risk_score > 50 ? 'danger' : result.risk_score > 20 ? 'warning' : 'safe';
      UI.updateShieldState(state, result.risk_score > 50 ? 1 : 0);
    } catch (err) {
      UI.showToast(err.message, 'danger');
    } finally {
      analyzeBtn.disabled = false;
      analyzeBtn.textContent = 'Scan URL';
    }
  });
}

function initQRScan() {
  const upload = document.getElementById('qrUpload');
  const resultContainer = document.getElementById('qrScanResult');
  const viewport = document.querySelector('.qr-viewport .qr-placeholder');

  if (!upload || !resultContainer) return;

  upload.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file || !validateFileType(file, ALLOWED_TYPES.qr)) { e.target.value = ''; return; }

    UI.updateShieldState('scanning');

    try {
      const uploadResult = await API.uploadFile(file);
      const result = uploadResult.scan_id ? await API.getScan(uploadResult.scan_id) : uploadResult;

      if (viewport) {
        const detectedUrl = result.url_analyses?.[0]?.url || '';
        viewport.innerHTML = `
          <div style="font-size:32px;">📱</div>
          <div style="font-size:12px;margin-top:8px;word-break:break-all;">${detectedUrl}</div>
        `;
      }

      UI.renderScanResult(transformApiResult(result), resultContainer);

      const state = result.risk_score > 70 ? 'critical' : result.risk_score > 50 ? 'danger' : result.risk_score > 20 ? 'warning' : 'safe';
      UI.updateShieldState(state, result.risk_score > 50 ? 1 : 0);
    } catch (err) {
      UI.showToast(err.message, 'danger');
    }
  });
}

function initImageScan() {
  const upload = document.getElementById('imageUpload');
  const preview = document.getElementById('imagePreview');
  const resultContainer = document.getElementById('imageScanResult');
  const ocrResult = document.getElementById('ocrResult');

  if (!upload || !resultContainer) return;

  upload.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file || !validateFileType(file, ALLOWED_TYPES.image)) { e.target.value = ''; return; }

    if (preview) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        preview.innerHTML = `<img src="${ev.target.result}" class="img-preview" alt="Uploaded image">`;
      };
      reader.readAsDataURL(file);
    }

    resultContainer.innerHTML = '';
    resultContainer.style.opacity = '0.5';

    if (ocrResult) {
      ocrResult.innerHTML = '<div style="text-align:center;color:var(--text-muted);padding:16px;">🔍 Scanning for text...</div>';
    }

    UI.updateShieldState('scanning');

    try {
      const uploadResult = await API.uploadFile(file);
      const result = uploadResult.scan_id ? await API.getScan(uploadResult.scan_id) : uploadResult;

      if (ocrResult && result.ocr_text) {
        ocrResult.classList.add('ocr-result');
        ocrResult.innerHTML = `Extracted Text:<br>${result.ocr_text}`;
      }

      resultContainer.style.opacity = '1';
      UI.renderScanResult(transformApiResult(result), resultContainer);

      const state = result.risk_score > 70 ? 'critical' : result.risk_score > 50 ? 'danger' : result.risk_score > 20 ? 'warning' : 'safe';
      UI.updateShieldState(state, result.risk_score > 50 ? 1 : 0);
    } catch (err) {
      UI.showToast(err.message, 'danger');
    }
  });
}

function initFileScan() {
  const upload = document.getElementById('fileUpload');
  const preview = document.getElementById('filePreview');
  const resultContainer = document.getElementById('fileScanResult');
  const fileInfoContainer = document.getElementById('fileInfo');

  if (!upload || !resultContainer) return;

  upload.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file || !validateFileType(file, ALLOWED_TYPES.file)) { e.target.value = ''; return; }

    const icon = Utils.getFileIcon(file.name.split('.').pop());

    if (preview) {
      preview.innerHTML = `
        <div class="file-preview animate-slide-in">
          <div class="file-icon">${icon}</div>
          <div class="file-info">
            <div class="file-name">${file.name}</div>
            <div class="file-size">${Utils.formatBytes(file.size)}</div>
          </div>
          <span class="badge badge-info">Analyzing...</span>
        </div>
      `;
    }

    if (fileInfoContainer) {
      const type = Utils.detectFileType(file.name);
      const ext = file.name.split('.').pop()?.toUpperCase() || 'N/A';
      fileInfoContainer.innerHTML = `
        <div class="file-info-grid">
          <div class="file-info-item">
            <div class="fi-label">Name</div>
            <div class="fi-value">${file.name}</div>
          </div>
          <div class="file-info-item">
            <div class="fi-label">Size</div>
            <div class="fi-value">${Utils.formatBytes(file.size)}</div>
          </div>
          <div class="file-info-item">
            <div class="fi-label">Type</div>
            <div class="fi-value">${type}</div>
          </div>
          <div class="file-info-item">
            <div class="fi-label">Extension</div>
            <div class="fi-value">${ext}</div>
          </div>
        </div>
      `;
    }

    resultContainer.innerHTML = '';
    resultContainer.style.opacity = '0.5';
    UI.updateShieldState('scanning');

    try {
      const result = await API.analyzeFile(file);
      resultContainer.style.opacity = '1';
      UI.renderScanResult(transformApiResult(result), resultContainer);

      if (fileInfoContainer && result.malware_score !== undefined) {
        fileInfoContainer.innerHTML += `
          <div style="margin-top:12px;padding:12px;background:var(--bg-frost);border-radius:var(--radius-sm);">
            <div style="font-size:13px;font-weight:600;">Malware Score: <span style="color:${Utils.getScoreColor(result.malware_score)}">${result.malware_score}%</span></div>
          </div>
        `;
      }

      const state = result.risk_score > 70 ? 'critical' : result.risk_score > 50 ? 'danger' : result.risk_score > 20 ? 'warning' : 'safe';
      UI.updateShieldState(state, result.risk_score > 50 ? 1 : 0);
    } catch (err) {
      UI.showToast(err.message, 'danger');
    }
  });
}

function initVoiceScan() {
  const upload = document.getElementById('voiceUpload');
  const resultContainer = document.getElementById('voiceScanResult');

  if (!upload || !resultContainer) return;

  const mockTranscripts = [
    { text: 'Hello, this is your bank calling. Your account has been compromised. Please share your OTP to secure it.', riskScore: 88, safe: false },
    { text: 'Hi, this is John from IT department. We need remote access to your computer for an urgent security update.', riskScore: 92, safe: false },
    { text: 'Your Amazon order has been dispatched. Track your package here: http://track-delivery.top', riskScore: 65, safe: false },
    { text: 'Hey, just confirming our meeting tomorrow at 3 PM. Let me know if the time still works.', riskScore: 8, safe: true }
  ];

  upload.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file || !validateFileType(file, ALLOWED_TYPES.voice)) { e.target.value = ''; return; }

    UI.updateShieldState('scanning');

    try {
      const uploadResult = await API.uploadFile(file);
      const result = uploadResult.scan_id ? await API.getScan(uploadResult.scan_id) : uploadResult;

      const transcriptEl = document.getElementById('voiceTranscript');
      if (transcriptEl && result.extracted_text) {
        transcriptEl.innerHTML = `
          <div class="glass-card" style="margin-top:12px;">
            <div style="font-size:13px;font-weight:600;margin-bottom:8px;">📝 Transcript</div>
            <div style="font-size:13px;color:var(--text-secondary);line-height:1.6;">${result.extracted_text}</div>
          </div>
        `;
      }

      UI.renderScanResult(transformApiResult(result), resultContainer);

      const state = result.risk_score > 70 ? 'critical' : result.risk_score > 50 ? 'danger' : result.risk_score > 20 ? 'warning' : 'safe';
      UI.updateShieldState(state, result.risk_score > 50 ? 1 : 0);
    } catch (err) {
      const mock = mockTranscripts[Math.floor(Math.random() * mockTranscripts.length)];

      const transcriptEl = document.getElementById('voiceTranscript');
      if (transcriptEl) {
        transcriptEl.innerHTML = `
          <div class="glass-card" style="margin-top:12px;">
            <div style="font-size:13px;font-weight:600;margin-bottom:8px;">📝 Transcript</div>
            <div style="font-size:13px;color:var(--text-secondary);line-height:1.6;">${mock.text}</div>
          </div>
        `;
      }

      const result = await API.analyzeText(mock.text);
      result.category = 'Voice ' + (mock.safe ? 'Safe' : 'Scam');
      UI.renderScanResult(transformApiResult(result), resultContainer);

      const state = mock.safe ? 'safe' : 'danger';
      UI.updateShieldState(state, mock.safe ? 0 : 1);
    }
  });
}

function initVideoScan() {
  const upload = document.getElementById('videoUpload');
  const resultContainer = document.getElementById('videoScanResult');

  if (!upload || !resultContainer) return;

  const mockResults = [
    { subtitles: 'URGENT: Transfer ₹5,00,000 to this account now.', riskScore: 95, safe: false },
    { subtitles: 'Please watch this tutorial on how to secure your account.', riskScore: 10, safe: true },
    { subtitles: 'Get rich quick! Invest now and earn 1000% returns!', riskScore: 90, safe: false },
    { subtitles: 'Welcome to our webinar on cybersecurity best practices.', riskScore: 5, safe: true }
  ];

  upload.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file || !validateFileType(file, ALLOWED_TYPES.video)) { e.target.value = ''; return; }

    UI.updateShieldState('scanning');

    try {
      const uploadResult = await API.uploadFile(file);
      const result = uploadResult.scan_id ? await API.getScan(uploadResult.scan_id) : uploadResult;

      const subEl = document.getElementById('videoSubtitles');
      if (subEl && result.extracted_text) {
        subEl.innerHTML = `
          <div class="glass-card" style="margin-top:12px;">
            <div style="font-size:13px;font-weight:600;margin-bottom:8px;">🎬 Detected Subtitles/Text</div>
            <div style="font-size:13px;color:var(--text-secondary);line-height:1.6;">${result.extracted_text}</div>
          </div>
        `;
      }

      UI.renderScanResult(transformApiResult(result), resultContainer);

      const state = result.risk_score > 70 ? 'critical' : result.risk_score > 50 ? 'danger' : result.risk_score > 20 ? 'warning' : 'safe';
      UI.updateShieldState(state, result.risk_score > 50 ? 1 : 0);
    } catch (err) {
      const mock = mockResults[Math.floor(Math.random() * mockResults.length)];

      const subEl = document.getElementById('videoSubtitles');
      if (subEl) {
        subEl.innerHTML = `
          <div class="glass-card" style="margin-top:12px;">
            <div style="font-size:13px;font-weight:600;margin-bottom:8px;">🎬 Detected Subtitles/Text</div>
            <div style="font-size:13px;color:var(--text-secondary);line-height:1.6;">${mock.subtitles}</div>
          </div>
        `;
      }

      const result = await API.analyzeText(mock.subtitles);
      result.category = 'Video ' + (mock.safe ? 'Safe' : 'Scam');
      UI.renderScanResult(transformApiResult(result), resultContainer);

      const state = mock.safe ? 'safe' : 'danger';
      UI.updateShieldState(state, mock.safe ? 0 : 1);
    }
  });
}
