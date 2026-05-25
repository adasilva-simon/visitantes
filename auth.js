/*  SMEE Feira — auth.js  */
const AUTH = {
  SESSION_KEY:  'feira_auth',
  LABEL_KEY:    'feira_label',
  ATTEMPTS_KEY: 'feira_attempts',
  LOCKOUT_KEY:  'feira_lockout',
  MAX_ATTEMPTS: 5,
  LOCKOUT_MS:   15 * 60 * 1000,

  isAuthenticated: function() {
    return sessionStorage.getItem(this.SESSION_KEY) === 'ok';
  },
  validate: function(input) {
    const keys = window.ACCESS_KEYS || [];
    const clean = input.trim().toUpperCase().replace(/\s/g,'');
    const now = new Date();
    return keys.find(function(k) {
      if (k.key.trim().toUpperCase().replace(/\s/g,'') !== clean) return false;
      if (k.expires && new Date(k.expires + 'T23:59:59') < now) return false;
      return true;
    }) || null;
  },
  isLockedOut: function() {
    let until = localStorage.getItem(this.LOCKOUT_KEY);
    if (!until) return false;
    if (Date.now() < parseInt(until)) return true;
    localStorage.removeItem(this.LOCKOUT_KEY);
    localStorage.removeItem(this.ATTEMPTS_KEY);
    return false;
  },
  lockoutRemaining: function() {
    return Math.max(0, Math.ceil((parseInt(localStorage.getItem(this.LOCKOUT_KEY)||0) - Date.now()) / 60000));
  },
  registerAttempt: function() {
    let n = parseInt(localStorage.getItem(this.ATTEMPTS_KEY)||0) + 1;
    localStorage.setItem(this.ATTEMPTS_KEY, n);
    if (n >= this.MAX_ATTEMPTS) {
      localStorage.setItem(this.LOCKOUT_KEY, Date.now() + this.LOCKOUT_MS);
      localStorage.removeItem(this.ATTEMPTS_KEY);
    }
    return Math.max(0, this.MAX_ATTEMPTS - n);
  },
  login: function(label) {
    sessionStorage.setItem(this.SESSION_KEY, 'ok');
    sessionStorage.setItem(this.LABEL_KEY, label || 'Usuário');
    localStorage.removeItem(this.ATTEMPTS_KEY);
    localStorage.removeItem(this.LOCKOUT_KEY);
  },
  logout: function() {
    sessionStorage.removeItem(this.SESSION_KEY);
    sessionStorage.removeItem(this.LABEL_KEY);
    location.reload();
  },
  getLabel: function() {
    return sessionStorage.getItem(this.LABEL_KEY) || 'Usuário';
  }
};

function buildLoginScreen() {
  const overlay = document.createElement('div');
  overlay.id = 'auth-overlay';
  overlay.innerHTML = '<div class="auth-card" id="auth-card">'
    + '<div class="auth-logo"><svg width="44" height="44" viewBox="0 0 44 44" fill="none"><rect width="44" height="44" rx="12" fill="#185FA5"/><path d="M10 32L18 16l6 10 5-7 7 13" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div>'
    + '<h1 class="auth-title">SMEE Feira</h1>'
    + '<p class="auth-sub">Cadastro de Visitantes</p>'
    + '<p class="auth-desc">Digite sua chave de acesso para continuar.</p>'
    + '<div class="auth-input-wrap" id="auth-input-wrap">'
    + '<input type="text" id="key-input" class="auth-input" placeholder="XXXX-XXXX-XXXX-XXXX" maxlength="24" autocomplete="off" spellcheck="false">'
    + '<button class="auth-btn" id="auth-btn" onclick="submitKey()">Entrar <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></button>'
    + '</div>'
    + '<div class="auth-msg" id="auth-msg"></div>'
    + '<div class="auth-lockout" id="auth-lockout" style="display:none">Acesso bloqueado por <span id="lockout-time">15</span> min após muitas tentativas incorretas.</div>'
    + '<p class="auth-footer">Para obter sua chave, entre em contato com a coordenação do evento.</p>'
    + '</div>';
  document.body.appendChild(overlay);
  injectAuthStyles();
  checkLockoutUI();
  const inp = document.getElementById('key-input');
  if (inp) {
    inp.focus();
    inp.addEventListener('keydown', function(e) { if (e.key === 'Enter') submitKey(); });
    inp.addEventListener('input', function() { formatKey(inp); });
  }
}

function formatKey(input) {
  const v = input.value.toUpperCase().replace(/[^A-Z0-9]/g,'');
  const out = '';
  for (var i = 0; i < v.length && i < 20; i++) {
    if (i > 0 && i % 4 === 0) out += '-';
    out += v[i];
  }
  input.value = out;
}

function submitKey() {
  if (AUTH.isLockedOut()) { checkLockoutUI(); return; }
  const input = document.getElementById('key-input');
  const btn   = document.getElementById('auth-btn');
  const msg   = document.getElementById('auth-msg');
  const key   = (input.value || '').trim();
  if (!key) { showMsg('Digite sua chave de acesso.', 'warn'); return; }

  btn.disabled = true;
  btn.innerHTML = '<span class="auth-spinner"></span> Verificando...';

  setTimeout(function() {
    const found = AUTH.validate(key);
    if (found) {
      btn.innerHTML = '✓ Acesso liberado';
      btn.style.background = '#3B6D11';
      showMsg('Bem-vindo(a), ' + found.label + '!', 'ok');
      AUTH.login(found.label);
      setTimeout(function() {
        document.getElementById('auth-overlay').remove();
        initApp();
        addUserPill();
      }, 700);
    } else {
      const rem = AUTH.registerAttempt();
      btn.disabled = false;
      btn.innerHTML = 'Entrar <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>';
      if (AUTH.isLockedOut()) {
        checkLockoutUI();
      } else {
        showMsg('Chave inválida ou expirada.' + (rem > 0 ? ' (' + rem + ' tentativa' + (rem > 1 ? 's' : '') + ' restante' + (rem > 1 ? 's' : '') + ')' : ''), 'err');
        input.value = '';
        input.focus();
        const card = document.getElementById('auth-card');
        card.classList.add('shake');
        setTimeout(function() { card.classList.remove('shake'); }, 500);
      }
    }
  }, 500);
}

function showMsg(text, type) {
  const el = document.getElementById('auth-msg');
  if (!el) return;
  el.textContent = text;
  el.className = 'auth-msg auth-msg-' + type;
}

function checkLockoutUI() {
  if (AUTH.isLockedOut()) {
    const wrap = document.getElementById('auth-input-wrap');
    const lock = document.getElementById('auth-lockout');
    if (wrap) wrap.style.display = 'none';
    if (lock) { lock.style.display = 'block'; document.getElementById('lockout-time').textContent = AUTH.lockoutRemaining(); }
    const iv = setInterval(function() {
      if (!AUTH.isLockedOut()) {
        clearInterval(iv);
        if (wrap) wrap.style.display = 'flex';
        if (lock) lock.style.display = 'none';
        const inp = document.getElementById('key-input');
        if (inp) inp.focus();
      } else {
        document.getElementById('lockout-time').textContent = AUTH.lockoutRemaining();
      }
    }, 10000);
  }
}

function addUserPill() {
  const label = AUTH.getLabel();
  const bar   = document.getElementById('topbar-actions');
  if (!bar) return;
  const pill = document.createElement('div');
  pill.className = 'user-pill';
  pill.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>'
    + '<span>' + escHtml(label) + '</span>'
    + '<button onclick="AUTH.logout()" title="Sair" class="logout-btn"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg></button>';
  bar.prepend(pill);
}

function injectAuthStyles() {
  const s = document.createElement('style');
  s.textContent = '#auth-overlay{position:fixed;inset:0;z-index:9999;background:linear-gradient(135deg,#0a1628 0%,#0c447c 50%,#0a1628 100%);display:flex;align-items:center;justify-content:center;padding:20px}'
    + '.auth-card{background:#fff;border-radius:16px;padding:40px 36px;width:100%;max-width:420px;text-align:center;box-shadow:0 25px 60px rgba(0,0,0,.4);animation:authIn .4s ease}'
    + '@keyframes authIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}'
    + '.auth-card.shake{animation:authShake .4s ease}'
    + '@keyframes authShake{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-5px)}80%{transform:translateX(5px)}}'
    + '.auth-logo{margin-bottom:14px}'
    + '.auth-title{font-size:22px;font-weight:700;color:#0a1628;margin-bottom:4px}'
    + '.auth-sub{font-size:13px;color:#185FA5;font-weight:600;margin-bottom:18px;text-transform:uppercase;letter-spacing:.04em}'
    + '.auth-desc{font-size:14px;color:#64748b;margin-bottom:22px;line-height:1.5}'
    + '.auth-input-wrap{display:flex;flex-direction:column;gap:10px;margin-bottom:12px}'
    + '.auth-input{width:100%;height:48px;border:1.5px solid #e2e8f0;border-radius:10px;font-size:17px;font-weight:600;text-align:center;letter-spacing:.1em;font-family:monospace;color:#0a1628;outline:none;background:#f8fafc;transition:border-color .2s}'
    + '.auth-input:focus{border-color:#185FA5;background:#fff;box-shadow:0 0 0 3px #E6F1FB}'
    + '.auth-input::placeholder{font-size:15px;font-weight:400;color:#cbd5e1;letter-spacing:.06em}'
    + '.auth-btn{width:100%;height:48px;border:none;border-radius:10px;background:#185FA5;color:white;font-size:15px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;transition:background .15s}'
    + '.auth-btn:hover{background:#0C447C}.auth-btn:disabled{opacity:.7;cursor:not-allowed}'
    + '.auth-spinner{width:16px;height:16px;border:2px solid rgba(255,255,255,.3);border-top-color:white;border-radius:50%;animation:spin .7s linear infinite;display:inline-block}'
    + '@keyframes spin{to{transform:rotate(360deg)}}'
    + '.auth-msg{font-size:13px;min-height:20px;margin-bottom:6px;font-weight:500}'
    + '.auth-msg-err{color:#A32D2D}.auth-msg-warn{color:#854F0B}.auth-msg-ok{color:#3B6D11}'
    + '.auth-lockout{font-size:13px;color:#A32D2D;background:#FCEBEB;border:1px solid #F7C1C1;border-radius:8px;padding:10px 14px;margin-bottom:12px}'
    + '.auth-footer{font-size:12px;color:#94a3b8;margin-top:18px;line-height:1.5}'
    + '.user-pill{display:flex;align-items:center;gap:6px;font-size:13px;font-weight:500;color:#475569;background:#f1f5f9;border:1px solid #e2e8f0;border-radius:20px;padding:4px 10px 4px 8px}'
    + '.logout-btn{background:none;border:none;cursor:pointer;color:#94a3b8;padding:2px;border-radius:50%;display:flex;align-items:center;transition:color .15s}'
    + '.logout-btn:hover{color:#A32D2D}';
  document.head.appendChild(s);
}

function initAuth() {
  if (AUTH.isAuthenticated()) {
    initApp();
    addUserPill();
  } else {
    buildLoginScreen();
  }
}
