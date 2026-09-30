const API = window.API;

document.addEventListener('DOMContentLoaded', async () => {
  if (!document.getElementById('securityCenterPage')) return;
  showSecCenterSkeletons();
  try {
    await initSecurityCenter();
  } catch (e) {
    console.error('Security center init failed:', e);
  }
  hideSecCenterSkeletons();
});

function showSecCenterSkeletons() {
  const feed = document.getElementById('secFeedPosts');
  if (feed) {
    feed.innerHTML = Array(3).fill(`
      <div class="skeleton-card"><div class="skeleton-row"><div class="skeleton skeleton-block" style="width:40px;height:40px;border-radius:50%;"></div><div><div class="skeleton skeleton-line" style="width:120px;height:12px;margin-bottom:4px;"></div><div class="skeleton skeleton-line" style="width:80px;height:10px;"></div></div></div><div class="skeleton skeleton-line" style="width:90%;height:12px;margin:12px 0 6px;"></div><div class="skeleton skeleton-line" style="width:70%;height:12px;margin-bottom:8px;"></div></div>
    `).join('');
  }
  const threatTable = document.getElementById('secCampaignsTable');
  if (threatTable) {
    threatTable.innerHTML = Array(4).fill(`<div class="skeleton skeleton-line" style="width:100%;height:32px;margin-bottom:4px;"></div>`).join('');
  }
  const historyTable = document.getElementById('secHistoryTable');
  if (historyTable) {
    historyTable.innerHTML = Array(5).fill(`<div class="skeleton-row" style="padding:8px 0;"><div class="skeleton skeleton-block" style="width:24px;height:24px;border-radius:50%;"></div><div class="skeleton skeleton-line" style="width:60%;height:12px;"></div><div class="skeleton skeleton-line" style="width:40px;height:12px;"></div></div>`).join('');
  }
  const threatStats = document.getElementById('secThreatStats');
  if (threatStats) {
    threatStats.innerHTML = Array(5).fill(`<div class="skeleton-card"><div class="skeleton skeleton-line" style="width:40%;height:24px;margin:0 auto 4px;"></div><div class="skeleton skeleton-line" style="width:60%;height:12px;margin:0 auto;"></div></div>`).join('');
  }
}

function hideSecCenterSkeletons() {
  document.querySelectorAll('.skeleton-card, [class*="skeleton"]').forEach(el => {
    if (el.closest('#secFeedPosts') || el.closest('#secCampaignsTable') || el.closest('#secHistoryTable') || el.closest('#secThreatStats')) {
      if (!el.querySelector('.skeleton')) return;
    }
  });
}

let SEC = {
  currentFeedFilter: 'forYou',
  currentScamSeverity: 'all',
  scamSearchTerm: '',
  historyPage: 1,
  historyPageSize: 20,
  notifFilter: 'all',
  notifSearchTerm: '',
  posts: [],
  allPosts: [],
  historyData: [],
  notifications: []
};



function getSeverityColor(sev) {
  return { Critical:'#ef4444', High:'#f97316', Medium:'#eab308', Low:'#3b82f6', Safe:'#22c55e' }[sev] || '#6366f1';
}

async function initSecurityCenter() {
  initTabs();
  await renderFeedPosts();
  renderFeedSidebar();
  renderFeedChallenges();
  renderThreatIntelligence();
  renderScamDatabase();
  await renderScanHistory();
  await renderNotifications();
}

function initTabs() {
  document.querySelectorAll('.sec-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.sec-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.sec-panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      const panel = document.getElementById(tab.getAttribute('data-tab'));
      if (panel) panel.classList.add('active');
    });
  });
}

/* ======================== COMMUNITY FEED ======================== */

async function renderFeedPosts() {
  const container = document.getElementById('secFeedPosts');
  if (!container) return;
  try {
    const msgs = await API.getMessages({limit: 20}).then(d => d.messages || d);
    SEC.allPosts = (msgs || []).map((m, i) => ({
      id: m.id || 'msg_' + i,
      author: 'Community Member',
      avatar: '👤',
      avatarBg: '#6366f1',
      verified: false,
      time: Utils.formatRelativeTime(new Date(m.created_at).getTime()),
      threatTag: m.threat_category || 'General',
      content: m.message_content || '',
      hashtags: [],
      likes: 0, liked: false, reposts: 0, comments: 0,
      bookmarked: false, bookmarkCount: 0
    }));
  } catch (e) {
    console.error('Failed to load posts:', e);
    SEC.allPosts = [];
  }
  applyFeedFilter();

  const newPostBtn = document.getElementById('newPostBtn');
  if (newPostBtn) {
    newPostBtn.onclick = () => {
      UI.showModal(`<div class="modal-header"><h2>Create Post</h2><button class="modal-close" onclick="UI.closeModal()">✕</button></div>
        <div style="margin-top:12px;">
          <textarea id="newPostContent" style="width:100%;min-height:100px;padding:12px;background:var(--bg-frost);border:1px solid var(--border-glass);border-radius:var(--radius-sm);color:var(--text-primary);font-family:inherit;font-size:13px;resize:vertical;" placeholder="Share a security tip, scam alert, or question..."></textarea>
          <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap;">
            <select id="newPostTag" style="padding:8px;background:var(--bg-frost);border:1px solid var(--border-glass);border-radius:var(--radius-sm);color:var(--text-secondary);font-size:12px;">
              <option value="Phishing">Phishing</option>
              <option value="QR Scam">QR Scam</option>
              <option value="Vishing">Vishing</option>
              <option value="Investment Scam">Investment Scam</option>
              <option value="Fake Job">Fake Job</option>
              <option value="Safety Tip">Safety Tip</option>
              <option value="Deepfake">Deepfake</option>
              <option value="Banking">Banking</option>
              <option value="Scam Alert">Scam Alert</option>
              <option value="Crypto">Crypto</option>
            </select>
          </div>
          <div style="display:flex;gap:8px;margin-top:12px;justify-content:flex-end;">
            <button class="btn btn-sm btn-ghost" onclick="UI.closeModal()">Cancel</button>
            <button class="btn btn-sm btn-primary" onclick="submitNewPost()">Post</button>
          </div>
        </div>`);
    };
  }

  document.querySelectorAll('[data-feed-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-feed-filter]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      SEC.currentFeedFilter = btn.getAttribute('data-feed-filter');
      applyFeedFilter();
    });
  });
}

function submitNewPost() {
  const content = document.getElementById('newPostContent');
  const tag = document.getElementById('newPostTag');
  if (!content || !content.value.trim()) { UI.showToast('Please enter post content', 'warning'); return; }
  const hashtags = content.value.match(/#\w+/g) || [];
  const post = {
    id: 'new_' + Utils.generateId(),
    author: 'You',
    avatar: '👤',
    avatarBg: '#6366f1',
    verified: false,
    time: 'Just now',
    threatTag: tag ? tag.value : 'Safety Tip',
    content: content.value.trim(),
    hashtags: hashtags.map(h => h.replace('#','')),
    likes: 0,
    liked: false,
    reposts: 0,
    comments: 0,
    bookmarked: false,
    bookmarkCount: 0
  };
  SEC.allPosts.unshift(post);
  applyFeedFilter();
  UI.closeModal();
  UI.showToast('Post shared with community!', 'success');
}

function applyFeedFilter() {
  let filtered = [...SEC.allPosts];
  const filter = SEC.currentFeedFilter;
  if (filter === 'trending') filtered.sort((a,b) => (b.likes + b.reposts) - (a.likes + a.reposts));
  else if (filter === 'latest') filtered.sort((a,b) => a.time.localeCompare(b.time));
  else if (filter === 'following') filtered = filtered.filter(p => p.verified);
  else filtered.sort((a,b) => (b.likes + b.reposts) - (a.likes + a.reposts));
  SEC.posts = filtered;
  renderPostsInner();
}

function renderPostsInner() {
  const container = document.getElementById('secFeedPosts');
  if (!container) return;
  if (!SEC.posts.length) {
    container.innerHTML = '<div class="sec-empty"><div class="sec-empty-icon">📝</div><div class="sec-empty-title">No posts to show</div><div class="sec-empty-desc">Be the first to share!</div></div>';
    return;
  }
  container.innerHTML = SEC.posts.map((p, i) => buildPostHTML(p, i)).join('');
  container.querySelectorAll('.post-like-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const id = this.getAttribute('data-id');
      const post = SEC.allPosts.find(x => x.id === id);
      if (!post) return;
      post.liked = !post.liked;
      post.likes += post.liked ? 1 : -1;
      applyFeedFilter();
    });
  });
  container.querySelectorAll('.post-bookmark-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const id = this.getAttribute('data-id');
      const post = SEC.allPosts.find(x => x.id === id);
      if (!post) return;
      post.bookmarked = !post.bookmarked;
      post.bookmarkCount += post.bookmarked ? 1 : -1;
      applyFeedFilter();
    });
  });
  container.querySelectorAll('.poll-option').forEach(el => {
    el.addEventListener('click', function() {
      const parent = this.closest('.sec-poll');
      if (parent && parent.querySelector('.poll-option.voted')) return;
      this.classList.add('voted');
      const bar = this.querySelector('.poll-bar');
      if (bar) bar.style.width = '100%';
      this.querySelector('.poll-vote-count').textContent = 'Voted';
      UI.showToast('Vote recorded!', 'success');
    });
  });
}

function buildPostHTML(p, i) {
  const pollHTML = p.poll ? `
    <div class="sec-poll">
      <div style="font-size:12px;font-weight:500;margin-bottom:6px;color:var(--text-secondary);">📊 ${p.poll.question}</div>
      ${p.poll.options.map((opt, oi) => {
        const total = p.poll.votes.reduce((a,b) => a + b, 0);
        const pct = total > 0 ? Math.round((p.poll.votes[oi] / total) * 100) : 0;
        return `<div class="poll-option sec-poll-option" style="padding:8px 12px;margin-bottom:4px;background:var(--bg-frost);border-radius:var(--radius-sm);cursor:pointer;position:relative;overflow:hidden;display:flex;align-items:center;gap:8px;">
          <div class="poll-bar" style="position:absolute;left:0;top:0;bottom:0;width:${pct}%;background:rgba(99,102,241,0.15);border-radius:var(--radius-sm);"></div>
          <span class="poll-text" style="position:relative;z-index:1;font-size:13px;flex:1;">${opt}</span>
          <span class="poll-pct" style="position:relative;z-index:1;font-size:12px;color:var(--text-muted);font-weight:600;">${pct}%</span>
          <span class="poll-vote-count" style="position:relative;z-index:1;font-size:11px;color:var(--text-muted);">${formatNumber(p.poll.votes[oi])}</span>
        </div>`;
      }).join('')}
      <div style="font-size:10px;color:var(--text-muted);margin-top:4px;">${formatNumber(total)} total votes</div>
    </div>` : '';

  return `<div class="glass-card sec-post animate-slide-in" style="animation-delay:${i*0.03}s">
    <div class="post-header">
      <div class="post-avatar" style="background:${p.avatarBg}">${p.avatar}</div>
      <div class="post-author-info">
        <div class="post-author">${p.author}${p.verified ? '<span class="post-badge">✓ Verified</span>' : ''}<span style="font-size:10px;color:var(--text-muted);margin-left:6px;">${p.threatTag}</span></div>
        <div class="post-meta">${p.time}</div>
      </div>
    </div>
    <div class="post-content">${p.content}</div>
    ${pollHTML}
    <div class="post-tags">${p.hashtags.map(h => `<span class="post-tag">#${h}</span>`).join('')}</div>
    <div class="post-actions">
      <button class="post-like-btn ${p.liked ? 'liked' : ''}" data-id="${p.id}">${p.liked ? '❤️' : '🤍'} <span>${formatNumber(p.likes)}</span></button>
      <button onclick="UI.showToast('Comments coming soon!','info')">💬 <span>${formatNumber(p.comments)}</span></button>
      <button onclick="UI.showToast('Reposted!','success')">🔄 <span>${formatNumber(p.reposts)}</span></button>
      <button class="post-bookmark-btn ${p.bookmarked ? 'bookmarked' : ''}" data-id="${p.id}">${p.bookmarked ? '🔖' : '🏷️'} <span>${formatNumber(p.bookmarkCount||0)}</span></button>
      <button onclick="UI.showToast('Link copied!','success')">🔗</button>
      <button onclick="UI.showToast('Reported','info')">🚩</button>
    </div>
  </div>`;
}

function renderFeedSidebar() {
  renderTrendingHashtags();
  renderNewsSidebar();
  renderExpertsSidebar();
  renderChallengesSidebar();
}

function renderTrendingHashtags() {
  const el = document.getElementById('secTrendingHashtags');
  if (!el) return;
  const tagCounts = {};
  (SEC.allPosts || []).forEach(p => (p.hashtags || []).forEach(h => { tagCounts[h] = (tagCounts[h]||0) + 1; }));
  const sorted = Object.entries(tagCounts).sort((a,b) => b[1] - a[1]);
  const tags = sorted.length ? sorted : [['phishing',1247],['banking',983],['qr-scam',856],['deepfake',721],['job-scam',654],['safety-tip',512],['crypto',478],['vishing',389]];
  el.innerHTML = `<div class="sec-hashtag-list">${tags.slice(0,8).map(([tag,count]) =>
    `<div class="sec-hashtag-item"><span class="hashtag-name">#${tag}</span><span class="hashtag-count">${formatNumber(count)}</span></div>`
  ).join('')}</div>`;
}

function renderNewsSidebar() {
  const el = document.getElementById('secNewsSidebar');
  if (!el) return;
  const news = DATA.securityNews || [];
  el.innerHTML = news.slice(0,5).map(n => {
    const sevColor = { critical:'#ef4444', high:'#f97316', warning:'#eab308', medium:'#3b82f6', info:'#6366f1' }[n.severity] || '#6366f1';
    return `<div class="sec-news-item">
      <div class="news-sev-dot" style="background:${sevColor}"></div>
      <div class="news-content">
        <div class="news-title">${n.title}</div>
        <div class="news-source">${n.source} • ${n.time}</div>
      </div>
    </div>`;
  }).join('');
}

function renderExpertsSidebar() {
  const el = document.getElementById('secExpertsSidebar');
  if (!el) return;
  const experts = [
    { avatar:'🛡️', bg:'#6366f1', name:'CyberShield', specialty:'Phishing Expert' },
    { avatar:'🌊', bg:'#06b6d4', name:'SafeSurfer', specialty:'QR Security' },
    { avatar:'🔍', bg:'#f97316', name:'DigitalDetective', specialty:'Malware Analysis' },
    { avatar:'👁️', bg:'#ef4444', name:'ScamWatcher', specialty:'Social Engineering' }
  ];
  el.innerHTML = experts.map(e => `
    <div class="sec-expert-item">
      <div class="expert-avatar" style="background:${e.bg}">${e.avatar}</div>
      <div class="expert-info"><div class="expert-name">${e.name}</div><div class="expert-specialty">${e.specialty}</div></div>
      <button class="btn btn-sm btn-ghost" style="font-size:10px;" onclick="this.textContent=this.textContent==='Follow'?'Following':'Follow';UI.showToast(this.textContent==='Following'?'Following expert':'Unfollowed','info')">Follow</button>
    </div>
  `).join('');
}

function renderChallengesSidebar() {
  const el = document.getElementById('secChallengesSidebar');
  if (!el) return;
  const challenges = DATA.communityChallenges || [];
  el.innerHTML = challenges.slice(0,3).map(c => `
    <div class="sec-challenge-card">
      <div class="challenge-icon">🏆</div>
      <div class="challenge-title">${c.title}</div>
      <div class="challenge-desc">${c.description}</div>
      <div class="challenge-meta"><span>👥 ${formatNumber(c.participants)}</span><span>📅 ${c.daysLeft}d left</span></div>
      <div class="challenge-reward">🎁 ${c.reward}</div>
    </div>
  `).join('');
}

function renderFeedChallenges() {
  const el = document.getElementById('secFeedChallenges');
  if (!el) return;
  const challenges = [
    { icon:'🏆', title:'Scam Spotter', desc:'Correctly identify 10 scam messages', progress:6, max:10, reward:'500 XP' },
    { icon:'📚', title:'Knowledge Seeker', desc:'Complete 5 learning modules', progress:2, max:5, reward:'300 XP' },
    { icon:'👥', title:'Community Helper', desc:'Help 5 community members', progress:3, max:5, reward:'400 XP' },
    { icon:'🛡️', title:'Vigilant Guardian', desc:'Report 10 scams to community', progress:4, max:10, reward:'600 XP' }
  ];
  el.innerHTML = `<div class="challenges-title">🏆 Community Challenges</div>
    <div class="sec-feed-challenges-grid">${challenges.map(c => `
      <div class="glass-card sec-feed-challenge">
        <div class="fc-icon">${c.icon}</div>
        <div class="fc-title">${c.title}</div>
        <div class="fc-desc">${c.desc}</div>
        <div class="fc-progress"><div class="progress-bar"><div class="progress-fill" style="width:${(c.progress/c.max)*100}%"></div></div></div>
        <div class="fc-reward">🎁 ${c.reward} • ${c.progress}/${c.max}</div>
      </div>
    `).join('')}</div>`;
}

/* ======================== THREAT INTELLIGENCE ======================== */

function renderThreatIntelligence() {
  renderThreatStats();
  renderCampaigns();
  renderAttackCards();
  renderDomains();
  renderTimeline();
  renderAttackStats();
}

function renderThreatStats() {
  const el = document.getElementById('secThreatStats');
  if (!el) return;
  const td = DATA.threatData;
  const stats = td.attackStats;
  el.innerHTML = `
    <div class="threat-stat-card"><div class="stat-value" style="color:var(--accent-danger)">${formatNumber(stats.totalAttacks)}</div><div class="stat-label">Total Attacks</div></div>
    <div class="threat-stat-card"><div class="stat-value" style="color:var(--accent-success)">${formatNumber(stats.blockedByRaksh)}</div><div class="stat-label">Blocked by RAKSH</div></div>
    <div class="threat-stat-card"><div class="stat-value" style="color:var(--accent-warning)">${stats.activeCampaigns}</div><div class="stat-label">Active Campaigns</div></div>
    <div class="threat-stat-card"><div class="stat-value" style="color:var(--accent-secondary)">${stats.detectionRate}</div><div class="stat-label">Detection Rate</div></div>
    <div class="threat-stat-card"><div class="stat-value" style="color:var(--accent-primary)">${stats.avgResponseTime}</div><div class="stat-label">Avg Response Time</div></div>
  `;
}

function renderCampaigns() {
  const el = document.getElementById('secCampaignsTable');
  if (!el) return;
  const campaigns = DATA.threatData.campaigns || [];
  el.innerHTML = `<table class="sec-dense-table">
    <thead><tr><th>Name</th><th>Active Targets</th><th>Method</th><th>Scale</th><th>Status</th><th>Severity</th></tr></thead>
    <tbody>${campaigns.map(c => {
      const sevColor = getSeverityColor(c.severity);
      const statusColor = c.status === 'Active' ? 'var(--accent-danger)' : 'var(--accent-success)';
      return `<tr>
        <td style="font-weight:500">${c.name}</td>
        <td>${c.activeTargets}</td>
        <td style="font-size:11px">${c.method}</td>
        <td>${c.scale}</td>
        <td style="color:${statusColor};font-weight:500">${c.status}</td>
        <td><span class="severity-dot" style="background:${sevColor}"></span>${c.severity}</td>
      </tr>`;
    }).join('')}</tbody>
  </table>`;
}

function renderAttackCards() {
  const el = document.getElementById('secAttackCards');
  if (!el) return;
  const attacks = DATA.threatData.topAttacks || [];
  el.innerHTML = attacks.map(a => {
    const color = ['#ef4444','#f97316','#eab308','#06b6d4','#8b5cf6','#64748b'][attacks.indexOf(a)];
    return `<div class="attack-card">
      <div class="attack-header">
        <span class="attack-name">${a.name}</span>
        <span class="attack-pct" style="color:${color}">${a.percentage}%</span>
      </div>
      <div class="attack-bar"><div class="attack-fill" style="width:${a.percentage}%;background:${color}"></div></div>
      <div class="attack-meta"><span>${formatNumber(a.count)} incidents</span><span style="color:${a.trend.startsWith('+') ? 'var(--accent-danger)' : 'var(--accent-success)'}">${a.trend}</span></div>
    </div>`;
  }).join('');
}

function renderDomains() {
  const el = document.getElementById('secDomainsTable');
  if (!el) return;
  const domains = DATA.threatData.highRiskDomains || [];
  el.innerHTML = domains.map(d => {
    const riskColor = getSeverityColor(d.risk);
    return `<div class="domain-item">
      <div><div class="domain-name">${d.domain}</div><div class="domain-category">${d.category}</div></div>
      <div class="domain-meta"><span class="severity-dot" style="background:${riskColor}"></span><span style="color:${riskColor};font-weight:500">${d.risk}</span><span class="domain-blocks" style="display:block;margin-top:2px;">${formatNumber(d.blocks)} blocks</span></div>
    </div>`;
  }).join('');
}

function renderTimeline() {
  const el = document.getElementById('secThreatTimeline');
  if (!el) return;
  const timeline = DATA.threatData.timeline || [];
  el.innerHTML = `<div class="timeline-vertical">${timeline.map((t, idx) => {
    const dotColor = { critical:'#ef4444', high:'#f97316', medium:'#eab308', info:'#6366f1' }[t.severity] || '#6366f1';
    return `<div class="timeline-entry" style="--tl-dot-color:${dotColor}">
      <div class="tl-date">${t.date}</div>
      <div class="tl-event">${t.event}</div>
    </div>`;
  }).join('')}</div>
  <style>.timeline-entry::before { border-color: var(--tl-dot-color, var(--accent-primary)) !important; }</style>`;
}

function renderAttackStats() {
  const el = document.getElementById('secAttackStats');
  if (!el) return;
  const td = DATA.threatData;
  const stats = [
    { key: 'Total Attacks Analyzed', val: formatNumber(td.attackStats.totalAttacks) },
    { key: 'Blocked by RAKSH', val: formatNumber(td.attackStats.blockedByRaksh) },
    { key: 'Active Campaigns', val: td.attackStats.activeCampaigns },
    { key: 'Mitigated Campaigns', val: td.attackStats.mitigatedCampaigns },
    { key: 'Detection Rate', val: td.attackStats.detectionRate },
    { key: 'Avg Response Time', val: td.attackStats.avgResponseTime },
    { key: 'Top Attack Vector', val: 'Phishing (42%)' },
    { key: 'Fastest Growing', val: 'Deepfake (+67%)' }
  ];
  el.innerHTML = stats.map(s => `
    <div class="attack-stat-row">
      <span class="stat-key">${s.key}</span>
      <span class="stat-val">${s.val}</span>
    </div>
  `).join('');
}

/* ======================== SCAM DATABASE ======================== */

function renderScamDatabase() {
  const grid = document.getElementById('secScamGrid');
  if (!grid) return;
  renderScamCards();

  const searchInput = document.getElementById('secScamSearch');
  if (searchInput) {
    searchInput.addEventListener('input', Utils.debounce(() => {
      SEC.scamSearchTerm = searchInput.value.toLowerCase();
      renderScamCards();
    }, 200));
  }

  document.querySelectorAll('[data-scam-severity]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-scam-severity]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      SEC.currentScamSeverity = btn.getAttribute('data-scam-severity');
      renderScamCards();
    });
  });
}

function renderScamCards() {
  const grid = document.getElementById('secScamGrid');
  if (!grid) return;
  let scams = DATA.scamDatabase || [];
  if (SEC.currentScamSeverity !== 'all') scams = scams.filter(s => s.severity === SEC.currentScamSeverity);
  if (SEC.scamSearchTerm) scams = scams.filter(s => s.name.toLowerCase().includes(SEC.scamSearchTerm) || s.description.toLowerCase().includes(SEC.scamSearchTerm) || s.indicators.some(i => i.toLowerCase().includes(SEC.scamSearchTerm)));

  if (!scams.length) {
    grid.innerHTML = '<div class="sec-empty" style="grid-column:1/-1"><div class="sec-empty-icon">🔍</div><div class="sec-empty-title">No scams found</div><div class="sec-empty-desc">Try adjusting your search or filter</div></div>';
    return;
  }
  grid.innerHTML = scams.map(s => {
    const sevColor = getSeverityColor(s.severity);
    return `<div class="glass-card sec-scam-card severity-${s.severity}" onclick="toggleScamCard(this)">
      <div class="scam-header">
        <span class="scam-name">${s.name}</span>
        <span class="scam-badge ${s.severity}" style="background:${sevColor}20;color:${sevColor}">${s.severity}</span>
      </div>
      <div class="scam-desc">${s.description}</div>
      <div class="scam-indicators">${s.indicators.slice(0,3).map(i => `<span class="scam-indicator">${i}</span>`).join('')}${s.indicators.length > 3 ? `<span class="scam-indicator">+${s.indicators.length-3}</span>` : ''}</div>
      <div class="scam-prevention">🛡️ ${s.prevention}</div>
      <div class="scam-updated">Last updated: ${s.lastUpdated}</div>
    </div>`;
  }).join('');
}

function toggleScamCard(el) {
  el.classList.toggle('expanded');
}

/* ======================== SCAN HISTORY ======================== */

async function renderScanHistory() {
  try {
    const data = await API.getScanHistory({limit: 100}).then(d => d.scans);
    SEC.historyData = (data || []).map(s => ({
      id: s.id,
      timestamp: new Date(s.created_at).getTime(),
      type: s.type || 'Text',
      content: (s.message && s.message.message_content) || '',
      riskScore: s.risk_score,
      severity: s.severity,
      category: s.threat_category || 'Unknown',
      confidence: s.confidence,
      details: s.details || {}
    }));
  } catch (e) {
    console.error('Failed to load scan history:', e);
    SEC.historyData = [];
  }
  SEC.historyPage = 1;
  renderHistorySummary();
  renderHistoryTable();

  ['secHistorySearch','secHistorySeverity','secHistoryCategory','secHistoryType','secHistorySort'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', () => { SEC.historyPage = 1; renderHistoryTable(); renderHistorySummary(); });
  });
  const searchEl = document.getElementById('secHistorySearch');
  if (searchEl) searchEl.addEventListener('input', Utils.debounce(() => { SEC.historyPage = 1; renderHistoryTable(); }, 200));

  document.getElementById('secExportPDF')?.addEventListener('click', () => {
    const filtered = getFilteredHistory();
    const items = filtered.map(h => `Date: ${Utils.formatDate(h.timestamp)}\nType: ${h.type}\nContent: ${h.content}\nRisk Score: ${h.riskScore}%\nSeverity: ${h.severity}\nCategory: ${h.category}\n---`).join('\n');
    const html = `<html><head><meta charset="utf-8"><style>body{font-family:sans-serif;padding:20px;background:#f5f5f5;}h1{font-size:18px;color:#333;}hr{border:1px solid #ccc;}.entry{padding:6px 0;border-bottom:1px solid #eee;font-size:13px;white-space:pre-wrap;}</style></head><body><h1>Scan History</h1><p>Exported: ${new Date().toLocaleString()}</p><hr><div class="entry">${items.replace(/\n/g, '<br>')}</div></body></html>`;
    Utils.downloadFile(html, 'scan_history.pdf', 'text/html');
    UI.showToast('Exported as PDF Document', 'success');
  });
  document.getElementById('secExportTXT')?.addEventListener('click', () => {
    const filtered = getFilteredHistory();
    const text = filtered.map(h => `Date: ${Utils.formatDate(h.timestamp)}\nType: ${h.type}\nContent: ${h.content}\nRisk Score: ${h.riskScore}%\nSeverity: ${h.severity}\nCategory: ${h.category}\n---`).join('\n');
    Utils.downloadFile(text, 'scan_history.txt', 'text/plain');
    UI.showToast('Exported as Text Document', 'success');
  });
}

function getFilteredHistory() {
  let data = [...SEC.historyData];
  const search = document.getElementById('secHistorySearch')?.value?.toLowerCase() || '';
  const severity = document.getElementById('secHistorySeverity')?.value || 'all';
  const category = document.getElementById('secHistoryCategory')?.value || 'all';
  const type = document.getElementById('secHistoryType')?.value || 'all';
  const sort = document.getElementById('secHistorySort')?.value || 'newest';

  if (search) data = data.filter(h => h.content?.toLowerCase().includes(search) || h.category?.toLowerCase().includes(search) || h.severity?.toLowerCase().includes(search));
  if (severity !== 'all') data = data.filter(h => h.severity === severity);
  if (category !== 'all') data = data.filter(h => h.category === category);
  if (type !== 'all') data = data.filter(h => h.type?.toLowerCase() === type.toLowerCase());

  if (sort === 'newest') data.sort((a,b) => b.timestamp - a.timestamp);
  else if (sort === 'oldest') data.sort((a,b) => a.timestamp - b.timestamp);
  else if (sort === 'risk-desc') data.sort((a,b) => b.riskScore - a.riskScore);
  else if (sort === 'risk-asc') data.sort((a,b) => a.riskScore - b.riskScore);

  return data;
}

function renderHistorySummary() {
  const el = document.getElementById('secHistorySummary');
  if (!el) return;
  const data = getFilteredHistory();
  const total = data.length;
  const critical = data.filter(h => h.severity === 'Critical').length;
  const high = data.filter(h => h.severity === 'High').length;
  const medium = data.filter(h => h.severity === 'Medium').length;
  const low = data.filter(h => h.severity === 'Low').length;
  const safe = data.filter(h => h.severity === 'Safe').length;

  el.innerHTML = `
    <div class="sec-history-stat"><div class="stat-count" style="color:var(--text-primary)">${total}</div><div class="stat-label">Total Scans</div></div>
    <div class="sec-history-stat"><div class="stat-count" style="color:var(--accent-danger)">${critical}</div><div class="stat-label">Critical</div></div>
    <div class="sec-history-stat"><div class="stat-count" style="color:var(--accent-orange)">${high}</div><div class="stat-label">High</div></div>
    <div class="sec-history-stat"><div class="stat-count" style="color:var(--accent-warning)">${medium}</div><div class="stat-label">Medium</div></div>
    <div class="sec-history-stat"><div class="stat-count" style="color:var(--accent-info)">${low}</div><div class="stat-label">Low</div></div>
    <div class="sec-history-stat"><div class="stat-count" style="color:var(--accent-success)">${safe}</div><div class="stat-label">Safe</div></div>
  `;
}

function renderHistoryTable() {
  const container = document.getElementById('secHistoryTable');
  const pagination = document.getElementById('secHistoryPagination');
  if (!container) return;
  const filtered = getFilteredHistory();
  const totalPages = Math.ceil(filtered.length / SEC.historyPageSize) || 1;
  if (SEC.historyPage > totalPages) SEC.historyPage = totalPages;
  const start = (SEC.historyPage - 1) * SEC.historyPageSize;
  const page = filtered.slice(start, start + SEC.historyPageSize);

  if (!page.length) {
    if (!SEC.historyData.length) {
      container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🔍</div><div class="empty-state-text">No scans yet. Go to Scanner to analyze your first message.</div><a href="scan.html" class="btn btn-sm btn-primary empty-state-action">Go to Scanner</a></div>';
    } else {
      container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📋</div><div class="empty-state-text">No scans match your current filters. Try adjusting them.</div></div>';
    }
    if (pagination) pagination.innerHTML = '';
    return;
  }

  const typeIcons = { Text:'💬', Link:'🔗', QR:'📷', File:'📁', Voice:'🎤', Image:'🖼️' };
  container.innerHTML = page.map(h => `
    <div class="sec-history-row">
      <div class="h-type">${typeIcons[h.type]||'📝'}</div>
      <div class="h-content">${Utils.truncate(h.content || '', 50)}</div>
      <div class="h-score" style="color:${getSeverityColor(h.severity)}">${h.riskScore}%</div>
      <div class="h-category"><span class="badge badge-${(h.severity||'info').toLowerCase()}">${h.severity}</span></div>
      <div class="h-category">${h.category||'—'}</div>
      <div class="h-actions"><button class="btn btn-sm btn-ghost" onclick="showScanDetail('${h.id}')">👁️ View</button></div>
    </div>
  `).join('');

  if (pagination) {
    let pagesHTML = '';
    const maxVisible = 5;
    let startPage = Math.max(1, SEC.historyPage - Math.floor(maxVisible/2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    if (endPage - startPage < maxVisible - 1) startPage = Math.max(1, endPage - maxVisible + 1);

    if (SEC.historyPage > 1) pagesHTML += `<button class="page-btn" data-page="${SEC.historyPage-1}">◀</button>`;
    if (startPage > 1) pagesHTML += `<button class="page-btn" data-page="1">1</button>${startPage > 2 ? '<span class="page-info">...</span>' : ''}`;
    for (let i = startPage; i <= endPage; i++) {
      pagesHTML += `<button class="page-btn ${i === SEC.historyPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }
    if (endPage < totalPages) pagesHTML += `${endPage < totalPages - 1 ? '<span class="page-info">...</span>' : ''}<button class="page-btn" data-page="${totalPages}">${totalPages}</button>`;
    if (SEC.historyPage < totalPages) pagesHTML += `<button class="page-btn" data-page="${SEC.historyPage+1}">▶</button>`;
    pagesHTML += `<span class="page-info">Page ${SEC.historyPage} of ${totalPages} (${filtered.length} results)</span>`;
    pagination.innerHTML = pagesHTML;
    pagination.querySelectorAll('.page-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        SEC.historyPage = parseInt(btn.getAttribute('data-page'));
        renderHistoryTable();
      });
    });
  }
}

function showScanDetail(id) {
  const scan = SEC.historyData.find(h => h.id === id);
  if (!scan) { UI.showToast('Scan not found', 'danger'); return; }
  const reasons = scan.details?.reasons || ['No details available'];
  const escapedContent = Utils.escapeHtml(scan.content);
  UI.showModal(`<div class="modal-header"><h2>Scan Details</h2><button class="modal-close" onclick="UI.closeModal()">✕</button></div>
    <div style="font-size:12px;color:var(--text-muted);margin-bottom:8px;">${Utils.formatDate(scan.timestamp)} at ${Utils.formatTime(scan.timestamp)}</div>
    <div style="padding:10px;background:var(--bg-frost);border-radius:var(--radius-sm);margin-bottom:12px;font-size:13px;color:var(--text-secondary);">"${escapedContent}"</div>
    <div class="scan-detail-grid">
      <div class="scan-detail-item"><div class="detail-label">Risk Score</div><div class="detail-value" style="color:${getSeverityColor(scan.severity)}">${scan.riskScore}%</div></div>
      <div class="scan-detail-item"><div class="detail-label">Severity</div><div class="detail-value" style="color:${getSeverityColor(scan.severity)}">${scan.severity}</div></div>
      <div class="scan-detail-item"><div class="detail-label">Category</div><div class="detail-value">${scan.category||'—'}</div></div>
      <div class="scan-detail-item"><div class="detail-label">Confidence</div><div class="detail-value">${Math.round(scan.confidence||0)}%</div></div>
      <div class="scan-detail-item"><div class="detail-label">Type</div><div class="detail-value">${scan.type||'—'}</div></div>
      <div class="scan-detail-item"><div class="detail-label">Malware Score</div><div class="detail-value">${scan.details?.malwareScore != null ? scan.details.malwareScore+'%' : 'N/A'}</div></div>
    </div>
    <div class="scan-detail-reasons"><div style="font-size:12px;font-weight:500;margin-bottom:4px;">Reasons</div>${reasons.map(r => `<div class="detail-reason">${r}</div>`).join('')}</div>
    ${scan.details?.psychologicalTactics?.length ? `<div class="scan-detail-reasons" style="margin-top:8px;"><div style="font-size:12px;font-weight:500;margin-bottom:4px;">Psychological Tactics</div>${scan.details.psychologicalTactics.map(t => `<div class="detail-reason">${t}</div>`).join('')}</div>` : ''}
    <div class="scan-detail-recommendation">${scan.details?.recommendation || 'No recommendation available.'}</div>
    <div style="display:flex;gap:8px;margin-top:12px;justify-content:flex-end;">
      <button class="btn btn-sm btn-ghost" onclick="UI.closeModal()">Close</button>
      <button class="btn btn-sm btn-secondary" id="scanExportBtn">📥 Export</button>
    </div>`);
  const exportBtn = document.getElementById('scanExportBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const text = `Date: ${Utils.formatDate(scan.timestamp)}\nTime: ${Utils.formatTime(scan.timestamp)}\nType: ${scan.type}\nCategory: ${scan.category}\nRisk Score: ${scan.riskScore}%\nSeverity: ${scan.severity}\nConfidence: ${Math.round(scan.confidence||0)}%\nContent: ${scan.content}\nRecommendation: ${scan.details?.recommendation || 'N/A'}`;
      Utils.downloadFile(text, 'scan_' + id + '.txt', 'text/plain');
      UI.showToast('Exported as Text Document', 'success');
    });
  }
}

/* ======================== NOTIFICATIONS ======================== */

async function renderNotifications() {
  const list = document.getElementById('secNotifList');
  if (!list) return;
  try {
    const notifs = await API.getNotifications({limit: 50}).then(d => d.notifications || d);
    SEC.notifications = (notifs || []).map(n => ({
      id: n.id,
      type: n.type || n.notif_type || 'system',
      title: n.title,
      text: n.text || n.message || '',
      read: n.read || false,
      timestamp: new Date(n.created_at).getTime()
    }));
  } catch (e) {
    console.error('Failed to load notifications:', e);
    SEC.notifications = [];
  }
  applyNotifFilters();

  document.querySelectorAll('[data-notif-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-notif-filter]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      SEC.notifFilter = btn.getAttribute('data-notif-filter');
      applyNotifFilters();
    });
  });

  document.getElementById('secNotifSearch')?.addEventListener('input', Utils.debounce(() => {
    SEC.notifSearchTerm = document.getElementById('secNotifSearch').value.toLowerCase();
    applyNotifFilters();
  }, 200));

  document.getElementById('secMarkAllRead')?.addEventListener('click', async () => {
    try {
      await API.markAllNotificationsRead();
    } catch (e) { /* ignore */ }
    (SEC.notifications || []).forEach(n => n.read = true);
    UI.showToast('All marked as read', 'success');
    applyNotifFilters();
  });

  document.getElementById('secClearAll')?.addEventListener('click', () => {
    if (!SEC.notifications || SEC.notifications.length === 0) { UI.showToast('No notifications to clear', 'info'); return; }
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:1000;backdrop-filter:blur(4px);';
    modal.innerHTML = `<div class="glass-card" style="padding:24px;max-width:360px;width:90%;text-align:center;border:1px solid var(--border-glass);">
      <div style="font-size:36px;margin-bottom:12px;">🗑️</div>
      <h3 style="font-size:16px;font-weight:600;margin-bottom:6px;">Clear All Notifications?</h3>
      <p style="font-size:13px;color:var(--text-muted);margin-bottom:16px;">Remove all notification entries?</p>
      <div style="display:flex;gap:8px;justify-content:center;">
        <button class="btn btn-sm btn-ghost" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
        <button class="btn btn-sm btn-danger" id="secConfirmClear">Clear All</button>
      </div>
    </div>`;
    document.body.appendChild(modal);
    document.getElementById('secConfirmClear').addEventListener('click', async () => {
      try {
        await API.clearAllNotifications();
      } catch (e) { /* ignore */ }
      SEC.notifications = [];
      UI.showToast('Cleared all notifications', 'success');
      applyNotifFilters();
      modal.remove();
    });
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
  });
}

function applyNotifFilters() {
  const list = document.getElementById('secNotifList');
  if (!list) return;
  let notifs = SEC.notifications || [];
  const filter = SEC.notifFilter;
  const search = SEC.notifSearchTerm;

  if (filter !== 'all') notifs = notifs.filter(n => n.type === filter);
  if (search) notifs = notifs.filter(n => (n.title||'').toLowerCase().includes(search) || (n.text||'').toLowerCase().includes(search));

  if (!notifs.length) {
    list.innerHTML = '<div class="empty-state"><div class="empty-state-icon">✅</div><div class="empty-state-text">All caught up! You have no notifications.</div></div>';
    return;
  }

  const icons = { safe:'🟢', warning:'🟡', danger:'🔴', system:'🔵' };
  list.innerHTML = notifs.map(n => {
    const timeAgo = Utils.formatRelativeTime(n.timestamp);
    return `<div class="glass-card sec-notif-item type-${n.type} ${n.read ? '' : 'unread'}">
      <div class="notif-icon">${icons[n.type]||'ℹ'}</div>
      <div class="notif-body">
        <div class="notif-title">${Utils.escapeHtml(n.title)}</div>
        <div class="notif-text">${Utils.escapeHtml(n.text||'')}</div>
        <div class="notif-time" style="margin-top:4px;">${timeAgo}</div>
      </div>
      <div class="notif-actions">
        <button title="Mark ${n.read ? 'unread' : 'read'}" onclick="toggleNotifRead('${n.id}')">${n.read ? '○' : '●'}</button>
        <button title="Delete" onclick="deleteNotif('${n.id}')">✕</button>
      </div>
    </div>`;
  }).join('');
}

function toggleNotifRead(id) {
  const n = (SEC.notifications || []).find(x => x.id === id);
  if (n) {
    n.read = !n.read;
    try { API.markNotificationRead(id); } catch (e) { /* ignore */ }
    applyNotifFilters();
  }
}

function deleteNotif(id) {
  SEC.notifications = (SEC.notifications || []).filter(x => x.id !== id);
  try { API.deleteNotification(id); } catch (e) { /* ignore */ }
  applyNotifFilters();
}
