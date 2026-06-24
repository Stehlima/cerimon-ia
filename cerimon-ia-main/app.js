// === STATE MANAGEMENT ===
let appState;
try {
  appState = JSON.parse(localStorage.getItem('cerimonIA_state'));
} catch (e) {
  appState = null;
}
if (!appState) {
  appState = {
    brideName: '',
    groomName: '',
    weddingDate: '2025-11-15',
    weddingCity: '',
    totalBudget: 0,
    spentBudget: 0,
    suppliers: [
      { name: 'Sabor & Arte', cat: 'Buffet', city: 'Carapicuíba', avail: true, price: 'R$ 28.500', includes: 'Completo + open bar', home: true },
      { name: 'Studio Lumière', cat: 'Fotografia', city: 'Carapicuíba', avail: true, price: 'R$ 7.800', includes: '12h + álbum 30p', home: true }
    ],
    missions: {
      'Buffet': { status: 'Procurando fornecedor', messages: [] },
      'Decoração': { status: 'Procurando fornecedor', messages: [] },
      'Fotografia': { status: 'Procurando fornecedor', messages: [] }
    },
    guests: [],
    moodboard: [],
    timeline: [],
    budgetItems: [], // Começa vazio
    giftLink: ''
  };
}

// === SUPABASE CONFIG ===
const SUPABASE_URL = 'https://nnncitsncfaakdpuvfvx.supabase.co'; 
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ubmNpdHNuY2ZhYWtkcHV2ZnZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzNzY0NDcsImV4cCI6MjA2MTk1MjQ0N30.Z_0pZ7_v_ZqZNDQ2Nn0.xqC4TWJt_2MEs4umrfd398tLk895m0pR97mOv25ja34'; 
let supabase = null;

if (SUPABASE_URL && SUPABASE_KEY && window.supabase) {
  supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}

function saveState() {
  localStorage.setItem('cerimonIA_state', JSON.stringify(appState));
  
  // Sync with user store
  const currentUser = localStorage.getItem('cerimonIA_currentUser');
  if (currentUser) {
    const users = JSON.parse(localStorage.getItem('cerimonIA_users') || '{}');
    if (users[currentUser]) {
      users[currentUser].state = appState;
      localStorage.setItem('cerimonIA_users', JSON.stringify(users));
    }
  }
  updateUI();
}

// Auth Helpers and Navigation (Already handled in index.html as fallback, but kept here for app logic)

async function login() {
  const email = document.getElementById('loginEmail').value;
  const pass = document.getElementById('loginPass').value;

  if (!email || !pass) {
    showToast('⚠️ Preencha e-mail e senha.');
    return;
  }

  if (supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) {
      showToast('❌ Erro no login: ' + error.message);
      return;
    }
    localStorage.setItem('cerimonIA_currentUser', email);
    enterApp(true);
    updateUI();
    showToast('👋 Bem-vindo (via Supabase)!');
    return;
  }

  // Fallback LocalStorage
  const users = JSON.parse(localStorage.getItem('cerimonIA_users') || '{}');
  if (users[email] && users[email].pass === pass) {
    appState = users[email].state;
    localStorage.setItem('cerimonIA_currentUser', email);
    saveState();
    enterApp(true);
    showToast('👋 Bem-vindo de volta!');
  } else {
    showToast('❌ E-mail ou senha incorretos.');
  }
}

function logout() {
  localStorage.removeItem('cerimonIA_currentUser');
  location.reload();
}

function calculateMonthsLeft(targetDate) {
  const now = new Date();
  const target = new Date(targetDate + 'T00:00:00');
  const diff = (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth());
  return Math.max(0, diff);
}

function updateUI() {
  // Banner & Titles
  const bName = document.getElementById('brideNameDisplay');
  const gName = document.getElementById('groomNameDisplay');
  const wDate = document.getElementById('weddingDateDisplay');
  if (bName) bName.textContent = `Olá, ${appState.brideName}! ✨`;
  if (gName) gName.textContent = appState.groomName;
  if (wDate) {
    const d = new Date(appState.weddingDate + 'T00:00:00');
    const formatted = d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
    wDate.textContent = formatted;
    const tlDate = document.getElementById('timelineDateDisplay');
    if (tlDate) tlDate.textContent = `📅 ${formatted}`;
  }

  // Sidebar Footer
  const footerName = document.querySelector('.user-name');
  const footerDate = document.querySelector('.user-date');
  const monthsLeft = calculateMonthsLeft(appState.weddingDate);
  if (footerName) footerName.textContent = `${appState.brideName} & ${appState.groomName}`;
  if (footerDate) {
    footerDate.textContent = `Faltam ${monthsLeft} meses`;
  }

  // Modules
  renderOrcamentos();
  renderGuests();
  renderAgents();
  renderMoodboard();
  renderBudgetTable();
  renderReviewEngine();
  renderTimeline();
  renderDashboard();
  
  // Dashboard Sync
  const monthLabel = document.querySelector('.page-sub');
  if (monthLabel && !monthLabel.textContent.includes('assessoria')) {
    monthLabel.textContent = `Faltam exatamente ${monthsLeft} meses para o seu grande dia.`;
  }

  // Planner Sync
  const pCity = document.getElementById('plannerCity');
  const pDate = document.getElementById('plannerDate');
  if (pCity) pCity.textContent = appState.weddingCity;
  if (pDate) {
    const d = new Date(appState.weddingDate + 'T00:00:00');
    pDate.textContent = d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
    
    // Dynamic Sunset Logic
    const month = d.getMonth();
    const sunsetTimes = ["18:20", "18:40", "18:10", "17:45", "17:30", "17:30", "17:40", "18:00", "18:15", "18:30", "18:45", "19:05"];
    const sTime = sunsetTimes[month];
    const sunsetEl = document.getElementById('sunsetTime');
    if (sunsetEl) sunsetEl.textContent = sTime.replace(':', 'h');
    
    updatePlannerRec(sTime);
  }
}

function updatePlannerRec(sunset) {
  const hourInput = document.getElementById('ceremonyHour');
  const recEl = document.getElementById('sunsetRec');
  if (!hourInput || !recEl) return;
  
  const [sh, sm] = sunset.split(':').map(Number);
  const [ch, cm] = hourInput.value.split(':').map(Number);
  
  const sTotal = sh * 60 + sm;
  const cTotal = ch * 60 + cm;
  const diff = sTotal - cTotal;

  if (diff > 90) {
    recEl.textContent = '💡 Recomendação: Você terá bastante luz natural. Ideal para cerimônias longas.';
  } else if (diff >= 45 && diff <= 90) {
    recEl.textContent = '✨ Recomendação: Horário perfeito! O pôr do sol acontecerá durante as fotos dos noivos.';
  } else if (diff > 0 && diff < 45) {
    recEl.textContent = '⚠️ Recomendação: Cuidado! A luz vai cair rápido. Tente adiantar 30 min para garantir fotos claras.';
  } else {
    recEl.textContent = '🌙 Recomendação: Cerimônia noturna. Foque em uma iluminação cênica impactante.';
  }
}

// === AI CHAT ===
const aiResponses = [
  'Estou negociando com 3 fotógrafos agora em Cotia. Quer ver os orçamentos comparados?',
  'Identifiquei que o Buffet Sabor & Arte está fora do perfil: eles não atendem eventos abaixo de 200 pessoas.',
  'Analisei os novos orçamentos de decoração. A Flora & Arte continua sendo a melhor opção para o estilo Boho.',
  'Lembrete: faltam ' + calculateMonthsLeft(appState.weddingDate) + ' meses para o casamento. Hora de fechar os doces!',
  'Enviei RSVP automático para os novos convidados. 5 já confirmaram!'
];
function addAiMessage(text, isUser) {
  const container = document.getElementById('aiMessages');
  if (!container) return;
  const div = document.createElement('div');
  div.className = 'ai-msg ' + (isUser ? 'user' : 'bot');
  div.innerHTML = `<div class="ai-bubble">${text}</div>`;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}
function handleAiSend() {
  const input = document.getElementById('aiInput');
  const text = input.value.trim();
  if (!text) return;
  addAiMessage(text, true);
  input.value = '';
  setTimeout(() => addAiMessage(aiResponses[Math.floor(Math.random() * aiResponses.length)], false), 1000);
}

// === AI CHAT LISTENERS ===
document.getElementById('aiSend')?.addEventListener('click', handleAiSend);
document.getElementById('aiInput')?.addEventListener('keydown', e => { if (e.key === 'Enter') handleAiSend(); });

// === NAVIGATION ===
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', e => {
    e.preventDefault();
    const page = item.dataset.page;
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    item.classList.add('active');
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const targetPage = document.getElementById('page-' + page);
    if (targetPage) targetPage.classList.add('active');
    document.getElementById('pageTitle').textContent = item.querySelector('span:last-child').textContent;
    document.getElementById('sidebar').classList.remove('open');
  });
});

document.getElementById('menuBtn').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
});

// === MODALS ===
function openEditWedding() {
  document.getElementById('editBrideName').value = appState.brideName;
  document.getElementById('editGroomName').value = appState.groomName;
  document.getElementById('editWeddingDate').value = appState.weddingDate;
  document.getElementById('editWeddingCity').value = appState.weddingCity;
  document.getElementById('editTotalBudget').value = appState.totalBudget;
  document.getElementById('editWeddingModal').classList.add('show');
}
function closeEditWedding() { document.getElementById('editWeddingModal').classList.remove('show'); }
function saveWeddingDetails() {
  appState.brideName = document.getElementById('editBrideName').value;
  appState.groomName = document.getElementById('editGroomName').value;
  appState.weddingDate = document.getElementById('editWeddingDate').value;
  appState.weddingCity = document.getElementById('editWeddingCity').value;
  appState.totalBudget = parseInt(document.getElementById('editTotalBudget').value);
  saveState();
  closeEditWedding();
  showToast('✓ Dados do casamento salvos!');
}

function openEditSupplier(index) {
  const s = appState.suppliers[index];
  document.getElementById('editSupplierIndex').value = index;
  document.getElementById('editSupplierName').value = s.name;
  document.getElementById('editSupplierCat').value = s.cat;
  document.getElementById('editSupplierCity').value = s.city;
  document.getElementById('editSupplierPrice').value = s.price;
  document.getElementById('editSupplierIncludes').value = s.includes;
  document.getElementById('editSupplierAvail').value = s.avail.toString();
  document.getElementById('editSupplierModal').classList.add('show');
}
function closeEditSupplier() { document.getElementById('editSupplierModal').classList.remove('show'); }
function saveSupplierEdit() {
  const idx = document.getElementById('editSupplierIndex').value;
  const s = appState.suppliers[idx];
  s.name = document.getElementById('editSupplierName').value;
  s.cat = document.getElementById('editSupplierCat').value;
  s.city = document.getElementById('editSupplierCity').value;
  s.price = document.getElementById('editSupplierPrice').value;
  s.includes = document.getElementById('editSupplierIncludes').value;
  s.avail = document.getElementById('editSupplierAvail').value === 'true';
  saveState();
  closeEditSupplier();
  showToast('✓ Fornecedor atualizado!');
}

// === AGENTS RENDERER ===
function renderAgents() {
  const grid = document.getElementById('agentsGrid');
  if (!grid) return;
  grid.innerHTML = '';
  
  Object.keys(appState.missions).forEach(cat => {
    const m = appState.missions[cat];
    const card = document.createElement('div');
    card.className = 'agent-card';
    card.onclick = () => openMission(cat);
    
    let statusClass = 'badge-gray';
    if (m.status === 'Fechado') statusClass = 'badge-ok';
    if (m.status === 'Pagando') statusClass = 'badge-info';
    if (m.status === 'Em negociação') statusClass = 'badge-warn';

    card.innerHTML = `
      <div class="agent-icon">${getIcon(cat)}</div>
      <div class="agent-name">${cat}</div>
      <div class="agent-stat"><span class="badge ${statusClass}">${m.status}</span></div>
      <button class="btn-sm btn-outline" style="width:100%; margin-top:10px">Ver Detalhes</button>
    `;
    grid.appendChild(card);
  });
  
  // Add New Button
  const addBtn = document.createElement('div');
  addBtn.className = 'agent-card add-new';
  addBtn.innerHTML = '<div class="agent-icon">＋</div><div class="agent-name">Novo Serviço</div>';
  addBtn.onclick = () => openMission('Novo');
  grid.appendChild(addBtn);
}

function getIcon(cat) {
  const icons = { 'Buffet': '🍽️', 'Decoração': '🌸', 'Fotografia': '📸', 'Doces': '🍰', 'Som & DJ': '🎵' };
  return icons[cat] || '✨';
}

function openMission(cat) {
  const mission = appState.missions[cat] || { status: 'Procurando fornecedor', messages: [] };
  const config = document.getElementById('missionConfigForm');
  const live = document.getElementById('missionLiveChat');
  const searchFields = document.getElementById('missionSearchFields');
  const financeFields = document.getElementById('missionFinanceFields');
  const statusSelect = document.getElementById('missionStatus');
  const actionBtn = document.getElementById('missionActionBtn');

  document.getElementById('modalTitle').textContent = cat === 'Novo' ? 'Novo Serviço' : cat;
  statusSelect.value = mission.status;
  
  if (mission.status === 'Em negociação') {
    config.style.display = 'none';
    live.style.display = 'block';
    renderLiveChat(cat);
  } else {
    config.style.display = 'block';
    live.style.display = 'none';
    searchFields.style.display = 'block';
    const isPaying = (mission.status === 'Pagando' || mission.status === 'A Pagar' || mission.status === 'Fechado');
    financeFields.style.display = isPaying ? 'block' : 'none';
    
    // Populate finance if exists
    if (isPaying) {
      document.getElementById('missionTotalVal').value = mission.total || '';
      document.getElementById('missionPaidVal').value = mission.paid || '';
      document.getElementById('missionInstallments').value = mission.installments || '';
    }

    if (actionBtn) actionBtn.textContent = (mission.status === 'Procurando fornecedor') ? '🚀 Iniciar Prospecção' : '💾 Salvar Status';
  }
  
  statusSelect.onchange = () => {
    const isPaying = (statusSelect.value === 'Pagando' || statusSelect.value === 'A Pagar' || statusSelect.value === 'Fechado');
    financeFields.style.display = isPaying ? 'block' : 'none';
    if (actionBtn) actionBtn.textContent = (statusSelect.value === 'Procurando fornecedor') ? '🚀 Iniciar Prospecção' : '💾 Salvar Status';
  };

  document.getElementById('modalOverlay').classList.add('show');
}

function closeModal() { document.getElementById('modalOverlay').classList.remove('show'); }

function renderLiveChat(cat) {
  const m = appState.missions[cat];
  if (!m) return;
  const container = document.getElementById('waLiveMessages');
  document.getElementById('waLiveName').textContent = `Agente IA (${cat})`;
  container.innerHTML = '';
  m.messages.forEach(msg => {
    const div = document.createElement('div');
    div.innerHTML = `<div class="wa-bubble ${msg.bot ? 'user' : 'bot'}">${msg.text}</div>`;
    container.appendChild(div);
  });
  container.scrollTop = container.scrollHeight;
}
function startMission() {
  const cat = document.getElementById('modalTitle').textContent;
  const status = document.getElementById('missionStatus').value;
  
  let targetCat = cat;
  if (cat === 'Novo Serviço') {
    const newCat = prompt('Qual o novo serviço? (ex: Buffet + Salão)');
    if (!newCat) return;
    targetCat = newCat;
  }

  appState.missions[targetCat] = appState.missions[targetCat] || { messages: [] };
  appState.missions[targetCat].status = status;
  
  // Capture Finance
  const total = parseFloat(document.getElementById('missionTotalVal').value) || 0;
  const paid = parseFloat(document.getElementById('missionPaidVal').value) || 0;
  const inst = parseInt(document.getElementById('missionInstallments').value) || 1;
  
  appState.missions[targetCat].total = total;
  appState.missions[targetCat].paid = paid;
  appState.missions[targetCat].installments = inst;

  // Sync with BudgetTable
  let budgetItem = appState.budgetItems.find(b => b.name === targetCat);
  if (!budgetItem) {
    budgetItem = { name: targetCat, estimated: total, spent: total, paid: paid, installment: total/inst, status: status };
    appState.budgetItems.push(budgetItem);
  } else {
    budgetItem.spent = total;
    budgetItem.paid = paid;
    budgetItem.installment = inst > 0 ? (total - paid) / inst : 0;
    budgetItem.status = status;
  }
  
  if (status === 'Em negociação' || status === 'Procurando fornecedor') {
    appState.missions[targetCat].messages = [{ text: `Olá! Buscamos orçamento para ${targetCat}.`, bot: true }];
    saveState();
    openMission(targetCat);
  } else {
    saveState();
    closeModal();
    showToast(`✓ Dados de ${targetCat} salvos e integrados ao financeiro.`);
  }
}

// === DASHBOARD RENDERER ===
function renderDashboard() {
  // 1. Urgency Cards
  const uGrid = document.getElementById('dashboardUrgencyGrid');
  if (uGrid) {
    const keys = Object.keys(appState.missions);
    if (keys.length === 0) {
      uGrid.innerHTML = '<div style="color:var(--text-muted); font-size:0.9rem; padding: 20px;">Você ainda não tem serviços na Central de Agentes. Acesse o menu lateral para começar a prospecção!</div>';
    } else {
      uGrid.innerHTML = keys.map(cat => {
        const m = appState.missions[cat];
        let statusClass = 'badge-gray';
        let statusText = 'Pendente';
        let cardClass = 'card';
        if (m.status === 'Fechado' || m.status === 'Pagando') { statusClass = 'badge-ok'; statusText = 'Confirmado'; cardClass = 'card ok'; }
        else if (m.status === 'Em negociação') { statusClass = 'badge-info'; statusText = 'Em Negociação'; }
        else { statusClass = 'badge-warn'; statusText = 'Procurando'; cardClass = 'card urgent'; }
        
        return `
        <div class="${cardClass}" onclick="openMission('${cat}')">
          <div class="card-icon">${getIcon(cat)}</div>
          <div class="card-info">
            <div class="card-title">${cat}</div>
            <div class="card-desc">Status: ${m.status}</div>
            <span class="badge ${statusClass}">${statusText}</span>
          </div>
        </div>
        `;
      }).join('');
    }
  }

  // 2. Budget Bars
  const bBars = document.getElementById('dashboardBudgetBars');
  const dTotalSpent = document.getElementById('dashTotalSpent');
  const dTotalBudget = document.getElementById('dashTotalBudget');
  
  if (bBars && dTotalSpent && dTotalBudget) {
    let totalSpent = 0;
    
    if (appState.budgetItems.length === 0) {
      bBars.innerHTML = '<div style="color:var(--text-muted); font-size:0.9rem; padding: 20px;">Nenhum item financeiro. Gerencie na aba Financeiro!</div>';
    } else {
      const colors = ['var(--rose)', 'var(--lilac)', 'var(--silver)', 'var(--rose-dark)', 'var(--lilac-dark)'];
      bBars.innerHTML = appState.budgetItems.map((item, i) => {
        totalSpent += item.spent;
        const pct = item.estimated > 0 ? Math.min(100, (item.spent / item.estimated) * 100) : 0;
        const color = colors[i % colors.length];
        return `
          <div class="bbar-row">
            <span>${item.name}</span>
            <div class="bbar-track"><div class="bbar-fill" style="width:${pct}%;background:${color}"></div></div>
            <span>R$ ${(item.spent / 1000).toFixed(1)}k / R$ ${(item.estimated / 1000).toFixed(1)}k</span>
          </div>
        `;
      }).join('');
    }

    dTotalSpent.textContent = `R$ ${totalSpent.toLocaleString('pt-BR')}`;
    dTotalBudget.textContent = `R$ ${appState.totalBudget.toLocaleString('pt-BR')}`;
  }

  // 3. AI Messages Init
  const aiContainer = document.getElementById('aiMessages');
  if (aiContainer) {
    aiContainer.innerHTML = ''; // Limpa mensagens anteriores
    addAiMessage(`Olá, ${appState.brideName || 'Noiva'}! Estou pronta para te ajudar. Você pode me pedir para cotar fornecedores, analisar orçamentos ou enviar lembretes.`, false);
  }
}

// === RENDERERS ===
let activeCity = 'all';
let activeCat = 'all';

function renderOrcamentos() {
  const sections = document.getElementById('citySections');
  if (!sections) return;
  sections.innerHTML = '';
  
  const filtered = appState.suppliers.filter(s => 
    (activeCity === 'all' || s.city === activeCity) &&
    (activeCat === 'all' || s.cat === activeCat)
  );

  const byCity = {};
  filtered.forEach(s => {
    if (!byCity[s.city]) byCity[s.city] = [];
    byCity[s.city].push(s);
  });
  Object.keys(byCity).forEach(city => {
    const div = document.createElement('div');
    div.className = 'city-section';
    div.innerHTML = `
      <div class="city-section-header">📍 ${city}</div>
      <div class="table-wrap"><table class="orc-table">
        <thead><tr><th>Nome</th><th>Cat.</th><th>Valor</th><th>Ação</th></tr></thead>
        <tbody>
          ${byCity[city].map((s, i) => `
            <tr>
              <td><strong>${s.name}</strong></td>
              <td>${s.cat}</td>
              <td>${s.price}</td>
              <td>
                <button class="btn-sm btn-outline" onclick="openEditSupplier(${appState.suppliers.indexOf(s)})">✏️</button>
                <button class="btn-sm btn-primary" onclick="closeContract(this)">Fechar</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table></div>`;
    sections.appendChild(div);
  });
}

function renderGuests() {
  const tbody = document.getElementById('guestTableBody');
  if (!tbody) return;
  if (appState.guests.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:40px; color:var(--text-muted)">Nenhum convidado adicionado. Clique em "Adicionar" para começar!</td></tr>';
    updateGuestStats();
    return;
  }
  tbody.innerHTML = appState.guests.map((g, i) => `
    <tr>
      <td><strong>${g.name}</strong></td>
      <td>${g.group}</td>
      <td>+${g.plus}</td>
      <td><span class="badge badge-${g.status === 'confirmed' ? 'ok' : 'warn'}">${g.status}</span></td>
      <td><button class="btn-sm btn-outline" onclick="removeGuest(${i})">Excluir</button></td>
    </tr>`).join('');
  updateGuestStats();
}

function removeGuest(i) {
  appState.guests.splice(i, 1);
  saveState();
}

function updateGuestStats() {
  const total = appState.guests.length;
  const confirmed = appState.guests.filter(g => g.status === 'confirmed').length;
  const elTotal = document.querySelector('.rstat:nth-child(1) .rstat-num');
  const elConf = document.querySelector('.rstat:nth-child(2) .rstat-num');
  if (elTotal) elTotal.textContent = total;
  if (elConf) elConf.textContent = confirmed;
}

function addGuest() {
  const name = prompt('Nome do convidado:');
  if (name) {
    appState.guests.push({ name, group: 'Amigos', plus: 0, status: 'pending' });
    saveState();
    showToast('✓ Convidado adicionado!');
  }
}

// === MOODBOARD ===
let tempMood = null;

function renderMoodboard() {
  const grid = document.getElementById('moodGrid');
  if (!grid) return;
  if (appState.moodboard.length === 0) {
    grid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding:40px; color:var(--text-muted)">Nenhuma referência salva. Descreva seu estilo acima para começar!</div>';
    return;
  }
  grid.innerHTML = appState.moodboard.map((m, i) => `
    <div class="mood-item">
      <div class="mood-placeholder" style="background: ${m.bg}">
        <span>${m.title}</span>
      </div>
      <div class="mood-caption">${m.caption} <button onclick="removeMood(${i})" style="border:none; background:none; cursor:pointer; float:right">🗑️</button></div>
    </div>`).join('');
}

function generateMood() {
  const promptText = document.getElementById('moodPrompt').value;
  const style = document.querySelector('.style-btn.active')?.dataset.style || 'Moderno';
  
  if (!promptText) { showToast('⚠️ Descreva o que você imagina primeiro!'); return; }

  showToast('🎨 IA processando referências visuais...');
  
  setTimeout(() => {
    tempMood = {
      title: `✨ ${style}: ${promptText.substring(0, 20)}...`,
      bg: `linear-gradient(135deg, ${getRandomColor()}, ${getRandomColor()})`,
      caption: `Estilo: ${style}`
    };
    
    const preview = document.getElementById('moodPreview');
    const content = document.getElementById('moodPreviewContent');
    if (preview && content) {
      preview.style.display = 'block';
      content.innerHTML = `
        <div class="mood-item" style="width:200px">
          <div class="mood-placeholder" style="background: ${tempMood.bg}">
            <span>${tempMood.title}</span>
          </div>
          <div class="mood-caption">${tempMood.caption}</div>
        </div>`;
      preview.scrollIntoView({ behavior: 'smooth' });
    }
  }, 1500);
}

function saveMood() {
  if (tempMood) {
    appState.moodboard.push(tempMood);
    saveState();
    discardMood();
    showToast('⭐ Referência salva no moodboard!');
  }
}

function discardMood() {
  tempMood = null;
  const preview = document.getElementById('moodPreview');
  if (preview) preview.style.display = 'none';
  document.getElementById('moodPrompt').value = '';
}

function removeMood(i) {
  appState.moodboard.splice(i, 1);
  saveState();
}

function getRandomColor() {
  const colors = ['#F7B8CC', '#C9AEE6', '#E8D5F5', '#D4C5F0', '#C0C0C8', '#f0b8d4', '#e091ab'];
  return colors[Math.floor(Math.random() * colors.length)];
}

// === TIMELINE ===
function renderTimeline() {
  const tl = document.getElementById('timeline');
  if (!tl) return;
  if (appState.timeline.length === 0) {
    tl.innerHTML = '<div style="text-align:center; padding:40px; color:var(--text-muted)">Cronograma vazio. Comece a planejar o seu grande dia!</div>';
    return;
  }
  tl.innerHTML = appState.timeline.map((ev, i) => `
    <div class="tl-item">
      <div class="tl-dot"></div>
      <div class="tl-time">${ev.time}</div>
      <div class="tl-title">${ev.title} <button onclick="removeEvent(${i})" style="border:none; background:none; cursor:pointer; font-size:0.7rem">❌</button></div>
      <div class="tl-desc">${ev.desc}</div>
    </div>`).join('');
}

function addEvent() {
  const time = prompt('Horário (ex: 18:00):');
  const title = prompt('O que acontece?');
  if (time && title) {
    appState.timeline.push({ time, title, desc: '', done: false });
    appState.timeline.sort((a, b) => a.time.localeCompare(b.time));
    saveState();
  }
}

function removeEvent(i) {
  appState.timeline.splice(i, 1);
  saveState();
}

// === FINANCIAL DETAILED ===
function renderBudgetTable() {
  const tbody = document.getElementById('budgetTableBody');
  if (!tbody) return;
  
  let totalEst = 0, totalSpent = 0, totalPaid = 0;

  tbody.innerHTML = appState.budgetItems.map((item, i) => {
    totalEst += item.estimated;
    totalSpent += item.spent;
    totalPaid += item.paid;

    return `
      <tr>
        <td><input type="text" value="${item.name}" onchange="updateBudgetItem(${i}, 'name', this.value)"></td>
        <td><input type="number" value="${item.estimated}" onchange="updateBudgetItem(${i}, 'estimated', this.value)"></td>
        <td><input type="number" value="${item.spent}" onchange="updateBudgetItem(${i}, 'spent', this.value)"></td>
        <td><input type="number" value="${item.paid}" onchange="updateBudgetItem(${i}, 'paid', this.value)"></td>
        <td><input type="number" value="${item.installment}" onchange="updateBudgetItem(${i}, 'installment', this.value)"></td>
        <td>
          <select onchange="updateBudgetItem(${i}, 'status', this.value)">
            <option ${item.status === 'Procurando' ? 'selected' : ''}>Procurando</option>
            <option ${item.status === 'A Pagar' ? 'selected' : ''}>A Pagar</option>
            <option ${item.status === 'Pagando' ? 'selected' : ''}>Pagando</option>
            <option ${item.status === 'Fechado' ? 'selected' : ''}>Fechado</option>
          </select>
        </td>
        <td><button onclick="removeBudgetItem(${i})">❌</button></td>
      </tr>`;
  }).join('');

  // Update KPIs
  document.getElementById('finTotalBudget').textContent = `R$ ${totalEst.toLocaleString('pt-BR')}`;
  document.getElementById('finSpentBudget').textContent = `R$ ${totalSpent.toLocaleString('pt-BR')}`;
  document.getElementById('finPaidBudget').textContent = `R$ ${totalPaid.toLocaleString('pt-BR')}`;
  document.getElementById('finRemainingBudget').textContent = `R$ ${(totalSpent - totalPaid).toLocaleString('pt-BR')}`;
  
  renderCashflow();
}

function updateBudgetItem(i, field, value) {
  appState.budgetItems[i][field] = field === 'name' || field === 'status' ? value : parseFloat(value) || 0;
  saveState();
}

function addBudgetLine() {
  appState.budgetItems.push({ name: 'Novo Item', estimated: 0, spent: 0, paid: 0, installment: 0, status: 'Procurando' });
  saveState();
}

function removeBudgetItem(i) {
  appState.budgetItems.splice(i, 1);
  saveState();
}

function renderCashflow() {
  const grid = document.getElementById('cashflowGrid');
  if (!grid) return;
  grid.innerHTML = '';
  const months = ['Mai','Jun','Jul','Ago','Set','Out','Nov'];
  months.forEach(m => {
    let monthlyTotal = 0;
    appState.budgetItems.forEach(item => {
      if (item.status === 'Pagando') monthlyTotal += item.installment;
    });
    const div = document.createElement('div');
    div.className = 'cf-month ' + (monthlyTotal > 5000 ? 'alert' : 'ok');
    div.innerHTML = `<div class="cf-month-name">${m}</div><div class="cf-month-val">R$ ${monthlyTotal.toLocaleString('pt-BR')}</div>`;
    grid.appendChild(div);
  });
}

// === OCR SIMULATION ===
function simulateOCR() {
  showToast('📄 IA lendo contrato... aguarde.');
  setTimeout(() => {
    showToast('✅ OCR concluído! Valores extraídos: R$ 25.000 em 5x.');
  }, 2000);
}

// === CONCIERGE FIXED ===
function initConcierge() {
  addConciergeMessage('Olá! Sou o assistente virtual dos noivos. Como posso ajudar?', false);
  document.getElementById('waSend')?.addEventListener('click', handleConciergeSend);
  document.getElementById('waInput')?.addEventListener('keydown', e => { if (e.key === 'Enter') handleConciergeSend(); });
}

function handleConciergeSend() {
  const input = document.getElementById('waInput');
  const text = input.value.trim();
  if (!text) return;

  addConciergeMessage(text, true);
  input.value = '';

  setTimeout(() => {
    let reply = "Essa é uma ótima pergunta! Vou consultar os noivos.";
    const lower = text.toLowerCase();
    
    if (lower.includes('onde') || lower.includes('local')) {
      reply = `O casamento será na **${document.getElementById('kbLocal').value}**. Quer que eu envie o link do Maps?`;
    } else if (lower.includes('presente') || lower.includes('lista')) {
      reply = `Claro! A lista de presentes oficial está no link: ${document.getElementById('kbGiftList').value}`;
    } else if (lower.includes('dress') || lower.includes('roupa')) {
      reply = `O traje solicitado é **${document.getElementById('kbDress').value}**.`;
    } else if (lower.includes('hora')) {
      reply = `A cerimônia começa pontualmente às **${document.getElementById('kbTime').value}**. Recomendamos chegar 15 min antes.`;
    }
    
    addConciergeMessage(reply, false);
  }, 1000);
}

function addConciergeMessage(text, isUser) {
  const container = document.getElementById('waMessages');
  if (!container) return;
  const div = document.createElement('div');
  div.className = 'wa-bubble ' + (isUser ? 'user' : 'bot');
  div.innerHTML = text;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

// === RSVP WITH GIFT LINK ===
function sendRSVP() {
  if (appState.guests.length === 0) { showToast('⚠️ Adicione convidados primeiro!'); return; }
  showToast('📲 Enviando mensagens personalizadas via WhatsApp...');
  setTimeout(() => {
    showToast(`✓ Mensagens enviadas com o link: ${document.getElementById('kbGiftList').value}`);
  }, 2000);
}

// === UTILS ===
function showToast(msg) {
  const t = document.createElement('div');
  t.className = 'toast'; t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 4000);
}
function launchConfetti() {
  for (let i = 0; i < 50; i++) {
    const p = document.createElement('div');
    p.className = 'confetti-particle';
    p.style.left = Math.random() * 100 + 'vw';
    p.style.background = ['#F7B8CC','#C9AEE6','#fff'][Math.floor(Math.random()*3)];
    p.style.animationDuration = (Math.random()*2+2)+'s';
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 4000);
  }
}
function closeContract(btn) {
  btn.textContent = '✓ Fechado'; btn.disabled = true;
  btn.style.background = '#2a9d5c';
  launchConfetti(); showToast('🎉 Contrato fechado!');
}

// === FILTERS ===
document.addEventListener('click', e => {
  if (e.target.classList.contains('city-btn')) {
    document.querySelectorAll('.city-btn').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    activeCity = e.target.dataset.city;
    renderOrcamentos();
  }
  if (e.target.classList.contains('filter-btn') && e.target.closest('#catFilters')) {
    document.querySelectorAll('#catFilters .filter-btn').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    activeCat = e.target.dataset.cat;
    renderOrcamentos();
  }
});

// Landing/Onboarding

async function finishOnboarding() {
  try {
    const email = document.getElementById('ob-email').value;
    const pass = document.getElementById('ob-pass').value;
    
    if (!email || !pass) {
      showToast('⚠️ Por favor, preencha e-mail e senha.');
      return;
    }

    if (supabase) {
      const { data, error } = await supabase.auth.signUp({ email, password: pass });
      if (error) {
        showToast('❌ Erro ao criar conta: ' + error.message);
        return;
      }
    }

    appState.brideName = document.getElementById('ob-bride')?.value || 'Noiva';
    appState.groomName = document.getElementById('ob-groom')?.value || 'Noivo';
    appState.weddingDate = document.getElementById('ob-date')?.value || '2025-11-15';
    appState.weddingCity = document.getElementById('ob-city')?.value || 'Carapicuíba, SP';
    appState.totalBudget = parseFloat(document.getElementById('ob-budget')?.value) || 75000;
    
    // Save to User Store (Fallback/Cache)
    const users = JSON.parse(localStorage.getItem('cerimonIA_users') || '{}');
    users[email] = { pass: pass, state: appState };
    localStorage.setItem('cerimonIA_users', JSON.stringify(users));
    localStorage.setItem('cerimonIA_currentUser', email);

    saveState();
    showToast('✨ Conta criada com sucesso!');
  } catch (e) {
    console.error('Onboarding error:', e);
  } finally {
    enterApp(true);
    updateUI();
  }
}
function obNext(step) {
  document.querySelectorAll('.onboarding-step').forEach(s => s.classList.remove('active'));
  const targetStep = document.getElementById('ob-step-'+step);
  if (targetStep) targetStep.classList.add('active');
  
  document.querySelectorAll('.ob-dot').forEach((d, i) => { 
    if(i <= step) d.classList.add('done'); 
    else d.classList.remove('done'); 
  });

  if (step === 3) {
    const bride = document.getElementById('ob-bride').value || 'Noiva';
    const budget = document.getElementById('ob-budget').value || '75.000';
    const city = document.getElementById('ob-city').value || 'sua cidade';
    const summary = document.getElementById('ob-summary');
    if (summary) {
      summary.innerHTML = `
        <strong>Resumo do Plano:</strong><br>
        👰 Noiva: ${bride}<br>
        📍 Local: ${city}<br>
        💰 Orçamento: R$ ${budget}<br>
        ✨ Estilo Detectado: Moderno/Luxo<br><br>
        <em>IA está gerando 3 propostas agora...</em>`;
    }
  }
}

window.addEventListener('load', () => {
  const currentUser = localStorage.getItem('cerimonIA_currentUser');
  if (currentUser) {
    let users = {};
    try {
      users = JSON.parse(localStorage.getItem('cerimonIA_users') || '{}');
    } catch(e) {
      users = {};
    }
    if (users[currentUser]) {
      appState = users[currentUser].state;
    }
    enterApp(true);
  }
  updateUI();
  initConcierge();
});

// === REVIEW ENGINE ===
function renderReviewEngine() {
  const grid = document.getElementById('reviewGrid');
  if (!grid) return;
  
  const reviewData = [
    { name: 'Sabor & Arte', cat: 'Buffet', score: 98, events: 42, punct: '100%', quality: 'Excelente' },
    { name: 'Studio Lumière', cat: 'Fotografia', score: 95, events: 28, punct: '98%', quality: 'Premium' },
    { name: 'Flora & Arte', cat: 'Decoração', score: 92, events: 15, punct: '95%', quality: 'Alta' }
  ];

  grid.innerHTML = reviewData.map(r => `
    <div class="review-card">
      <div class="review-top">
        <div><div class="review-name">${r.name}</div><div class="review-cat">${r.cat}</div></div>
        <div class="lead-score ${r.score > 95 ? 'high' : 'mid'}">${r.score}</div>
      </div>
      <div class="review-metrics">
        <div class="rm-row"><span class="rm-label">Histórico</span><span class="rm-val">${r.events} eventos</span></div>
        <div class="rm-row"><span class="rm-label">Pontualidade</span><span class="rm-val">${r.punct}</span></div>
        <div class="rm-row"><span class="rm-label">Qualidade IA</span><span class="rm-val">${r.quality}</span></div>
      </div>
      <div class="style-match ok">✨ Match de Estilo: ${r.score}%</div>
    </div>
  `).join('');
}

// === PLANNER ROTEIRO ===
function generateRoteiro() {
  const hourInput = document.getElementById('ceremonyHour').value;
  if (!hourInput) return;
  
  const [h, m] = hourInput.split(':').map(Number);
  const start = new Date();
  start.setHours(h, m, 0);

  const addMins = (date, mins) => new Date(date.getTime() + mins * 60000);
  const format = (date) => date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const rito = [
    { t: -30, text: 'Chegada dos Convidados & Welcome Drink' },
    { t: 0, text: 'Início da Cerimônia (Cortejo)' },
    { t: 15, text: 'Entrada da Noiva' },
    { t: 45, text: 'Troca de Alianças & Votos' },
    { t: 60, text: 'Saída dos Noivos (Cumprimentos)' },
    { t: 75, text: 'Início do Coquetel / Sessão de Fotos' },
    { t: 135, text: 'Abertura do Jantar' },
    { t: 240, text: 'Abertura da Pista de Dança' }
  ];

  const resultHTML = rito.map(item => {
    const time = addMins(start, item.t);
    return `<strong>${format(time)}</strong> — ${item.text}`;
  }).join('<br>');

  const resultDiv = document.getElementById('ritoResult');
  if (resultDiv) resultDiv.innerHTML = `✨ **Roteiro Sugerido pela CerimonIA:**<br><br>${resultHTML}`;
  showToast('🪄 Roteiro gerado com sucesso!');
}

// Listen for planner changes
document.addEventListener('change', e => {
  if (e.target.id === 'ceremonyHour') {
    const d = new Date(appState.weddingDate + 'T00:00:00');
    const sunsetTimes = ["18:20", "18:40", "18:10", "17:45", "17:30", "17:30", "17:40", "18:00", "18:15", "18:30", "18:45", "19:05"];
    updatePlannerRec(sunsetTimes[d.getMonth()]);
  }
});

