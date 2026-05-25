/* SMEE Feira — app.js */

const DB_KEY = 'smee_feira_visitantes';
let DB = JSON.parse(localStorage.getItem(DB_KEY) || '[]');

function saveDB() { localStorage.setItem(DB_KEY, JSON.stringify(DB)); }

function escHtml(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

const TAB_TITLES = {
  reg: 'Cadastro de Visitante',
  dash: 'Dashboard — KPIs',
  list: 'Lista de Visitantes',
  lgpd: 'Conformidade LGPD',
  config: 'Configuração Firebase'
};

function go(tab) {
  document.querySelectorAll('.tab, .nav-item').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  const idx = ['reg','dash','list','lgpd','config'].indexOf(tab);
  document.querySelectorAll('.nav-item')[idx]?.classList.add('active');
  document.getElementById('sec-' + tab)?.classList.add('active');
  const titleEl = document.getElementById('page-title');
  if (titleEl) titleEl.textContent = TAB_TITLES[tab] || '';
  if (tab === 'dash') renderDash();
  if (tab === 'list') renderList();
  if (tab === 'lgpd') renderLgpd();
}

function showAlert(msg, type) {
  const el = document.getElementById('form-alert');
  if (!el) return;
  el.className = 'alert alert-' + (type || 'success');
  el.innerHTML = `<i class="ti ti-${type === 'error' ? 'alert-circle' : 'check'}" aria-hidden="true"></i> ${msg}`;
  el.style.display = 'flex';
  setTimeout(() => { el.style.display = 'none'; }, 3500);
}

function limparForm() {
  ['f-nome','f-email','f-tel','f-empresa','f-cargo','f-obs'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const estande = document.getElementById('f-estande');
  const temp    = document.getElementById('f-temp');
  const c1      = document.getElementById('c1');
  const c2      = document.getElementById('c2');
  if (estande) estande.value = '';
  if (temp)    temp.value    = 'warm';
  if (c1)      c1.checked    = false;
  if (c2)      c2.checked    = false;
}

function registrar() {
  const nome    = document.getElementById('f-nome')?.value.trim() || '';
  const email   = document.getElementById('f-email')?.value.trim() || '';
  const estande = document.getElementById('f-estande')?.value || '';
  const c1      = document.getElementById('c1')?.checked;
  const c2      = document.getElementById('c2')?.checked;

  if (!nome)       { showAlert('Preencha o nome completo.', 'error'); return; }
  if (!email)      { showAlert('Preencha o e-mail.', 'error'); return; }
  if (!estande)    { showAlert('Selecione o estande de interesse.', 'error'); return; }
  if (!c1 || !c2)  { showAlert('Os dois consentimentos LGPD são obrigatórios.', 'error'); return; }

  const now = new Date();
  const reg = {
    id:                Date.now().toString(),
    nome,
    email,
    tel:               document.getElementById('f-tel')?.value.trim() || '',
    empresa:           document.getElementById('f-empresa')?.value.trim() || '',
    cargo:             document.getElementById('f-cargo')?.value.trim() || '',
    estande,
    temp:              document.getElementById('f-temp')?.value || 'warm',
    obs:               document.getElementById('f-obs')?.value.trim() || '',
    consentimento1:    true,
    consentimento2:    true,
    dataConsentimento: now.toISOString(),
    hora:              now.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'}),
    data:              now.toLocaleDateString('pt-BR')
  };

  DB.push(reg);
  saveDB();
  showAlert('Visitante registrado com sucesso!');
  limparForm();
  updateFooterCount();
}

function renderList() {
  const tbody = document.getElementById('tbl-body');
  const empty = document.getElementById('list-empty');
  if (!tbody) return;

  const q  = (document.getElementById('search')?.value || '').toLowerCase();
  const ft = document.getElementById('flt-temp')?.value || '';

  const data = DB.filter(r => {
    if (ft && r.temp !== ft) return false;
    if (q && !r.nome.toLowerCase().includes(q) &&
        !(r.empresa||'').toLowerCase().includes(q) &&
        !r.email.toLowerCase().includes(q)) return false;
    return true;
  }).slice().reverse();

  if (!data.length) {
    tbody.innerHTML = '';
    if (empty) empty.style.display = 'block';
    return;
  }
  if (empty) empty.style.display = 'none';

  const tempLabel = {
    hot:  '<span class="badge badge-hot">Quente</span>',
    warm: '<span class="badge badge-warm">Morno</span>',
    cold: '<span class="badge badge-cold">Frio</span>'
  };

  tbody.innerHTML = data.map(r => `<tr>
    <td><strong>${escHtml(r.nome)}</strong></td>
    <td>${escHtml(r.empresa || '—')}</td>
    <td style="font-size:12px">${escHtml(r.email)}</td>
    <td style="font-size:12px">${escHtml(r.estande.split('—')[0].trim())}</td>
    <td>${tempLabel[r.temp] || ''}</td>
    <td style="font-size:12px">${escHtml(r.hora)} ${escHtml(r.data)}</td>
    <td><span class="badge badge-lgpd">✓ LGPD</span></td>
    <td><button class="btn btn-sm" onclick="excluir('${r.id}')" title="Excluir"><i class="ti ti-trash" aria-hidden="true"></i></button></td>
  </tr>`).join('');
}

function excluir(id) {
  if (!confirm('Excluir este registro? (direito ao apagamento — LGPD art. 18)')) return;
  DB = DB.filter(r => r.id !== id);
  saveDB();
  renderList();
  updateFooterCount();
}

function excluirTodos() {
  if (!confirm('Excluir TODOS os dados permanentemente? Esta ação não pode ser desfeita.')) return;
  DB = [];
  saveDB();
  renderList();
  renderDash();
  renderLgpd();
  updateFooterCount();
}

function renderDash() {
  const total = DB.length;
  const hoje  = DB.filter(r => r.data === new Date().toLocaleDateString('pt-BR')).length;
  const hot   = DB.filter(r => r.temp === 'hot').length;
  const taxa  = total > 0 ? Math.round(hot / total * 100) : 0;

  const grid = document.getElementById('kpi-grid');
  if (grid) {
    grid.innerHTML =
      kpiCard('Total visitantes', total,      'blue',  'ti-users')
    + kpiCard('Registros hoje',   hoje,       'green', 'ti-calendar')
    + kpiCard('Leads quentes',    hot,        'red',   'ti-flame')
    + kpiCard('Taxa conversão',   taxa + '%', 'amber', 'ti-trending-up')
    + kpiCard('100% LGPD',        total,      'green', 'ti-shield-check');
  }

  const tc = { hot: 0, warm: 0, cold: 0 };
  DB.forEach(r => { tc[r.temp] = (tc[r.temp] || 0) + 1; });
  const maxT = Math.max(tc.hot, tc.warm, tc.cold, 1);
  const chartTemp = document.getElementById('chart-temp');
  if (chartTemp) {
    chartTemp.innerHTML =
      barRow('Quente', tc.hot,  maxT, '#A32D2D')
    + barRow('Morno',  tc.warm, maxT, '#854F0B')
    + barRow('Frio',   tc.cold, maxT, '#185FA5');
  }

  const ec = {};
  DB.forEach(r => {
    const k = r.estande.split('—')[0].trim();
    ec[k] = (ec[k] || 0) + 1;
  });
  const maxE = Math.max(...Object.values(ec), 1);
  const chartEst = document.getElementById('chart-estande');
  if (chartEst) {
    chartEst.innerHTML = Object.entries(ec)
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => barRow(k, v, maxE, '#185FA5'))
      .join('') || '<div style="font-size:13px;color:var(--muted);padding:8px">Sem dados ainda.</div>';
  }

  const hc = {};
  DB.forEach(r => {
    const h = r.hora ? r.hora.split(':')[0] + 'h' : '?';
    hc[h] = (hc[h] || 0) + 1;
  });
  const maxH = Math.max(...Object.values(hc), 1);
  const chartHora = document.getElementById('chart-hora');
  if (chartHora) {
    chartHora.innerHTML = Object.entries(hc)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([k, v]) => barRow(k, v, maxH, '#3B6D11'))
      .join('') || '<div style="font-size:13px;color:var(--muted);padding:8px">Sem dados ainda.</div>';
  }
}

function kpiCard(label, val, color, icon) {
  return `<div class="metric">
    <i class="ti ${icon}" aria-hidden="true" style="font-size:20px;color:var(--metric-${color})"></i>
    <div class="lbl">${label}</div>
    <div class="val ${color}">${val}</div>
  </div>`;
}

function barRow(label, val, max, color) {
  return `<div class="chart-bar-row">
    <div class="chart-bar-label">${escHtml(label)}</div>
    <div class="chart-bar-bg"><div class="chart-bar-fill" style="width:${Math.round(val/max*100)}%;background:${color}"></div></div>
    <div class="chart-bar-val">${val}</div>
  </div>`;
}

function renderLgpd() {
  const total = DB.length;
  const el = document.getElementById('lgpd-stats');
  if (el) {
    el.innerHTML =
      kpiCard('Total registros',   total,             'blue',  'ti-database')
    + kpiCard('Com consentimento', total,             'green', 'ti-checkbox')
    + kpiCard('Conformidade',      total > 0 ? '100%' : '—', 'green', 'ti-shield-check');
  }
}

function exportCSV() {
  if (!DB.length) { alert('Nenhum dado para exportar.'); return; }
  const header = ['Nome','E-mail','Telefone','Empresa','Cargo','Estande','Lead',
                  'Data','Hora','Consentimento1','Consentimento2','DataConsentimento','Observações'];
  const rows = DB.map(r => [
    r.nome, r.email, r.tel||'', r.empresa||'', r.cargo||'',
    r.estande, r.temp, r.data, r.hora,
    'Sim', 'Sim', r.dataConsentimento,
    (r.obs||'').replace(/;/g,' ')
  ].join(';'));
  const blob = new Blob(['\ufeff' + [header.join(';'), ...rows].join('\r\n')],
                        {type: 'text/csv;charset=utf-8'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `visitantes_feira_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function salvarConfig() {
  const cfg = {
    apiKey:     document.getElementById('cfg-apiKey')?.value.trim() || '',
    authDomain: document.getElementById('cfg-authDomain')?.value.trim() || '',
    projectId:  document.getElementById('cfg-projectId')?.value.trim() || '',
    appId:      document.getElementById('cfg-appId')?.value.trim() || ''
  };
  const status = document.getElementById('fb-status');
  if (!cfg.apiKey || !cfg.projectId) {
    if (status) status.innerHTML = '<span style="color:#A32D2D">Preencha ao menos API Key e Project ID.</span>';
    return;
  }
  localStorage.setItem('smee_fb_cfg', JSON.stringify(cfg));
  if (status) status.innerHTML = '<span style="color:#3B6D11">✓ Configuração salva.</span>';
  const badge = document.getElementById('mode-badge');
  if (badge) { badge.textContent = 'Firebase ativo'; badge.style.cssText = 'background:#EAF3DE;color:#3B6D11'; }
}

function updateFooterCount() {
  const el = document.getElementById('footer-count');
  if (el) el.textContent = DB.length;
}

function initApp() {
  const saved = localStorage.getItem('smee_fb_cfg');
  if (saved) {
    try {
      const c = JSON.parse(saved);
      ['apiKey','authDomain','projectId','appId'].forEach(k => {
        const el = document.getElementById('cfg-' + k);
        if (el && c[k]) el.value = c[k];
      });
      const badge = document.getElementById('mode-badge');
      if (badge) { badge.textContent = 'Firebase configurado'; badge.style.cssText = 'background:#EAF3DE;color:#3B6D11'; }
    } catch (_e) { /* config inválida */ }
  }

  const search = document.getElementById('search');
  if (search) search.addEventListener('input', renderList);

  document.getElementById('menu-btn')?.addEventListener('click', () => {
    document.getElementById('sidebar')?.classList.toggle('open');
  });
  document.getElementById('sidebar-close')?.addEventListener('click', () => {
    document.getElementById('sidebar')?.classList.remove('open');
  });

  const lastUpdate = document.getElementById('last-update');
  if (lastUpdate) lastUpdate.textContent = new Date().toLocaleDateString('pt-BR');

  updateFooterCount();
}
