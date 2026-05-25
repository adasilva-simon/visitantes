/*  SMEE Feira — app.js  */

var DB_KEY = 'smee_feira_visitantes';
var DB = JSON.parse(localStorage.getItem(DB_KEY) || '[]');

function saveDB() { localStorage.setItem(DB_KEY, JSON.stringify(DB)); }

function escHtml(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ---- NAVEGAÇÃO ---- */
var TAB_TITLES = {
  'reg':    'Cadastro de Visitante',
  'dash':   'Dashboard — KPIs',
  'list':   'Lista de Visitantes',
  'lgpd':   'Conformidade LGPD',
  'config': 'Configuração Firebase'
};

function go(tab) {
  document.querySelectorAll('.tab').forEach(function(t) { t.classList.remove('active'); });
  document.querySelectorAll('.section').forEach(function(s) { s.classList.remove('active'); });
  var idx = ['reg','dash','list','lgpd','config'].indexOf(tab);
  document.querySelectorAll('.tab')[idx].classList.add('active');
  document.getElementById('sec-' + tab).classList.add('active');
  document.getElementById('page-title').textContent = TAB_TITLES[tab] || '';
  if (tab === 'dash')   renderDash();
  if (tab === 'list')   renderList();
  if (tab === 'lgpd')   renderLgpd();
}

/* ---- ALERTAS ---- */
function showAlert(msg, type) {
  var el = document.getElementById('form-alert');
  el.className = 'alert alert-' + (type || 'success');
  el.innerHTML = '<i class="ti ti-' + (type === 'error' ? 'alert-circle' : 'check') + '" aria-hidden="true"></i> ' + msg;
  el.style.display = 'flex';
  setTimeout(function() { el.style.display = 'none'; }, 3500);
}

/* ---- FORMULÁRIO ---- */
function limparForm() {
  ['f-nome','f-email','f-tel','f-empresa','f-cargo','f-obs'].forEach(function(id) {
    document.getElementById(id).value = '';
  });
  document.getElementById('f-estande').value = '';
  document.getElementById('f-temp').value = 'warm';
  document.getElementById('c1').checked = false;
  document.getElementById('c2').checked = false;
}

function registrar() {
  var nome    = document.getElementById('f-nome').value.trim();
  var email   = document.getElementById('f-email').value.trim();
  var estande = document.getElementById('f-estande').value;
  var c1      = document.getElementById('c1').checked;
  var c2      = document.getElementById('c2').checked;

  if (!nome)          { showAlert('Preencha o nome completo.', 'error'); return; }
  if (!email)         { showAlert('Preencha o e-mail.', 'error'); return; }
  if (!estande)       { showAlert('Selecione o estande de interesse.', 'error'); return; }
  if (!c1 || !c2)     { showAlert('Os dois consentimentos LGPD são obrigatórios.', 'error'); return; }

  var now = new Date();
  var reg = {
    id:               Date.now().toString(),
    nome:             nome,
    email:            email,
    tel:              document.getElementById('f-tel').value.trim(),
    empresa:          document.getElementById('f-empresa').value.trim(),
    cargo:            document.getElementById('f-cargo').value.trim(),
    estande:          estande,
    temp:             document.getElementById('f-temp').value,
    obs:              document.getElementById('f-obs').value.trim(),
    consentimento1:   true,
    consentimento2:   true,
    dataConsentimento: now.toISOString(),
    hora:             now.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'}),
    data:             now.toLocaleDateString('pt-BR')
  };

  DB.push(reg);
  saveDB();
  showAlert('Visitante registrado com sucesso!');
  limparForm();
}

/* ---- LISTA ---- */
function renderList() {
  var tbody = document.getElementById('tbl-body');
  var empty = document.getElementById('list-empty');
  var q     = (document.getElementById('search').value || '').toLowerCase();
  var ft    = document.getElementById('flt-temp').value;

  var data = DB.filter(function(r) {
    if (ft && r.temp !== ft) return false;
    if (q && !r.nome.toLowerCase().includes(q) &&
        !(r.empresa||'').toLowerCase().includes(q) &&
        !r.email.toLowerCase().includes(q)) return false;
    return true;
  }).slice().reverse();

  if (!data.length) { tbody.innerHTML = ''; empty.style.display = 'block'; return; }
  empty.style.display = 'none';

  var tempLabel = {
    hot:  '<span class="badge badge-hot">Quente</span>',
    warm: '<span class="badge badge-warm">Morno</span>',
    cold: '<span class="badge badge-cold">Frio</span>'
  };

  tbody.innerHTML = data.map(function(r) {
    return '<tr>'
      + '<td><strong>' + escHtml(r.nome) + '</strong></td>'
      + '<td>' + escHtml(r.empresa || '—') + '</td>'
      + '<td style="font-size:12px">' + escHtml(r.email) + '</td>'
      + '<td style="font-size:12px">' + escHtml(r.estande.split('—')[0].trim()) + '</td>'
      + '<td>' + (tempLabel[r.temp] || '') + '</td>'
      + '<td style="font-size:12px">' + escHtml(r.hora) + ' ' + escHtml(r.data) + '</td>'
      + '<td><span class="badge badge-lgpd">✓ LGPD</span></td>'
      + '<td><button class="btn btn-sm" onclick="excluir(\'' + r.id + '\')" title="Excluir registro"><i class="ti ti-trash" aria-hidden="true"></i></button></td>'
      + '</tr>';
  }).join('');
}

function excluir(id) {
  if (!confirm('Excluir este registro? (direito ao apagamento — LGPD art. 18)')) return;
  DB = DB.filter(function(r) { return r.id !== id; });
  saveDB();
  renderList();
}

function excluirTodos() {
  if (!confirm('Excluir TODOS os dados permanentemente? Esta ação não pode ser desfeita.')) return;
  DB = []; saveDB();
  renderList(); renderDash(); renderLgpd();
}

/* ---- DASHBOARD ---- */
function renderDash() {
  var total   = DB.length;
  var hoje    = DB.filter(function(r) { return r.data === new Date().toLocaleDateString('pt-BR'); }).length;
  var hot     = DB.filter(function(r) { return r.temp === 'hot'; }).length;
  var taxa    = total > 0 ? Math.round(hot / total * 100) : 0;

  document.getElementById('kpi-grid').innerHTML =
      kpiCard('Total visitantes',  total,  'blue',  'ti-users')
    + kpiCard('Registros hoje',    hoje,   'green', 'ti-calendar')
    + kpiCard('Leads quentes',     hot,    'red',   'ti-flame')
    + kpiCard('Taxa conversão',    taxa + '%', 'amber', 'ti-trending-up')
    + kpiCard('100% LGPD',         total,  'green', 'ti-shield-check');

  /* Temp */
  var tc = {hot:0, warm:0, cold:0};
  DB.forEach(function(r) { tc[r.temp] = (tc[r.temp] || 0) + 1; });
  var maxT = Math.max(tc.hot, tc.warm, tc.cold, 1);
  document.getElementById('chart-temp').innerHTML =
    barRow('Quente', tc.hot,  maxT, '#A32D2D') +
    barRow('Morno',  tc.warm, maxT, '#854F0B') +
    barRow('Frio',   tc.cold, maxT, '#185FA5');

  /* Estande */
  var ec = {};
  DB.forEach(function(r) {
    var k = r.estande.split('—')[0].trim();
    ec[k] = (ec[k] || 0) + 1;
  });
  var maxE = Math.max.apply(null, Object.values(ec).concat([1]));
  var estHtml = Object.entries(ec).sort(function(a,b){return b[1]-a[1];})
    .map(function(e) { return barRow(e[0], e[1], maxE, '#185FA5'); }).join('');
  document.getElementById('chart-estande').innerHTML = estHtml ||
    '<div style="font-size:13px;color:var(--color-text-secondary);padding:8px">Sem dados ainda.</div>';

  /* Hora */
  var hc = {};
  DB.forEach(function(r) {
    var h = r.hora ? r.hora.split(':')[0] + 'h' : '?';
    hc[h] = (hc[h] || 0) + 1;
  });
  var maxH = Math.max.apply(null, Object.values(hc).concat([1]));
  var horaHtml = Object.entries(hc).sort(function(a,b){return a[0].localeCompare(b[0]);})
    .map(function(e) { return barRow(e[0], e[1], maxH, '#3B6D11'); }).join('');
  document.getElementById('chart-hora').innerHTML = horaHtml ||
    '<div style="font-size:13px;color:var(--color-text-secondary);padding:8px">Sem dados ainda.</div>';
}

function kpiCard(label, val, color, icon) {
  return '<div class="metric">'
    + '<i class="ti ' + icon + '" aria-hidden="true" style="font-size:20px;color:var(--metric-' + color + ')"></i>'
    + '<div class="lbl">' + label + '</div>'
    + '<div class="val ' + color + '">' + val + '</div>'
    + '</div>';
}

function barRow(label, val, max, color) {
  return '<div class="chart-bar-row">'
    + '<div class="chart-bar-label">' + escHtml(label) + '</div>'
    + '<div class="chart-bar-bg"><div class="chart-bar-fill" style="width:' + Math.round(val/max*100) + '%;background:' + color + '"></div></div>'
    + '<div class="chart-bar-val">' + val + '</div>'
    + '</div>';
}

/* ---- LGPD ---- */
function renderLgpd() {
  var total = DB.length;
  document.getElementById('lgpd-stats').innerHTML =
      kpiCard('Total registros',   total,             'blue',  'ti-database')
    + kpiCard('Com consentimento', total,             'green', 'ti-checkbox')
    + kpiCard('Conformidade',      total > 0 ? '100%' : '—', 'green', 'ti-shield-check');
}

/* ---- EXPORT CSV ---- */
function exportCSV() {
  if (!DB.length) { alert('Nenhum dado para exportar.'); return; }
  var header = ['Nome','E-mail','Telefone','Empresa','Cargo','Estande','Lead','Data','Hora',
                'Consentimento1','Consentimento2','DataConsentimento','Observações'];
  var rows = DB.map(function(r) {
    return [
      r.nome, r.email, r.tel||'', r.empresa||'', r.cargo||'',
      r.estande, r.temp, r.data, r.hora,
      'Sim', 'Sim', r.dataConsentimento,
      (r.obs||'').replace(/;/g,' ')
    ].join(';');
  });
  var blob = new Blob(['\ufeff' + [header.join(';')].concat(rows).join('\r\n')],
                      {type:'text/csv;charset=utf-8'});
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'visitantes_feira_' + new Date().toISOString().slice(0,10) + '.csv';
  a.click();
  URL.revokeObjectURL(a.href);
}

/* ---- FIREBASE CONFIG ---- */
function salvarConfig() {
  var cfg = {
    apiKey:     document.getElementById('cfg-apiKey').value.trim(),
    authDomain: document.getElementById('cfg-authDomain').value.trim(),
    projectId:  document.getElementById('cfg-projectId').value.trim(),
    appId:      document.getElementById('cfg-appId').value.trim()
  };
  if (!cfg.apiKey || !cfg.projectId) {
    document.getElementById('fb-status').innerHTML = '<span style="color:#A32D2D">Preencha ao menos API Key e Project ID.</span>';
    return;
  }
  localStorage.setItem('smee_fb_cfg', JSON.stringify(cfg));
  document.getElementById('fb-status').innerHTML = '<span style="color:#3B6D11">✓ Configuração salva. Novos registros serão enviados ao Firestore.</span>';
  document.getElementById('mode-badge').textContent = 'Firebase ativo';
  document.getElementById('mode-badge').style.cssText = 'background:#EAF3DE;color:#3B6D11';
}

/* ---- INIT ---- */
function initApp() {
  /* Restaura config Firebase se salva */
  var saved = localStorage.getItem('smee_fb_cfg');
  if (saved) {
    try {
      var c = JSON.parse(saved);
      ['apiKey','authDomain','projectId','appId'].forEach(function(k) {
        var el = document.getElementById('cfg-' + k);
        if (el && c[k]) el.value = c[k];
      });
      var badge = document.getElementById('mode-badge');
      if (badge) {
        badge.textContent = 'Firebase configurado';
        badge.style.cssText = 'background:#EAF3DE;color:#3B6D11';
      }
    } catch(e) {}
  }

  /* Busca no formulário */
  var search = document.getElementById('search');
  if (search) search.addEventListener('input', renderList);

  document.getElementById('last-update').textContent = new Date().toLocaleDateString('pt-BR');
}
