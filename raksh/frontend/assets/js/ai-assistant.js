document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('aiAssistantPage')) return;
  const API = window.API;

  let messages = [];

  const welcomeHtml = `
    <div class="ai-welcome-message">
      <div class="welcome-icon">🤖</div>
      <h2>AI Security Analyst</h2>
      <p>Ask me anything about scams, phishing, and online fraud. Paste a suspicious message or URL and I'll analyze it for you.</p>
    </div>
  `;

  function renderWelcome() {
    const container = document.getElementById('aiMessages');
    if (!container) return;
    container.innerHTML = welcomeHtml;
  }

  function addMessage(role, content, analysis) {
    const container = document.getElementById('aiMessages');
    if (!container) return;

    const welcome = container.querySelector('.ai-welcome-message');
    if (welcome) container.innerHTML = '';

    const div = document.createElement('div');
    div.className = 'ai-message ' + role;

    const now = new Date();
    const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    let bubbleHtml = '';
    if (role === 'user') {
      bubbleHtml = '<div class="msg-bubble">' + Utils.escapeHtml(content) + '</div>';
    } else {
      let analysisHtml = '';
      if (analysis) {
        const color = analysis.severityColor || Utils.getScoreColor(analysis.riskScore || 0);
        const recText = analysis.recommendation || 'Exercise caution.';
        const explanation = analysis.similarScamPattern || analysis.reasons?.slice(0, 2).join('. ') || 'Analysis complete.';
        const suggestionsHtml = `
          <div class="ai-suggestions">
            <button class="ai-suggestion-btn" onclick="sendMessage('Explain more about this threat')">Explain More</button>
            <button class="ai-suggestion-btn" onclick="sendMessage('Show me a similar scam example')">Show Similar Scam</button>
            <button class="ai-suggestion-btn" onclick="sendMessage('Help me scan another message')">Scan Another Message</button>
            <button class="ai-suggestion-btn" onclick="sendMessage('How can I protect myself from this?')">Learn About This Threat</button>
          </div>
        `;
        analysisHtml = `
          <div class="ai-ai-response">
            <div>
              <div class="resp-risk-score" style="color:${color}">${analysis.riskScore !== undefined ? analysis.riskScore + '/100' : 'N/A'}</div>
              <div class="resp-section-label">Risk Score</div>
            </div>
            <div>
              <span class="resp-threat-type" style="background:rgba(99,102,241,0.1);color:var(--accent-primary);border:1px solid rgba(99,102,241,0.15);">${analysis.category || 'General'}</span>
              <div class="resp-section-label">Threat Type</div>
            </div>
            <div>
              <div class="resp-text">${Utils.escapeHtml(explanation)}</div>
              <div class="resp-section-label">Explanation</div>
            </div>
            <div>
              <div class="resp-text">${Utils.escapeHtml(recText)}</div>
              <div class="resp-section-label">Recommendation</div>
            </div>
            ${suggestionsHtml}
          </div>
        `;
      } else {
        analysisHtml = '<div class="msg-bubble">' + Utils.escapeHtml(content) + '</div>';
      }
      bubbleHtml = '<div class="msg-bubble">' + analysisHtml + '</div>';
    }

    div.innerHTML = bubbleHtml + '<div class="msg-time">' + time + '</div>' + (role === 'ai' ? '<div class="msg-actions"><button onclick="window.copyResponse(this)">📋 Copy</button></div>' : '');

    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  }

  function showTyping() {
    const container = document.getElementById('aiMessages');
    if (!container) return;
    const typingEl = document.createElement('div');
    typingEl.className = 'ai-typing';
    typingEl.id = 'typingIndicator';
    typingEl.innerHTML = '<div class="typing-avatar">🤖</div><div class="typing-dots"><span></span><span></span><span></span></div>';
    container.appendChild(typingEl);
    container.scrollTop = container.scrollHeight;
  }

  function removeTyping() {
    const el = document.getElementById('typingIndicator');
    if (el) el.remove();
  }

  async function sendMessage(text) {
    if (!text || !text.trim()) return;

    const trimmed = text.trim();
    messages.push({ role: 'user', content: trimmed });
    addMessage('user', trimmed);

    showTyping();

    try {
      const hasUrl = /https?:\/\/[^\s]+/.test(trimmed);
      let result;
      if (hasUrl) {
        result = await API.analyzeUrl(trimmed);
      } else {
        result = await API.analyzeText(trimmed);
      }
      const analysis = {
        riskScore: result.risk_score,
        category: result.threat_category,
        severityColor: Utils.getScoreColor(result.risk_score || 0),
        recommendation: result.recommendation,
        reasons: result.reasons,
        similarScamPattern: result.explanation
      };
      messages.push({ role: 'ai', content: '', analysis: analysis });
      addMessage('ai', '', analysis);
    } catch (e) {
      console.error('AI analysis failed:', e);
      messages.push({ role: 'ai', content: 'Analysis failed. Please try again.', analysis: null });
      addMessage('ai', 'Analysis failed. Please try again.', null);
    } finally {
      removeTyping();
    }
  }

  window.sendMessage = sendMessage;

  function newChat() {
    if (messages.length > 0) { UI.showConfirmDialog('Start a new conversation? Current messages will be lost.', (confirmed) => { if (!confirmed) return; messages = []; renderWelcome(); const input = document.getElementById('aiMessageInput'); if (input) { input.value = ''; input.style.height = 'auto'; input.focus(); } }); return; }
    messages = [];
    renderWelcome();
    const input = document.getElementById('aiMessageInput');
    if (input) { input.value = ''; input.style.height = 'auto'; input.focus(); }
  }

  function clearChat() {
    if (messages.length === 0) {
      if (typeof UI !== 'undefined') UI.showToast('No messages to clear', 'info');
      return;
    }
    UI.showConfirmDialog('Clear all messages?', (confirmed) => {
      if (!confirmed) return;
      messages = [];
      renderWelcome();
      UI.showToast('Chat cleared', 'info');
    });
  }

  window.copyResponse = function(btn) {
    const bubble = btn.closest('.ai-message').querySelector('.msg-bubble');
    const text = bubble ? bubble.textContent.trim() : '';
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      if (typeof UI !== 'undefined') UI.showToast('Copied to clipboard', 'success');
    }).catch(() => {
      if (typeof UI !== 'undefined') UI.showToast('Failed to copy', 'danger');
    });
  };

  function init() {
    renderWelcome();

    const input = document.getElementById('aiMessageInput');
    const sendBtn = document.getElementById('aiSendBtn');
    const newChatBtn = document.getElementById('newChatBtn');
    const clearBtn = document.getElementById('aiClearBtn');
    const fileBtn = document.getElementById('aiFileBtn');
    const uploadBtn = document.getElementById('aiUploadBtn');

    const doSend = async () => {
      const text = input.value.trim();
      if (!text) return;
      await sendMessage(text);
      input.value = '';
      input.style.height = 'auto';
      input.focus();
    };

    if (sendBtn) sendBtn.addEventListener('click', doSend);
    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          doSend();
        }
      });
      input.addEventListener('input', () => {
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 120) + 'px';
      });
    }
    if (newChatBtn) newChatBtn.addEventListener('click', newChat);
    if (clearBtn) clearBtn.addEventListener('click', clearChat);

    const showComingSoon = () => {
      if (typeof UI !== 'undefined') UI.showToast('Coming soon', 'info');
    };

    if (fileBtn) fileBtn.addEventListener('click', showComingSoon);
    if (uploadBtn) uploadBtn.addEventListener('click', showComingSoon);
  }

  init();
});
