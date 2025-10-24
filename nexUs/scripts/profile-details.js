import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, getDoc, serverTimestamp, onSnapshot } from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js';

(function(){
  'use strict';
  const DEFAULT_AVATAR = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><rect width="128" height="128" fill="%23e5e7eb"/><circle cx="64" cy="48" r="24" fill="%239ca3af"/><rect x="24" y="80" width="80" height="32" rx="16" fill="%239ca3af"/></svg>';
  const params = new URLSearchParams(location.search);
  const uid = params.get('uid');
  // Ensure required elements exist and are block-level when visible
  function show(el, show) { if (!el) return; el.hidden = !show; el.style.display = show ? '' : 'none'; }
  const el = (id) => document.getElementById(id);

  async function load(uid) {
    if (!uid) return;
    try {
      const p = await getDoc(doc(db, 'profiles', uid));
      const c = await getDoc(doc(db, 'companies', uid));
      const pdata = p.exists() ? p.data() : {};
      const cdata = c.exists() ? c.data() : {};
      const avatar = el('pdAvatar'); if (avatar instanceof HTMLImageElement) avatar.src = pdata.photoData || pdata.photoURL || DEFAULT_AVATAR;
      const name = el('pdName'); if (name) name.textContent = pdata.displayName || 'Membro';
      const company = el('pdCompany'); if (company) company.textContent = pdata.company || cdata.company || '—';
      const bio = el('pdBio'); if (bio) bio.textContent = pdata.bio || '—';
      const site = el('pdSiteLink'); if (site instanceof HTMLAnchorElement) { const s = pdata.site || cdata.site || ''; site.textContent = s || '—'; site.href = s || '#'; }
      const type = el('pdType'); if (type) type.textContent = cdata.type || '—';
      const rev = el('pdRevenue'); if (rev) rev.textContent = cdata.revenue != null ? `R$ ${Number(cdata.revenue).toLocaleString('pt-BR')}` : '—';
      const st = el('pdStartedAt'); if (st) st.textContent = cdata.startedAt || '—';
      const cnpj = el('pdCnpj'); if (cnpj) cnpj.textContent = cdata.cnpj || '—';
    } catch (err) {
      console.error('profile details load error', err);
    }
  }

  onAuthStateChanged(auth, async (user) => {
    if (!user) { location.replace('index.html?auth=1'); return; }
    await load(uid);
    // Setup connect/remove buttons
    const btnConnect = document.getElementById('pdConnect');
    const btnRemove = document.getElementById('pdRemove');
    // Hide actions on own profile
    if (uid === user.uid) { if (btnConnect) btnConnect.hidden = true; if (btnRemove) btnRemove.hidden = true; return; }
    try {
      const qf = query(collection(db, 'friends'), where('owner', '==', user.uid), where('friendId', '==', uid));
      // Initial state + live updates
      onSnapshot(qf, (snap) => {
        const isFriend = !snap.empty;
        show(btnConnect, !isFriend);
        show(btnRemove, isFriend);
      });
      btnConnect?.addEventListener('click', async () => {
        try {
          await addDoc(collection(db, 'friends'), { owner: user.uid, friendId: uid, createdAt: serverTimestamp() });
        } catch (e) { console.error('connect error', e); alert('Erro ao conectar.'); }
      });
      btnRemove?.addEventListener('click', async () => {
        try {
          const snap2 = await getDocs(qf);
          const ops = []; snap2.forEach((d) => ops.push(deleteDoc(doc(db, 'friends', d.id))));
          await Promise.all(ops);
        } catch (e) { console.error('remove error', e); alert('Erro ao remover.'); }
      });
    } catch (e) { console.error('friend state error', e); }
  });
})();


