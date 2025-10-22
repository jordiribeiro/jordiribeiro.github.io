import { auth, db, aiPlannerEndpoint } from './firebase-config.js';
import {
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js';
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js';

(function () {
  'use strict';

  // Tabs
  const tabs = document.querySelectorAll('.tab');
  const panels = document.querySelectorAll('.tab-panel');
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const targetId = tab.getAttribute('aria-controls');
      tabs.forEach(t => t.setAttribute('aria-selected', String(t === tab)));
      panels.forEach(p => p.id === targetId ? p.hidden = false : p.hidden = true);
      const panel = document.getElementById(targetId);
      panel?.focus({ preventScroll: true });
    });
  });

  // Elements CRM
  const contactForm = document.getElementById('contactForm');
  const contactList = document.getElementById('contactList');
  const dealForm = document.getElementById('dealForm');
  const dealList = document.getElementById('dealList');

  // Dashboard metrics
  const metricContacts = document.getElementById('metricContacts');
  const metricDeals = document.getElementById('metricDeals');
  const metricPipeline = document.getElementById('metricPipeline');

  let unsubContacts = null;
  let unsubDeals = null;
  let unsubProfile = null;

  onAuthStateChanged(auth, async (user) => {
    // unsubscribe previous listeners
    if (unsubContacts) { unsubContacts(); unsubContacts = null; }
    if (unsubDeals) { unsubDeals(); unsubDeals = null; }
    if (unsubProfile) { unsubProfile(); unsubProfile = null; }
    if (!user) {
      clearList(contactList);
      clearList(dealList);
      setMetrics(0, 0, 0);
      setEligibility(null);
      return;
    }
    // subscribe contacts
    unsubContacts = bindList(
      collection(db, 'contacts'),
      [where('uid', '==', user.uid), orderBy('createdAt', 'desc')],
      contactList,
      renderContactItem
    );
    // subscribe deals
    unsubDeals = bindList(
      collection(db, 'deals'),
      [where('uid', '==', user.uid), orderBy('createdAt', 'desc')],
      dealList,
      renderDealItem,
      updatePipeline
    );

    // subscribe profile (companies/{uid})
    const { doc, onSnapshot: onSnapDoc } = await import('https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js');
    const docRef = doc(db, 'companies', user.uid);
    unsubProfile = onSnapDoc(docRef, (snap) => {
      const data = snap.exists() ? snap.data() : null;
      fillProfileForm(data);
      setEligibility(data);
    });
  });

  contactForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;
    const data = new FormData(contactForm);
    const name = String(data.get('name') || '').trim();
    const email = String(data.get('email') || '').trim();
    if (!name || !email) return;
    await addDoc(collection(db, 'contacts'), { uid: user.uid, name, email, createdAt: serverTimestamp() });
    contactForm.reset();
  });

  dealForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;
    const data = new FormData(dealForm);
    const title = String(data.get('title') || '').trim();
    const value = Number(data.get('value') || 0);
    if (!title || !value) return;
    await addDoc(collection(db, 'deals'), { uid: user.uid, title, value, createdAt: serverTimestamp(), status: 'open' });
    dealForm.reset();
  });

  function bindList(colRef, constraints, listEl, renderItem, onUpdate) {
    const q = constraints?.length ? query(colRef, ...constraints) : query(colRef);
    return onSnapshot(q, (snap) => {
      clearList(listEl);
      let items = [];
      snap.forEach((doc) => { items.push({ id: doc.id, ...doc.data() }); });
      items.forEach((item) => listEl?.appendChild(renderItem(item)));
      onUpdate && onUpdate(items);
    });
  }

  function renderContactItem(item) {
    const li = document.createElement('li');
    li.innerHTML = `<span>${escapeHtml(item.name)} — ${escapeHtml(item.email)}</span>`;
    return li;
  }

  function renderDealItem(item) {
    const li = document.createElement('li');
    li.innerHTML = `<span>${escapeHtml(item.title)}</span><strong>R$ ${Number(item.value || 0).toLocaleString('pt-BR')}</strong>`;
    return li;
  }

  function updatePipeline(items) {
    const total = items.reduce((sum, it) => sum + Number(it.value || 0), 0);
    setMetrics(null, items.length, total);
  }

  function setMetrics(contacts, deals, pipeline) {
    if (contacts != null && metricContacts) metricContacts.textContent = String(contacts);
    if (deals != null && metricDeals) metricDeals.textContent = String(deals);
    if (pipeline != null && metricPipeline) metricPipeline.textContent = `R$ ${Number(pipeline).toLocaleString('pt-BR')}`;
  }

  function clearList(listEl) { if (listEl) listEl.innerHTML = ''; }
  function escapeHtml(s) { return String(s).replace(/[&<>"]+/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

  // AI planner
  const aiPlanForm = document.getElementById('aiPlanForm');
  const aiPlanOutput = document.getElementById('aiPlanOutput');
  const openaiKeyInput = document.getElementById('openaiKey');
  const saveKeyBtn = document.getElementById('saveOpenaiKeyBtn');
  const openaiKeyNote = document.getElementById('openaiKeyNote');

  const OPENAI_KEY_K = 'nexus.openai.key';
  // load key mask
  const savedKey = localStorage.getItem(OPENAI_KEY_K);
  if (savedKey && openaiKeyInput) openaiKeyInput.value = savedKey.replace(/.(?=.{4})/g, '•');

  saveKeyBtn?.addEventListener('click', () => {
    if (!(openaiKeyInput instanceof HTMLInputElement)) return;
    const v = openaiKeyInput.value.trim();
    if (!v.startsWith('sk-')) {
      openaiKeyNote && (openaiKeyNote.textContent = 'Chave inválida. Deve começar com sk-.');
      return;
    }
    localStorage.setItem(OPENAI_KEY_K, v);
    openaiKeyNote && (openaiKeyNote.textContent = 'Chave salva apenas neste navegador.');
    openaiKeyInput.value = v.replace(/.(?=.{4})/g, '•');
  });
  aiPlanForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) { aiPlanOutput && (aiPlanOutput.textContent = 'Você precisa estar logado.'); return; }
    const data = new FormData(aiPlanForm);
    const goal = String(data.get('goal') || '').trim();
    if (!goal) return;
    aiPlanOutput.textContent = 'Gerando plano...';
    try {
      if (aiPlannerEndpoint) {
        const res = await fetch(aiPlannerEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ goal, uid: user.uid })
        });
        if (!res.ok) throw new Error('Falha na IA');
        const json = await res.json();
        aiPlanOutput.textContent = json.plan || JSON.stringify(json, null, 2);
      } else {
        // Direct call to OpenAI (browser). Use with caution.
        const k = localStorage.getItem(OPENAI_KEY_K) || '';
        if (!k) { aiPlanOutput.textContent = 'Cole e salve sua OpenAI API Key acima.'; return; }
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${k}`
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: 'Você é um assistente de planejamento estratégico para pequenos negócios.' },
              { role: 'user', content: `Crie um plano de ação claro e prático com checklist, metas (SMART), KPIs e próximos passos para: ${goal}` }
            ],
            temperature: 0.3
          })
        });
        if (!res.ok) throw new Error('Falha na IA');
        const j = await res.json();
        const plan = j.choices?.[0]?.message?.content || 'Sem resposta.';
        aiPlanOutput.textContent = plan;
      }
    } catch (e2) {
      aiPlanOutput.textContent = 'Erro ao gerar plano.';
    }
  });

  // Profile form
  const profileForm = document.getElementById('profileForm');
  const profileNote = document.getElementById('profileNote');
  profileForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;
    const data = new FormData(profileForm);
    const type = String(data.get('type') || 'micro');
    const revenue = Number(data.get('revenue') || 0);
    const cnpj = String(data.get('cnpj') || '').trim();
    const startedAt = String(data.get('startedAt') || '');
    const { doc, setDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js');
    const payload = { uid: user.uid, type, revenue, cnpj, startedAt, updatedAt: serverTimestamp() };
    await setDoc(doc(db, 'companies', user.uid), payload, { merge: true });
    profileNote && (profileNote.textContent = 'Perfil salvo.');
  });

  function fillProfileForm(data) {
    if (!data || !profileForm) return;
    const map = {
      type: 'pfType', revenue: 'pfRevenue', cnpj: 'pfCnpj', startedAt: 'pfStartedAt'
    };
    Object.entries(map).forEach(([key, id]) => {
      const el = document.getElementById(id);
      if (el && data[key] != null) el.value = String(data[key]);
    });
  }

  function setEligibility(profile) {
    const elI = document.getElementById('eligibilityIncentive');
    const elE = document.getElementById('eligibilityExemption');
    const elD = document.getElementById('eligibilityDays');
    if (!profile) {
      if (elI) elI.textContent = '—';
      if (elE) elE.textContent = '—';
      if (elD) elD.textContent = '—';
      return;
    }
    const isLarge = Number(profile.revenue || 0) >= 1_000_000;
    if (elI) elI.textContent = isLarge ? 'Elegível' : 'Não elegível';

    let exemption = 'Não elegível';
    let days = 0;
    if (profile.startedAt) {
      const start = new Date(profile.startedAt);
      const diff = Date.now() - start.getTime();
      const daysFromStart = Math.floor(diff / (1000 * 60 * 60 * 24));
      const remaining = Math.max(0, 90 - daysFromStart);
      exemption = daysFromStart <= 90 ? 'Ativa' : 'Expirada';
      days = remaining;
    }
    if (elE) elE.textContent = exemption;
    if (elD) elD.textContent = String(days);
  }
})();


