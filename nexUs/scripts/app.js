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
  doc,
  deleteDoc,
  updateDoc,
  getDocs,
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
  const dealForm = document.getElementById('dealForm');
  const contactsTbody = document.getElementById('contactsTbody');
  const dealsTbody = document.getElementById('dealsTbody');
  const contactsCount = document.getElementById('contactsCount');
  const dealsCount = document.getElementById('dealsCount');

  // Dashboard metrics
  const metricContacts = document.getElementById('metricContacts');
  const metricDeals = document.getElementById('metricDeals');
  const metricPipeline = document.getElementById('metricPipeline');
  const metricFriends = document.getElementById('metricFriends');
  const userAvatarBtn = document.getElementById('userAvatarBtn');
  const userDropdown = document.getElementById('userDropdown');
  const openNotifFromDropdown = document.getElementById('openNotifFromDropdown');
  const notifModal = document.getElementById('notifModal');
  const notifClose = document.getElementById('notifClose');
  const notifList = document.getElementById('notifList');
  const notifBadge = document.getElementById('notifBadge');

  let unsubContacts = null;
  let unsubDeals = null;
  let unsubProfile = null;
  let unsubChat = null;
  let unsubTraining = null;
  let unsubFriends = null;
  let unsubProfiles = null;
  let unsubDm = null;
  let currentDm = { friendId: null };
  let unsubNotifs = null;
  let unsubPendingFrom = null;
  async function markNotificationsRead() {
    const user = auth.currentUser; if (!user) return;
    try {
      const qn = query(collection(db, 'notifications'), where('to', '==', user.uid), where('read', '==', false));
      const snap = await getDocs(qn);
      const ops = [];
      snap.forEach((d) => ops.push(updateDoc(doc(db, 'notifications', d.id), { read: true })));
      await Promise.all(ops);
    } catch (e) { console.error('markNotificationsRead error', e); }
  }
  function openNotif() {
    if (!notifModal) return;
    notifModal.hidden = false; document.body.style.overflow = 'hidden';
    markNotificationsRead().then(() => { if (notifBadge) notifBadge.hidden = true; });
  }
  function closeNotif() {
    if (!notifModal) return; notifModal.hidden = true; document.body.style.overflow = '';
  }
  openNotifFromDropdown?.addEventListener('click', () => { closeUserDropdown(); openNotif(); });
  notifClose?.addEventListener('click', closeNotif);
  notifModal?.addEventListener('click', (e) => { const t = e.target; if (t instanceof HTMLElement && t.dataset.close === 'true') closeNotif(); });

  function toggleUserDropdown() {
    if (!userDropdown || !userAvatarBtn) return;
    const willOpen = userDropdown.hidden;
    userDropdown.hidden = !willOpen;
    userAvatarBtn.setAttribute('aria-expanded', String(willOpen));
  }
  function closeUserDropdown() { if (userDropdown && !userDropdown.hidden) { userDropdown.hidden = true; userAvatarBtn?.setAttribute('aria-expanded', 'false'); } }
  userAvatarBtn?.addEventListener('click', (e) => { e.stopPropagation(); toggleUserDropdown(); });
  document.addEventListener('click', (e) => {
    if (!userDropdown || userDropdown.hidden) return;
    const inside = e.target instanceof HTMLElement && (e.target.closest('#userDropdown') || e.target.closest('#userAvatarBtn'));
    if (!inside) closeUserDropdown();
  });
  const contactsMap = new Map();
  const dealsMap = new Map();

  onAuthStateChanged(auth, async (user) => {
    // unsubscribe previous listeners
    if (unsubContacts) { unsubContacts(); unsubContacts = null; }
    if (unsubDeals) { unsubDeals(); unsubDeals = null; }
    if (unsubProfile) { unsubProfile(); unsubProfile = null; }
    if (unsubChat) { unsubChat(); unsubChat = null; }
    if (!user) {
      clearList(contactsTbody);
      clearList(dealsTbody);
      setMetrics(0, 0, 0);
      setEligibility(null);
      if (chatMessages) chatMessages.innerHTML = '';
      conversation = [];
      if (unsubTraining) { unsubTraining(); unsubTraining = null; }
      if (unsubFriends) { unsubFriends(); unsubFriends = null; }
      if (unsubProfiles) { unsubProfiles(); unsubProfiles = null; }
      const friendsList = document.getElementById('friendsList'); if (friendsList) friendsList.innerHTML = '';
      const connectList = document.getElementById('connectList'); if (connectList) connectList.innerHTML = '';
      if (unsubDm) { unsubDm(); unsubDm = null; }
      if (unsubNotifs) { unsubNotifs(); unsubNotifs = null; }
      if (unsubPendingFrom) { unsubPendingFrom(); unsubPendingFrom = null; }
      currentDm = { friendId: null };
      const grid = document.getElementById('trainingGrid'); if (grid) grid.innerHTML = '';
      const cnt = document.getElementById('trainingCount'); if (cnt) cnt.textContent = '0/20';
      return;
    }
    // subscribe friends list (friends where owner == uid)
    try {
      const friendsList = document.getElementById('friendsList');
      const qf = query(collection(db, 'friends'), where('owner', '==', user.uid));
      unsubFriends = onSnapshot(qf, async (snap) => {
        if (friendsList) friendsList.innerHTML = '';
        const ids = [];
        snap.forEach(d => { const v = d.data(); if (v && v.friendId) ids.push(v.friendId); });
        if (metricFriends) metricFriends.textContent = String(ids.length);
        // map ids -> profiles
        for (const fid of ids) {
          const pdoc = await import('https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js').then(m => m.getDoc(m.doc(db, 'profiles', fid)));
          const pdata = pdoc.exists() ? pdoc.data() : {};
          const li = document.createElement('li');
          li.innerHTML = `<span style="display:flex; align-items:center; gap:0.5rem;"><img alt="" src="${escapeHtml(pdata.photoData || pdata.photoURL || '')}" style="width:28px;height:28px;border-radius:50%;object-fit:cover; border:1px solid var(--border);" onerror="this.style.display='none'"/><strong>${escapeHtml(pdata.displayName || pdata.company || 'Membro')}</strong></span>
          <span class="list-actions"><button class="btn btn-primary" data-action="open-dm" data-id="${fid}" data-name="${escapeHtml(pdata.displayName || pdata.company || 'Membro')}">Chat</button><a class="btn btn-ghost" href="profile-details.html?uid=${fid}">Ver</a><button class="btn btn-ghost" data-action="remove-friend" data-id="${fid}">Remover</button></span>`;
          friendsList && friendsList.appendChild(li);
        }
      });
    } catch (e) { console.error('friends subscribe error', e); }

    // subscribe connect list (all profiles except me)
    // subscribe notifications (friend requests + new messages)
    try {
      unsubNotifs = onSnapshot(query(collection(db, 'notifications'), where('to', '==', user.uid)), (snap) => {
        if (notifList) notifList.innerHTML = '';
        let unread = 0;
        snap.forEach((d) => {
          const n = d.data();
          if (!n.read) unread++;
          const li = document.createElement('li');
          if (n.type === 'friend_request') {
            li.innerHTML = `<span><strong>${escapeHtml(n.fromName || 'Alguém')}</strong> quer se conectar.</span>
            <span class="list-actions">
              <button class="btn btn-primary" data-action="notif-accept" data-id="${d.id}" data-from="${escapeHtml(n.from)}">Aceitar</button>
              <button class="btn btn-ghost" data-action="notif-decline" data-id="${d.id}">Recusar</button>
            </span>`;
          } else if (n.type === 'message') {
            li.innerHTML = `<span>Nova mensagem de <strong>${escapeHtml(n.fromName || 'Contato')}</strong></span>`;
          } else {
            li.textContent = n.text || 'Notificação';
          }
          notifList && notifList.appendChild(li);
        });
        if (notifBadge) { notifBadge.textContent = String(unread); notifBadge.hidden = unread <= 0; }
        const avatarBadge = document.getElementById('notifBadgeAvatar');
        if (avatarBadge) { avatarBadge.textContent = String(unread); avatarBadge.hidden = unread <= 0; }
      });
    } catch (e) { console.error('notifications subscribe error', e); }

    // subscribe pending friend-requests I sent (to live-refresh connect buttons)
    try {
      const qPendingFrom = query(collection(db, 'notifications'), where('from', '==', user.uid), where('type', '==', 'friend_request'));
      unsubPendingFrom = onSnapshot(qPendingFrom, () => { refreshConnectButtons(); });
    } catch (e) { console.error('pending-from subscribe error', e); }
    try {
      const connectList = document.getElementById('connectList');
      const qp = query(collection(db, 'profiles'));
      unsubProfiles = onSnapshot(qp, async (snap) => {
        if (connectList) connectList.innerHTML = '';
        // pending friend requests I sent
        const pendingTo = await getDocs(query(collection(db, 'notifications'), where('from', '==', user.uid), where('type', '==', 'friend_request')));
        const pendingIds = new Set(); pendingTo.forEach(d2 => { const v = d2.data(); if (v && v.to) pendingIds.add(String(v.to)); });
        // accepted friends
        const friendsSnap = await getDocs(query(collection(db, 'friends'), where('owner', '==', user.uid)));
        const friendIds = new Set(); friendsSnap.forEach(docu => { const v = docu.data(); if (v && v.friendId) friendIds.add(String(v.friendId)); });
        snap.forEach((d) => {
          if (d.id === user.uid) return;
          const v = d.data();
          const isFriend = friendIds.has(d.id);
          const isPending = pendingIds.has(d.id);
          const li = document.createElement('li');
          li.innerHTML = `<span style=\"display:flex; align-items:center; gap:0.5rem;\"><img alt=\"\" src=\"${escapeHtml(v.photoData || v.photoURL || '')}\" style=\"width:28px;height:28px;border-radius:50%;object-fit:cover; border:1px solid var(--border);\" onerror=\"this.style.display='none'\"/><strong>${escapeHtml(v.displayName || v.company || 'Membro')}</strong></span>
          <span class=\"list-actions\"><a class=\"btn btn-ghost\" href=\"profile-details.html?uid=${d.id}\">Ver</a><button class=\"btn ${isFriend ? 'btn-outline' : (isPending ? 'btn-outline' : 'btn-primary')}\" data-action=\"add-friend\" data-id=\"${d.id}\" ${isFriend ? 'disabled' : (isPending ? 'disabled' : '')}>${isFriend ? 'Conectado' : (isPending ? 'Solicitação enviada' : 'Conectar')}</button></span>`;
          connectList && connectList.appendChild(li);
        });
      });
    } catch (e) { console.error('profiles subscribe error', e); }
    // subscribe contacts
    unsubContacts = bindList(
      collection(db, 'contacts'),
      [where('uid', '==', user.uid)],
      contactsTbody,
      (item) => {
        contactsMap.set(item.id, item);
        return renderContactItem(item);
      },
      (items) => {
        setMetrics(items.length, null, null);
        if (contactsCount) contactsCount.textContent = String(items.length);
      }
    );
    // subscribe deals
    unsubDeals = bindList(
      collection(db, 'deals'),
      [where('uid', '==', user.uid)],
      dealsTbody,
      (item) => {
        dealsMap.set(item.id, item);
        return renderDealItem(item);
      },
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

    // subscribe chat messages (chatMessages/{uid}/messages)
    try {
      const msgsQ = query(collection(db, 'chatMessages', user.uid, 'messages'), orderBy('createdAt', 'asc'));
      unsubChat = onSnapshot(msgsQ, (snap) => {
        if (chatMessages) chatMessages.innerHTML = '';
        conversation = [];
        snap.forEach((d) => {
          const m = d.data();
          const when = m?.createdAt?.seconds ? new Date(m.createdAt.seconds * 1000) : new Date();
          appendMsg(m.role, m.content, when);
        });
      });
    } catch (e) {
      console.error('chat subscribe error', e);
    }

    // subscribe training videos (training/{uid}/videos)
    try {
      const vidsQ = query(collection(db, 'training', user.uid, 'videos'), orderBy('createdAt', 'desc'));
      const grid = document.getElementById('trainingGrid');
      const cnt = document.getElementById('trainingCount');
      unsubTraining = onSnapshot(vidsQ, (snap) => {
        if (grid) grid.innerHTML = '';
        let n = 0;
        snap.forEach((d) => {
          const v = d.data(); n++;
          const id = v?.id || '';
          const cell = document.createElement('div');
          cell.innerHTML = `
            <div class="video-embed xs">
              <iframe src="https://www.youtube.com/embed/${escapeHtml(id)}" title="Vídeo salvo" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
            </div>
            <div class="list-actions" style="margin-top:0.35rem;">
              <button class="btn btn-ghost" data-action="del-video" data-id="${d.id}">Remover</button>
            </div>`;
          grid && grid.appendChild(cell);
        });
        cnt && (cnt.textContent = `${n}/20`);
      });
    } catch (e) { console.error('training subscribe error', e); }
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
      // client-side sort by createdAt desc when available
      items.sort((a, b) => {
        const as = a?.createdAt?.seconds || 0;
        const bs = b?.createdAt?.seconds || 0;
        return bs - as;
      });
      items.forEach((item) => listEl?.appendChild(renderItem(item)));
      onUpdate && onUpdate(items);
    }, (err) => {
      // Show minimal error in UI list
      clearList(listEl);
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 4;
      td.textContent = 'Erro ao carregar dados. Verifique regras/índices.';
      tr.appendChild(td);
      listEl?.appendChild(tr);
      console.error('bindList error', err);
    });
  }

  function renderContactItem(item) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${escapeHtml(item.name)}</td>
    <td>${escapeHtml(item.email)}</td>
    <td>
      <span class="list-actions">
        <button class="btn btn-ghost" data-action="view" data-type="contact" data-id="${item.id}">Ver</button>
        <button class="btn btn-ghost" data-action="delete" data-type="contact" data-id="${item.id}">Excluir</button>
      </span>
    </td>`;
    return tr;
  }

  function renderDealItem(item) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${escapeHtml(item.title)}</td>
    <td>R$ ${Number(item.value || 0).toLocaleString('pt-BR')}</td>
    <td>${escapeHtml(item.status || 'open')}</td>
    <td>
      <span class="list-actions">
        <button class="btn btn-ghost" data-action="view" data-type="deal" data-id="${item.id}">Ver</button>
        <button class="btn btn-ghost" data-action="delete" data-type="deal" data-id="${item.id}">Excluir</button>
      </span>
    </td>`;
    return tr;
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

  // Refresh connect buttons state based on current friends (AJAX-like update)
  async function refreshConnectButtons() {
    try {
      const user = auth.currentUser; if (!user) return;
      const connectList = document.getElementById('connectList'); if (!connectList) return;
      const friendsSnap = await getDocs(query(collection(db, 'friends'), where('owner', '==', user.uid)));
      const friendIds = new Set();
      friendsSnap.forEach(d => { const v = d.data(); if (v && v.friendId) friendIds.add(String(v.friendId)); });
      const buttons = connectList.querySelectorAll('button[data-action="add-friend"][data-id]');
      buttons.forEach((btn) => {
        if (!(btn instanceof HTMLButtonElement)) return;
        const id = btn.getAttribute('data-id') || '';
        const isFriend = friendIds.has(id);
        btn.textContent = isFriend ? 'Conectado' : 'Conectar';
        btn.classList.toggle('btn-primary', !isFriend);
        btn.classList.toggle('btn-outline', isFriend);
        btn.disabled = isFriend;
      });
    } catch (e) { console.error('refreshConnectButtons error', e); }
  }

  function clearList(listEl) { if (listEl) listEl.innerHTML = ''; }
  function escapeHtml(s) { return String(s).replace(/[&<>"]+/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

  // Minimal Markdown renderer (safe): supports paragraphs, lists, **bold**, `code`, ```code blocks```
  function renderMarkdownToHtml(text) {
    if (!text) return '';
    const lines = String(text).split(/\r?\n/);
    let html = '';
    let inList = false;
    let inCode = false;
    let codeBuffer = [];

    function closeList() { if (inList) { html += '</ul>'; inList = false; } }
    function openList() { if (!inList) { html += '<ul>'; inList = true; } }
    function closeCode() {
      if (inCode) {
        const code = escapeHtml(codeBuffer.join('\n'));
        html += `<pre class="md-code"><code>${code}</code></pre>`;
        codeBuffer = []; inCode = false;
      }
    }
    function renderInline(md) {
      let s = escapeHtml(md);
      // inline code first
      s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
      // bold variations: **text**, ** text **, __text__
      s = s.replace(/\*\*\s*([^*][^]*?)\s*\*\*/g, '<strong>$1</strong>');
      s = s.replace(/__\s*([^_][^]*?)\s*__/g, '<strong>$1</strong>');
      // italics _text_ (avoid already-bold with __)
      s = s.replace(/(^|[^_])_(.+?)_(?!_)/g, (m, pre, t) => pre + '<em>' + t + '</em>');
      return s;
    }

    for (const raw of lines) {
      const line = raw.replace(/\t/g, '    ');
      // fenced code blocks
      if (/^\s*```/.test(line)) { if (inCode) { closeCode(); } else { closeList(); inCode = true; codeBuffer = []; } continue; }
      if (inCode) { codeBuffer.push(raw); continue; }

      // lists (- or *)
      const liMatch = line.match(/^\s*([*-])\s+(.*)$/);
      if (liMatch) {
        openList();
        html += `<li>${renderInline(liMatch[2])}</li>`;
        continue;
      }
      // blank line closes list
      if (!line.trim()) { closeList(); html += ''; continue; }

      // paragraph
      closeList();
      html += `<p>${renderInline(line)}</p>`;
    }
    closeList(); closeCode();
    return html;
  }

  // Retry helper for 429/5xx
  function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
  async function fetchWithRetry(url, options, attempts = 3, initialDelayMs = 800) {
    let delay = initialDelayMs;
    for (let i = 0; i < attempts; i++) {
      const res = await fetch(url, options);
      if (res.status !== 429 && res.status < 500) return res;
      if (i < attempts - 1) {
        await sleep(delay + Math.floor(Math.random() * 150));
        delay *= 2;
        continue;
      }
      return res;
    }
  }

  // AI planner
  const aiPlanForm = document.getElementById('aiPlanForm');
  const aiPlanOutput = document.getElementById('aiPlanOutput');
  const openaiKeyInput = document.getElementById('openaiKey');
  const aiProviderSelect = document.getElementById('aiProvider');
  const saveKeyBtn = document.getElementById('saveOpenaiKeyBtn');
  const openaiKeyNote = document.getElementById('openaiKeyNote');
  // Chat (members.html)
  const chatForm = document.getElementById('chatForm');
  const chatInput = document.getElementById('chatInput');
  const chatMessages = document.getElementById('chatMessages');
  const clearChatBtn = document.getElementById('clearChatBtn');
  let conversation = [];

  const OPENAI_KEY_K = 'nexus.ai.key';
  const AI_PROVIDER_K = 'nexus.ai.provider';
  // load local config (for dev/defaults)
  try {
    const cfg = window && window.NEXUS_LOCAL_CONFIG;
    if (cfg && cfg.aiKey && !localStorage.getItem(OPENAI_KEY_K)) {
      localStorage.setItem(OPENAI_KEY_K, cfg.aiKey);
    }
    if (cfg && cfg.aiProvider && !localStorage.getItem(AI_PROVIDER_K)) {
      localStorage.setItem(AI_PROVIDER_K, cfg.aiProvider);
    }
  } catch {}
  // load key mask
  const savedKey = localStorage.getItem(OPENAI_KEY_K);
  if (savedKey && openaiKeyInput) openaiKeyInput.value = savedKey.replace(/.(?=.{4})/g, '•');
  const savedProvider = localStorage.getItem(AI_PROVIDER_K) || 'abacus';
  if (aiProviderSelect) aiProviderSelect.value = savedProvider;

  // Default keys by provider (Abacus default filled internally)
  const DEFAULT_KEYS = { abacus: 's2_6e34aaed3d434e1db28c078b43b64082', openai: '' };
  function getApiKey(prov) {
    try {
      const cfg = window && window.NEXUS_LOCAL_CONFIG;
      if (cfg) {
        if (prov === 'abacus') return cfg.aiKey || DEFAULT_KEYS.abacus;
        if (prov === 'openai') return cfg.openaiKey || localStorage.getItem(OPENAI_KEY_K) || DEFAULT_KEYS.openai;
      }
    } catch {}
    if (prov === 'abacus') return localStorage.getItem(OPENAI_KEY_K) || DEFAULT_KEYS.abacus;
    return localStorage.getItem(OPENAI_KEY_K) || DEFAULT_KEYS.openai;
  }

  aiProviderSelect?.addEventListener('change', () => {
    const prov = aiProviderSelect.value;
    localStorage.setItem(AI_PROVIDER_K, prov);
  });

  saveKeyBtn?.addEventListener('click', () => {
    if (!(openaiKeyInput instanceof HTMLInputElement)) return;
    const v = openaiKeyInput.value.trim();
    const prov = aiProviderSelect && aiProviderSelect.value || 'abacus';
    if (!v) { openaiKeyNote && (openaiKeyNote.textContent = 'Cole sua API Key.'); return; }
    localStorage.setItem(OPENAI_KEY_K, v);
    localStorage.setItem(AI_PROVIDER_K, prov);
    openaiKeyNote && (openaiKeyNote.textContent = 'Chave salva apenas neste navegador.');
    openaiKeyInput.value = v.replace(/.(?=.{4})/g, '•');
  });

  clearChatBtn?.addEventListener('click', async () => {
    const user = auth.currentUser;
    if (!user) { if (chatMessages) chatMessages.innerHTML = ''; conversation = []; return; }
    try {
      const msgsCol = collection(db, 'chatMessages', user.uid, 'messages');
      const snap = await getDocs(msgsCol);
      const ops = [];
      snap.forEach((d) => { ops.push(deleteDoc(doc(db, 'chatMessages', user.uid, 'messages', d.id))); });
      await Promise.all(ops);
    } catch {}
    if (chatMessages) chatMessages.innerHTML = '';
    conversation = [];
  });

  // CRM actions (view/delete)
  contactsTbody?.addEventListener('click', async (e) => {
    const btn = e.target instanceof HTMLElement ? e.target.closest('button[data-action]') : null;
    if (!btn) return;
    const action = btn.getAttribute('data-action');
    const id = btn.getAttribute('data-id');
    if (!id) return;
    if (action === 'view') openCrmModal('contact', contactsMap.get(id));
    if (action === 'delete') await deleteDoc(doc(db, 'contacts', id));
  });

  // Training: add/remove videos
  const trainingForm = document.getElementById('trainingForm');
  const trainingUrl = document.getElementById('trainingUrl');
  const trainingGrid = document.getElementById('trainingGrid');
  function parseYouTubeId(input) {
    const s = String(input || '').trim();
    // direct id
    if (/^[a-zA-Z0-9_-]{11}$/.test(s)) return s;
    // youtu.be/ID
    const m1 = s.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    if (m1) return m1[1];
    // youtube.com/watch?v=ID
    const m2 = s.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
    if (m2) return m2[1];
    // embed/ID
    const m3 = s.match(/embed\/([a-zA-Z0-9_-]{11})/);
    if (m3) return m3[1];
    return '';
  }
  trainingForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = auth.currentUser; if (!user) return;
    const id = parseYouTubeId(trainingUrl && trainingUrl.value);
    if (!id) { alert('URL ou ID inválido.'); return; }
    try {
      // enforce limit 20
      const vidsCol = collection(db, 'training', user.uid, 'videos');
      const snap = await getDocs(vidsCol);
      if (snap.size >= 20) { alert('Limite de 20 vídeos atingido.'); return; }
      await addDoc(vidsCol, { id, createdAt: serverTimestamp(), uid: user.uid });
      trainingUrl && (trainingUrl.value = '');
    } catch (err) { console.error('add video error', err); alert('Erro ao salvar vídeo.'); }
  });
  trainingGrid?.addEventListener('click', async (e) => {
    const btn = e.target instanceof HTMLElement ? e.target.closest('button[data-action="del-video"]') : null;
    if (!btn) return;
    const user = auth.currentUser; if (!user) return;
    const id = btn.getAttribute('data-id'); if (!id) return;
    try {
      await deleteDoc(doc(db, 'training', user.uid, 'videos', id));
    } catch (err) { console.error('delete video error', err); alert('Erro ao remover.'); }
  });

  // --- AI Chat (members.html) ---
  chatForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) { appendMsg('system', 'Você precisa estar logado.'); return; }
    const text = chatInput && chatInput.value ? String(chatInput.value).trim() : '';
    if (!text) return;
    appendMsg('user', text);
    chatInput && (chatInput.value = '');
    const submitBtn = chatForm.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;
    try {
      if (aiPlannerEndpoint) {
        const res = await fetchWithRetry(aiPlannerEndpoint, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ goal: text, uid: user.uid })
        });
        if (!res.ok) throw new Error(`Falha na IA (${res.status})`);
        const json = await res.json();
        await persistChat('user', text);
        const ans = json.plan || JSON.stringify(json, null, 2);
        await persistChat('assistant', ans);
        appendMsg('assistant', ans);
      } else {
        const prov = (aiProviderSelect && aiProviderSelect.value) || localStorage.getItem(AI_PROVIDER_K) || 'abacus';
        const k = getApiKey(prov);
        if (!k) { appendMsg('system', 'Configure a chave do provedor selecionado.'); return; }
        if (prov === 'abacus') {
          const res = await fetchWithRetry('https://routellm.abacus.ai/v1/chat/completions', {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${k}` },
            body: JSON.stringify({ model: 'route-llm', messages: buildMessages(text), stream: false })
          });
          if (!res.ok) throw new Error(`Falha na IA (${res.status})`);
          const j = await res.json();
          const plan = j.response || j.output_text || j.text || (j.choices && j.choices[0] && (j.choices[0].message?.content || j.choices[0].delta?.content)) || 'Sem resposta.';
          await persistChat('user', text);
          await persistChat('assistant', plan);
          appendMsg('assistant', plan);
        } else {
          const k2 = k; // openai key
          const res = await fetchWithRetry('https://api.openai.com/v1/chat/completions', {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${k2}` },
            body: JSON.stringify({ model: 'gpt-4o-mini', messages: buildMessages(text), temperature: 0.3, max_tokens: 800 })
          });
          if (!res.ok) throw new Error(`Falha na IA (${res.status})`);
          const j = await res.json();
          const plan = j.choices?.[0]?.message?.content || 'Sem resposta.';
          await persistChat('user', text);
          await persistChat('assistant', plan);
          appendMsg('assistant', plan);
        }
      }
    } catch (err) {
      appendMsg('system', 'Erro ao gerar resposta. ' + (err && err.message ? err.message : ''));
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });

  function appendMsg(role, content, when = new Date()) {
    if (!chatMessages) return;
    const wrap = document.createElement('div'); wrap.className = 'msg ' + role;
    const who = document.createElement('div'); who.className = 'role'; who.textContent = role === 'user' ? 'Você' : (role === 'assistant' ? 'Assistente' : 'Sistema');
    const bubble = document.createElement('div'); bubble.className = 'bubble';
    if (role === 'assistant' || role === 'system') {
      bubble.innerHTML = renderMarkdownToHtml(content);
    } else {
      bubble.textContent = content;
    }
    const time = document.createElement('div'); time.className = 'time'; time.textContent = when.toLocaleString('pt-BR');
    wrap.appendChild(who); wrap.appendChild(bubble); wrap.appendChild(time);
    chatMessages.appendChild(wrap);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    conversation.push({ role, content }); if (conversation.length > 20) conversation.shift();
  }

  function buildMessages(userInput) {
    const system = { role: 'system', content: 'Você é um assistente de planejamento estratégico para pequenos negócios.' };
    const history = conversation.filter(m => m.role !== 'system').slice(-6);
    return [system, ...history, { role: 'user', content: userInput }];
  }

  async function persistChat(role, content) {
    const user = auth.currentUser;
    if (!user) return;
    const col = collection(db, 'chatMessages', user.uid, 'messages');
    await addDoc(col, { role, content, createdAt: serverTimestamp() });
  }
  dealsTbody?.addEventListener('click', async (e) => {
    const btn = e.target instanceof HTMLElement ? e.target.closest('button[data-action]') : null;
    if (!btn) return;
    const action = btn.getAttribute('data-action');
    const id = btn.getAttribute('data-id');
    if (!id) return;
    if (action === 'view') openCrmModal('deal', dealsMap.get(id));
    if (action === 'delete') await deleteDoc(doc(db, 'deals', id));
  });

  // Friends/connect actions
  document.addEventListener('click', async (e) => {
    const btn = e.target instanceof HTMLElement ? e.target.closest('button[data-action]') : null;
    if (!btn) return;
    const action = btn.getAttribute('data-action');
    const id = btn.getAttribute('data-id');
    const user = auth.currentUser;
    if (!user || !action) return;
    try {
      if (action === 'add-friend') {
        // send friend request notification to target user
        const prof = await getDocs(query(collection(db, 'profiles'), where('__name__', '==', user.uid)));
        let fromName = 'Membro'; prof.forEach(d => { const v = d.data(); if (v && v.displayName) fromName = v.displayName; });
        await addDoc(collection(db, 'notifications'), { type: 'friend_request', from: user.uid, fromName, to: id, createdAt: serverTimestamp(), read: false });
        btn.textContent = 'Solicitado'; btn.setAttribute('disabled', 'true');
        await refreshConnectButtons();
      }
      if (action === 'remove-friend') {
        // remove both directions
        const qfA = query(collection(db, 'friends'), where('owner', '==', user.uid), where('friendId', '==', id));
        const qfB = query(collection(db, 'friends'), where('owner', '==', id), where('friendId', '==', user.uid));
        const [snapA, snapB] = await Promise.all([getDocs(qfA), getDocs(qfB)]);
        const ops = [];
        snapA.forEach((d) => ops.push(deleteDoc(doc(db, 'friends', d.id))));
        snapB.forEach((d) => ops.push(deleteDoc(doc(db, 'friends', d.id))));
        await Promise.all(ops);
        await refreshConnectButtons();
      }
      if (action === 'open-dm' && id) {
        openDm(id, btn.getAttribute('data-name') || '');
      }
      if (action === 'notif-accept' && id) {
        const from = btn.getAttribute('data-from') || '';
        if (from) {
          // create friendship both ways so ambos se veem como amigos
          await Promise.all([
            addDoc(collection(db, 'friends'), { owner: user.uid, friendId: from, createdAt: serverTimestamp() }),
            addDoc(collection(db, 'friends'), { owner: from, friendId: user.uid, createdAt: serverTimestamp() })
          ]);
        }
        await deleteDoc(doc(db, 'notifications', id));
        await refreshConnectButtons();
      }
      if (action === 'notif-decline' && id) {
        await deleteDoc(doc(db, 'notifications', id));
        await refreshConnectButtons();
      }
    } catch (err) {
      console.error('friend action error', err);
      alert('Erro ao processar.');
    }
  });

  // --- Mini DM chat ---
  const dmModal = document.getElementById('dmModal');
  const dmClose = document.getElementById('dmClose');
  const dmTitle = document.getElementById('dmTitle');
  const dmSubtitle = document.getElementById('dmSubtitle');
  const dmMessages = document.getElementById('dmMessages');
  const dmInput = document.getElementById('dmInput');
  const dmSend = document.getElementById('dmSend');
  const dmEditingId = document.getElementById('dmEditingId');
  const dmNote = document.getElementById('dmNote');
  const dmEmoji = document.getElementById('dmEmoji');
  const dmEmojiPanel = document.getElementById('dmEmojiPanel');

  function openDm(friendId, friendName) {
    const user = auth.currentUser; if (!user || !dmModal) return;
    currentDm.friendId = friendId;
    if (dmTitle) dmTitle.textContent = 'Chat';
    if (dmSubtitle) dmSubtitle.textContent = friendName ? `Conversando com ${friendName}` : '';
    dmModal.hidden = false; document.body.style.overflow = 'hidden';
    bindDm(user.uid, friendId);
  }
  function closeDm() {
    if (dmModal) dmModal.hidden = true;
    document.body.style.overflow = '';
    if (unsubDm) { unsubDm(); unsubDm = null; }
    if (dmMessages) dmMessages.innerHTML = '';
    if (dmInput) dmInput.value = '';
    if (dmEditingId) dmEditingId.value = '';
  }
  dmClose?.addEventListener('click', closeDm);
  dmModal?.addEventListener('click', (e) => { const t = e.target; if (t instanceof HTMLElement && t.dataset.close === 'true') closeDm(); });

  // Emoji picker (simple)
  dmEmoji?.addEventListener('click', () => {
    if (!dmEmojiPanel) return;
    dmEmojiPanel.hidden = !dmEmojiPanel.hidden;
  });
  dmEmojiPanel?.addEventListener('click', (e) => {
    const btn = e.target instanceof HTMLElement ? e.target.closest('button.emoji') : null;
    if (!btn) return;
    if (dmInput) {
      dmInput.value = (dmInput.value || '') + btn.textContent;
      dmInput.focus();
    }
  });

  function renderDmItem(did, msg) {
    const wrap = document.createElement('div');
    wrap.className = 'msg';
    const who = document.createElement('div'); who.className = 'role'; who.textContent = msg.uid === auth.currentUser?.uid ? 'Você' : 'Amigo';
    const bubble = document.createElement('div'); bubble.className = 'bubble';
    const isDeleted = !!msg.deleted;
    bubble.textContent = isDeleted ? 'Esta mensagem foi excluida' : (msg.text || '');
    if (isDeleted) bubble.classList.add('deleted');
    const time = document.createElement('div'); time.className = 'time';
    time.textContent = msg.updatedAt?.seconds ? new Date(msg.updatedAt.seconds * 1000).toLocaleString('pt-BR') : new Date().toLocaleString('pt-BR');
    const actions = document.createElement('div'); actions.className = 'list-actions';
    if (msg.uid === auth.currentUser?.uid && !isDeleted) {
      const editBtn = document.createElement('button'); editBtn.className = 'btn btn-ghost'; editBtn.setAttribute('aria-label', 'Editar'); editBtn.textContent = '✏️';
      editBtn.addEventListener('click', () => { if (dmInput) dmInput.value = msg.text || ''; if (dmEditingId) dmEditingId.value = did; dmInput && dmInput.focus(); });
      const delBtn = document.createElement('button'); delBtn.className = 'btn btn-ghost'; delBtn.setAttribute('aria-label', 'Excluir'); delBtn.textContent = '🗑️';
      delBtn.addEventListener('click', async () => {
        try {
          await updateDoc(doc(db, 'directMessages', did), { text: 'Esta mensagem foi excluida', deleted: true, updatedAt: serverTimestamp() });
        } catch (e) { console.error('dm delete error', e); dmNote && (dmNote.textContent = 'Erro ao excluir.'); }
      });
      actions.appendChild(editBtn);
      actions.appendChild(delBtn);
    }
    wrap.appendChild(who); wrap.appendChild(bubble); wrap.appendChild(time); wrap.appendChild(actions);
    return wrap;
  }

  function bindDm(ownerId, friendId) {
    const col = collection(db, 'directMessages');
    // Stream both sides independently and merge on update
    const qA = query(col, where('owner', '==', ownerId), where('friendId', '==', friendId));
    const qB = query(col, where('owner', '==', friendId), where('friendId', '==', ownerId));
    let items = new Map();
    const renderAll = () => {
      if (dmMessages) dmMessages.innerHTML = '';
      const arr = Array.from(items.values()).sort((a,b) => (a.updatedAt?.seconds || 0) - (b.updatedAt?.seconds || 0));
      arr.forEach((m) => dmMessages && dmMessages.appendChild(renderDmItem(m.id, m)));
      if (dmMessages) dmMessages.scrollTop = dmMessages.scrollHeight;
    };
    const unsubA = onSnapshot(qA, (snap) => {
      snap.docChanges().forEach((ch) => {
        const m = { id: ch.doc.id, ...ch.doc.data() };
        if (ch.type === 'removed') items.delete(m.id); else items.set(m.id, m);
      });
      renderAll();
    });
    const unsubB = onSnapshot(qB, (snap) => {
      snap.docChanges().forEach((ch) => {
        const m = { id: ch.doc.id, ...ch.doc.data() };
        if (ch.type === 'removed') items.delete(m.id); else items.set(m.id, m);
      });
      renderAll();
    });
    unsubDm = () => { unsubA(); unsubB(); };
  }

  dmSend?.addEventListener('click', async () => {
    const user = auth.currentUser; if (!user) return;
    const text = dmInput && dmInput.value ? String(dmInput.value).trim() : '';
    if (!text) return;
    const isEditing = dmEditingId && dmEditingId.value;
    try {
      if (isEditing) {
        await updateDoc(doc(db, 'directMessages', dmEditingId.value), { text, updatedAt: serverTimestamp() });
        dmEditingId.value = '';
      } else {
        await addDoc(collection(db, 'directMessages'), { owner: user.uid, friendId: currentDm.friendId, uid: user.uid, text, updatedAt: serverTimestamp() });
        // notify receiver about new message
        try {
          const prof = await getDocs(query(collection(db, 'profiles'), where('__name__', '==', user.uid)));
          let fromName = 'Membro'; prof.forEach(d => { const v = d.data(); if (v && v.displayName) fromName = v.displayName; });
          await addDoc(collection(db, 'notifications'), { type: 'message', from: user.uid, fromName, to: currentDm.friendId, createdAt: serverTimestamp(), read: false });
        } catch {}
      }
      if (dmInput) dmInput.value = '';
    } catch (e) { console.error('dm send error', e); dmNote && (dmNote.textContent = 'Erro ao enviar.'); }
  });

  // CRM Modal
  const crmModal = document.getElementById('crmModal');
  const crmClose = document.getElementById('crmClose');
  const crmType = document.getElementById('crmType');
  const crmContact = document.getElementById('crmContact');
  const crmDeal = document.getElementById('crmDeal');
  const crmForm = document.getElementById('crmForm');
  let currentCrm = { type: null, id: null };

  function openCrmModal(type, item) {
    if (!crmModal) return;
    currentCrm = { type, id: item?.id || null };
    crmType && (crmType.textContent = type === 'contact' ? 'Contato' : 'Negociação');
    if (type === 'contact') {
      crmContact && (crmContact.hidden = false);
      crmDeal && (crmDeal.hidden = true);
      const name = document.getElementById('crmName');
      const email = document.getElementById('crmEmail');
      if (name) name.value = item?.name || '';
      if (email) email.value = item?.email || '';
    } else {
      crmContact && (crmContact.hidden = true);
      crmDeal && (crmDeal.hidden = false);
      const title = document.getElementById('crmTitle');
      const value = document.getElementById('crmValue');
      const status = document.getElementById('crmStatus');
      if (title) title.value = item?.title || '';
      if (value) value.value = item?.value || 0;
      if (status) status.value = item?.status || 'open';
    }
    crmModal.hidden = false;
    document.body.style.overflow = 'hidden';
  }
  function closeCrmModal() {
    if (!crmModal) return;
    crmModal.hidden = true;
    document.body.style.overflow = '';
  }
  crmClose?.addEventListener('click', closeCrmModal);
  crmModal?.addEventListener('click', (e) => {
    const t = e.target;
    if (t instanceof HTMLElement && t.dataset.close === 'true') closeCrmModal();
  });
  crmForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user || !currentCrm.id) return;
    if (currentCrm.type === 'contact') {
      const name = document.getElementById('crmName');
      const email = document.getElementById('crmEmail');
      await updateDoc(doc(db, 'contacts', currentCrm.id), {
        name: name && name.value || '',
        email: email && email.value || ''
      });
    } else {
      const title = document.getElementById('crmTitle');
      const value = document.getElementById('crmValue');
      const status = document.getElementById('crmStatus');
      await updateDoc(doc(db, 'deals', currentCrm.id), {
        title: title && title.value || '',
        value: Number((value && value.value) || 0),
        status: status && status.value || 'open'
      });
    }
    closeCrmModal();
  });
  aiPlanForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) { aiPlanOutput && (aiPlanOutput.textContent = 'Você precisa estar logado.'); return; }
    const data = new FormData(aiPlanForm);
    const goal = String(data.get('goal') || '').trim();
    if (!goal) return;
    aiPlanOutput.textContent = 'Gerando plano...';
    const submitBtn = aiPlanForm.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;
    try {
      if (aiPlannerEndpoint) {
        const res = await fetchWithRetry(aiPlannerEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ goal, uid: user.uid })
        }, 3, 800);
        if (!res.ok) {
          const errText = await res.text().catch(() => '');
          throw new Error(`Falha na IA (${res.status}) ${errText || ''}`);
        }
        const json = await res.json();
        aiPlanOutput.textContent = json.plan || JSON.stringify(json, null, 2);
      } else {
        const k = localStorage.getItem(OPENAI_KEY_K) || '';
        const prov = localStorage.getItem(AI_PROVIDER_K) || 'abacus';
        if (!k) { aiPlanOutput.textContent = 'Cole e salve sua API Key acima.'; return; }
        if (prov === 'abacus') {
          const res = await fetchWithRetry('https://routellm.abacus.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${k}`
            },
            body: JSON.stringify({
              model: 'route-llm',
              messages: [
                { role: 'system', content: 'Você é um assistente de planejamento estratégico para pequenos negócios.' },
                { role: 'user', content: `Crie um plano de ação claro e prático com checklist, metas (SMART), KPIs e próximos passos para: ${goal}` }
              ],
              stream: false
            })
          }, 3, 800);
          if (!res.ok) {
            const errText = await res.text().catch(() => '');
            throw new Error(`Falha na IA (${res.status}) ${errText || ''}`);
          }
          const j = await res.json();
          const plan = (j && (
            j.response ||
            (j.choices && j.choices[0] && (j.choices[0].message?.content || j.choices[0].delta?.content)) ||
            j.output_text || j.text
          )) || 'Sem resposta.';
          aiPlanOutput.textContent = plan;
        } else {
          // OpenAI fallback (direct)
          const res = await fetchWithRetry('https://api.openai.com/v1/chat/completions', {
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
              temperature: 0.3,
              max_tokens: 800
            })
          }, 3, 800);
          if (!res.ok) {
            const errText = await res.text().catch(() => '');
            throw new Error(`Falha na IA (${res.status}) ${errText || ''}`);
          }
          const j = await res.json();
          const plan = j.choices?.[0]?.message?.content || 'Sem resposta.';
          aiPlanOutput.textContent = plan;
        }
      }
    } catch (e2) {
      aiPlanOutput.textContent = 'Erro ao gerar plano. ' + (e2 && e2.message ? e2.message : '');
      if (String(e2 && e2.message || '').includes('429')) {
        aiPlanOutput.textContent += '\nDica: Aguarde um pouco e tente novamente. Verifique limites/uso da sua conta OpenAI.';
      }
    }
    finally { if (submitBtn) submitBtn.disabled = false; }
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


