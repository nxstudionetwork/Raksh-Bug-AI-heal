function dismissAppLoader() {
  const loader = document.getElementById('appLoader');
  if (loader) {
    loader.classList.add('fade-out');
    setTimeout(() => { if (loader.parentNode) loader.remove(); }, 500);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  UI.init();
  loadCommonComponents();
  initGlobalSearch();
  const main = document.querySelector('.main-content');
  if (main) {
    main.classList.add('page-enter-active');
  }
  setTimeout(dismissAppLoader, 1500);
});

document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    const search = document.querySelector('.topbar-search input');
    if (search) search.focus();
  }
});

window.addEventListener('load', () => {
  setTimeout(dismissAppLoader, 500);
});

function loadCommonComponents() {
  const sidebar = document.querySelector('.sidebar');
  if (sidebar && !document.querySelector('.sidebar-brand')) {
    const sidebarOverlay = document.createElement('div');
    sidebarOverlay.className = 'sidebar-overlay';
    document.body.appendChild(sidebarOverlay);
  }

  const toastContainer = document.getElementById('toastContainer');
  if (!toastContainer) {
    const container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    container.setAttribute('role', 'alert');
    container.setAttribute('aria-live', 'polite');
    document.body.appendChild(container);
  }
}

function navigateTo(page) {
  const settingsPanel = document.getElementById('settingsPanel');
  const settingsOverlay = document.getElementById('settingsPanelOverlay');
  if (settingsPanel) settingsPanel.classList.remove('open');
  if (settingsOverlay) settingsOverlay.classList.remove('open');
  document.body.style.overflow = '';
  const main = document.querySelector('.main-content');
  if (main) {
    main.classList.add('page-enter');
    main.style.opacity = '0';
    main.style.transform = 'translateY(8px)';
    setTimeout(() => { window.location.href = page; }, 200);
  } else {
    window.location.href = page;
  }
}

function handleAuthSubmit(formId, redirectPage) {
  const form = document.getElementById(formId);
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span class="loading-spinner" style="width:18px;height:18px;border-width:2px;"></span> Processing...';
    }

    try {
      const formData = new FormData(form);
      const isLogin = formId === 'loginForm';
      const email = formData.get('email') || document.getElementById('loginEmail')?.value || document.getElementById('signupEmail')?.value;
      const password = formData.get('password') || document.getElementById('loginPassword')?.value || document.getElementById('signupPassword')?.value;

      if (isLogin) {
        await API.login(email, password);
      } else {
        const name = formData.get('name') || document.getElementById('signupName')?.value;
        await API.register(name, email, password);
      }
      UI.showToast('Success! Redirecting...', 'success');
      setTimeout(() => { window.location.href = redirectPage; }, 500);
    } catch (err) {
      UI.showToast(err.message || 'Authentication failed', 'danger');
      if (btn) {
        btn.disabled = false;
        btn.textContent = formId === 'loginForm' ? 'Sign In' : 'Create Account';
      }
    }
  });
}

function initPasswordStrength(inputId, barId) {
  const input = document.getElementById(inputId);
  const bar = document.getElementById(barId);
  if (!input || !bar) return;

  input.addEventListener('input', () => {
    const val = input.value;
    let strength = 0;
    if (val.length > 6) strength++;
    if (val.length > 10) strength++;
    if (/[A-Z]/.test(val)) strength++;
    if (/[0-9]/.test(val)) strength++;
    if (/[^A-Za-z0-9]/.test(val)) strength++;
    if (val.length > 14) strength++;

    const labels = ['', 'weak', 'medium', 'strong', 'very-strong', 'very-strong'];
    const classes = ['', 'weak', 'medium', 'strong', 'very-strong', 'very-strong'];
    const idx = Math.min(strength, 5);

    bar.className = 'strength-bar';
    if (idx > 0) bar.classList.add(classes[idx]);
  });
}

function initSidebarNav() {
  const nav = document.querySelector('.sidebar-nav');
  if (nav) nav.setAttribute('role', 'menubar');
  document.querySelectorAll('.nav-item').forEach(item => {
    item.setAttribute('role', 'menuitem');
    if (item.classList.contains('active')) item.setAttribute('aria-current', 'page');
    item.addEventListener('click', function() {
      const href = this.getAttribute('data-href');
      if (href && !this.classList.contains('active')) {
        window.location.href = href;
      }
    });
  });
}

function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

function initGlobalSearch() {
  document.querySelectorAll('.topbar-search input').forEach(input => {
    input.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        input.focus();
        return;
      }
      if (e.key === 'Enter' && input.value.trim()) {
        const q = input.value.trim().toLowerCase();
        const commands = {
          'scan': 'scan.html', 'scanner': 'scan.html', 'message': 'scan.html', 'link': 'scan.html',
          'protection': 'protection.html', 'threat': 'protection.html', 'report': 'protection.html',
          'security': 'security-center.html', 'center': 'security-center.html', 'community': 'security-center.html',
          'ai': 'ai-assistant.html', 'assistant': 'ai-assistant.html', 'chat': 'ai-assistant.html',
          'dashboard': 'dashboard.html', 'home': 'dashboard.html',
          'profile': 'profile.html', 'account': 'profile.html',
          'settings': 'settings.html', 'notifications': 'notifications.html', 'alert': 'notifications.html',
          'help': 'help.html', 'about': 'about.html'
        };
        const page = commands[q] || commands[q.split(' ')[0]];
        if (page) navigateTo(page);
        else UI.showToast('No results for "' + input.value + '"', 'info');
        input.value = '';
      }
    });
  });
}
