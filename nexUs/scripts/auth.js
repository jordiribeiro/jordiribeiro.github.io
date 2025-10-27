// Auth module using Firebase Web SDK (ESM) — works on GitHub Pages
// Steps: add your Firebase config in scripts/firebase-config.js

import { app, auth, db } from './firebase-config.js';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, updateDoc, getDocs, setDoc, getDoc } from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js';
import {
  browserLocalPersistence,
  setPersistence,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js';

(function () {
  'use strict';

  // Elements
  const authModal = document.getElementById('authModal');
  const openAuthBtn = document.getElementById('openAuthBtn');
  const authClose = document.getElementById('authClose');
  const authForm = document.getElementById('authForm');
  const loginBtn = document.getElementById('loginBtn');
  const registerBtn = document.getElementById('registerBtn');
  const authNote = document.getElementById('authNote');
  function ensureForgotButton() {
    try {
      if (!authForm) return;
      let btn = document.getElementById('forgotPwBtn');
      if (!btn) {
        btn = document.createElement('button');
        btn.id = 'forgotPwBtn';
        btn.type = 'button';
        btn.className = 'btn btn-ghost';
        btn.textContent = 'Esqueci minha senha';
        btn.style.marginTop = '0.35rem';
        const noteBelow = authNote && authNote.parentElement === authForm ? authNote : null;
        if (noteBelow) {
          noteBelow.insertAdjacentElement('afterend', btn);
        } else {
          authForm.appendChild(btn);
        }
      }
    } catch {}
  }
  ensureForgotButton();
  const userMenu = document.getElementById('userMenu');
  const userEmailEl = document.getElementById('userEmail');
  const userAvatar = document.getElementById('userAvatar');
  const userAvatarLink = document.getElementById('userAvatarLink');
  const logoutBtn = document.getElementById('logoutBtn');
  const membersSection = document.querySelector('[data-members-only]');
  const DEFAULT_AVATAR = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><rect width="128" height="128" fill="%23e5e7eb"/><circle cx="64" cy="48" r="24" fill="%239ca3af"/><rect x="24" y="80" width="80" height="32" rx="16" fill="%239ca3af"/></svg>';
  // Notifications (global)
  const notifModal = document.getElementById('notifModal');
  const notifList = document.getElementById('notifList');
  const notifBadge = document.getElementById('notifBadge');
  const notifBadgeAvatar = document.getElementById('notifBadgeAvatar');
  let unsubNotifs = null;

  // Helpers modal
  function openModal() {
    if (!authModal) return;
    authModal.hidden = false;
    document.body.style.overflow = 'hidden';
    const firstInput = document.getElementById('authEmail');
    firstInput?.focus();
  }
  function closeModal() {
    if (!authModal) return;
    authModal.hidden = true;
    document.body.style.overflow = '';
    authNote && (authNote.textContent = '');
  }

  openAuthBtn?.addEventListener('click', openModal);
  document.getElementById('openAuthBtn2')?.addEventListener('click', openModal);
  authClose?.addEventListener('click', closeModal);
  authModal?.addEventListener('click', (e) => {
    const target = e.target;
    if (target instanceof HTMLElement && target.dataset.close === 'true') closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  // Firebase persistence
  setPersistence(auth, browserLocalPersistence).catch(() => {});
  try { auth.languageCode = 'pt'; } catch {}

  // --- Simple cache helpers ---
  const LS = {
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
    get(k, fallback = null) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback; } catch { return fallback; } },
    del(k) { try { localStorage.removeItem(k); } catch {} }
  };
  function setCookie(name, value, days = 180) {
    try {
      const d = new Date(); d.setTime(d.getTime() + (days*24*60*60*1000));
      document.cookie = `${name}=${encodeURIComponent(value)}; expires=${d.toUTCString()}; path=/; SameSite=Lax`;
    } catch {}
  }
  function getCookie(name) {
    try {
      const n = name + '='; const ca = document.cookie.split(';');
      for (let c of ca) { while (c.charAt(0) === ' ') c = c.substring(1); if (c.indexOf(n) === 0) return decodeURIComponent(c.substring(n.length, c.length)); }
      return '';
    } catch { return ''; }
  }
  const C_KEYS = { lastEmail: 'nexus.last.email', notifUnread: 'nexus.unread', cookieConsent: 'nexus.cookie.ok' };

  // Gate member content by auth state
  function updateUI(user) {
    const isLogged = !!user;
    // Root auth class for CSS gating
    const root = document.documentElement;
    if (isLogged) root.classList.add('authed'); else root.classList.remove('authed');
    // Navbar controls
    if (userMenu) {
      userMenu.hidden = !isLogged;
    }
    if (openAuthBtn) {
      openAuthBtn.hidden = isLogged;
      // extra safeguard against visibility glitches
      openAuthBtn.style.display = isLogged ? 'none' : '';
    }
    // Toggle nav members link
    const navMembers = document.getElementById('navMembers');
    if (navMembers) navMembers.hidden = !isLogged;
    // Toggle avatar link explicitly
    if (userAvatarLink) userAvatarLink.hidden = !isLogged;
    if (userEmailEl) { userEmailEl.textContent = ''; }
    if (userAvatar instanceof HTMLImageElement) {
      if (isLogged) {
        // Prefer custom avatar from Firestore profile doc if present; fallback to default
        (async () => {
          try {
            const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js');
            const ref = doc(db, 'profiles', user.uid);
            const snap = await getDoc(ref);
            const data = snap.exists() ? snap.data() : null;
            const picture = (data && (data.photoData || data.photoURL)) || '';
            userAvatar.src = picture || DEFAULT_AVATAR;
            // cache minimal profile for perf
            LS.set('nexus.profile.' + user.uid, { displayName: data?.displayName || '', photoURL: picture || '' });
          } catch {
            userAvatar.src = DEFAULT_AVATAR;
          }
        })();
      } else {
        userAvatar.src = '';
      }
    }
    // Members section
    if (membersSection instanceof HTMLElement) {
      membersSection.hidden = !isLogged;
    }
  }

  onAuthStateChanged(auth, (user) => {
    updateUI(user);
    try { if (user) { maybeAskCookieConsent(user.uid); } } catch {}
    // Guard on members.html
    const guard = document.getElementById('guard');
    const app = document.querySelector('[data-members-only]');
    if (guard && app) {
      guard.hidden = !!user;
      if (app instanceof HTMLElement) app.hidden = !user;
    }
    // If not logged in and on members page, redirect to homepage with auth prompt
    const onMembersPage = typeof window !== 'undefined' && window.location.pathname.includes('members.html');
    if (!user && onMembersPage) {
      window.location.replace('index.html?auth=1');
    }

    // Subscribe notifications on any page that has notif UI
    if (unsubNotifs) { unsubNotifs(); unsubNotifs = null; }
    if (user && notifList) {
      try {
        unsubNotifs = onSnapshot(query(collection(db, 'notifications'), where('to', '==', user.uid)), (snap) => {
          if (notifList) notifList.innerHTML = '';
          let unread = 0;
          snap.forEach((d) => {
            const n = d.data();
            if (!n.read) unread++;
            const when = n.createdAt?.seconds ? new Date(n.createdAt.seconds * 1000).toLocaleString('pt-BR') : '';
            const li = document.createElement('li');
            if (n.type === 'friend_request') {
              li.innerHTML = `<span><strong>${(n.fromName || 'Alguém')}</strong> quer se conectar.</span>
              <span class="list-actions">
                <span class="time">${when}</span>
                <button class="btn btn-primary" data-action="notif-accept" data-id="${d.id}" data-from="${n.from}">Aceitar</button>
                <button class="btn btn-ghost" data-action="notif-decline" data-id="${d.id}">Recusar</button>
              </span>`;
            } else if (n.type === 'message') {
              li.innerHTML = `<span>Nova mensagem de <strong>${(n.fromName || 'Contato')}</strong></span>
              <span class="list-actions"><span class="time">${when}</span></span>`;
            } else {
              li.innerHTML = `<span>${(n.text || 'Notificação')}</span><span class="list-actions"><span class="time">${when}</span></span>`;
            }
            notifList && notifList.appendChild(li);
          });
          if (notifBadge) { notifBadge.textContent = String(unread); notifBadge.hidden = unread <= 0; }
          if (notifBadgeAvatar) { notifBadgeAvatar.textContent = String(unread); notifBadgeAvatar.hidden = unread <= 0; }
          // cache unread count
          try { localStorage.setItem(C_KEYS.notifUnread, String(unread)); } catch {}
        });
      } catch {}
    }
  });

  // Handle accept/decline from notifications on any page
  document.addEventListener('click', async (e) => {
    const btn = e.target instanceof HTMLElement ? e.target.closest('button[data-action]') : null;
    if (!btn) return;
    const action = btn.getAttribute('data-action');
    const id = btn.getAttribute('data-id');
    const user = auth.currentUser;
    if (!user || !action) return;
    try {
      if (action === 'notif-accept' && id) {
        const from = btn.getAttribute('data-from') || '';
        if (from) {
          // Deterministic friend doc IDs to avoid duplicates
          const a = `fr_${user.uid}_${from}`;
          const b = `fr_${from}_${user.uid}`;
          await Promise.all([
            setDoc(doc(db, 'friends', a), { owner: user.uid, friendId: from, createdAt: serverTimestamp() }, { merge: true }),
            setDoc(doc(db, 'friends', b), { owner: from, friendId: user.uid, createdAt: serverTimestamp() }, { merge: true })
          ]);
        }
        await deleteDoc(doc(db, 'notifications', id));
        try { if (typeof window !== 'undefined' && typeof window.ajax === 'function') window.ajax('notif-accept'); } catch {}
      }
      if (action === 'notif-decline' && id) {
        await deleteDoc(doc(db, 'notifications', id));
        try { if (typeof window !== 'undefined' && typeof window.ajax === 'function') window.ajax('notif-decline'); } catch {}
      }
    } catch {}
  });

  // Form actions
  authForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!(e instanceof SubmitEvent)) return;
    const form = e.currentTarget;
    if (!(form instanceof HTMLFormElement)) return;
    const data = new FormData(form);
    const email = String(data.get('email') || '').trim();
    const password = String(data.get('password') || '');
    if (!email || !password) {
      authNote && (authNote.textContent = 'Preencha email e senha.');
      return;
    }
    // store last email for convenience
    try { localStorage.setItem(C_KEYS.lastEmail, email); setCookie(C_KEYS.lastEmail, email, 365); } catch {}
    try {
      await signInWithEmailAndPassword(auth, email, password);
      authNote && (authNote.textContent = '');
      closeModal();
      // show cookie consent if not accepted
      try { await maybeAskCookieConsent(auth.currentUser?.uid || ''); } catch {}
    } catch (err) {
      authNote && (authNote.textContent = mapFirebaseError(err));
    }
  });

  registerBtn?.addEventListener('click', async () => {
    // Redireciona para a página de cadastro dedicada
    window.location.href = 'signup.html';
  });

  logoutBtn?.addEventListener('click', async () => {
    try { await signOut(auth); } catch {}
  });

  // Password reset
  document.getElementById('forgotPwBtn')?.addEventListener('click', async () => {
    const emailInput = document.getElementById('authEmail');
    const email = (emailInput && emailInput.value) ? String(emailInput.value).trim() : '';
    if (!email) { authNote && (authNote.textContent = 'Informe seu email para recuperar a senha.'); return; }
    try {
      await sendPasswordResetEmail(auth, email);
      authNote && (authNote.textContent = 'Enviamos um link de recuperação para seu email.');
    } catch (err) {
      const code = (err && err.code) || '';
      let msg = 'Não foi possível enviar o reset. Tente novamente.';
      if (code === 'auth/invalid-email') msg = 'Email inválido.';
      if (code === 'auth/user-not-found') msg = 'Email não cadastrado.';
      authNote && (authNote.textContent = msg);
    }
  });

  function mapFirebaseError(err) {
    const code = (err && err.code) || '';
    switch (code) {
      case 'auth/invalid-email': return 'Email inválido.';
      case 'auth/user-disabled': return 'Usuário desativado.';
      case 'auth/user-not-found': return 'Usuário não encontrado.';
      case 'auth/wrong-password': return 'Senha incorreta.';
      case 'auth/weak-password': return 'Senha muito fraca (mínimo 6 caracteres).';
      case 'auth/email-already-in-use': return 'Email já cadastrado.';
      case 'auth/invalid-credential': return 'Credenciais inválidas. Verifique email e senha.';
      case 'auth/too-many-requests': return 'Muitas tentativas. Aguarde um pouco e tente novamente.';
      default: return 'Ocorreu um erro. Tente novamente.';
    }
  }

  // --- Cookie consent modal ---
  async function hasAcceptedCookies(uid) {
    try {
      if (!uid) return false;
      const ref = doc(db, 'profiles', uid);
      const snap = await getDoc(ref);
      const data = snap.exists() ? snap.data() : null;
      return !!(data && data.cookieAcceptedAt);
    } catch { return false; }
  }
  function injectCookieModal() {
    let modal = document.getElementById('cookieModal');
    if (modal) return modal;
    modal = document.createElement('div');
    modal.className = 'modal'; modal.id = 'cookieModal'; modal.setAttribute('role', 'dialog'); modal.setAttribute('aria-modal', 'true'); modal.hidden = true;
    modal.innerHTML = `
      <div class="modal-backdrop" data-close="true"></div>
      <div class="modal-dialog" role="document">
        <button class="modal-close" id="cookieClose" aria-label="Fechar" data-close="true">×</button>
        <div class="modal-header">
          <h2>Cookies e armazenamento local</h2>
        </div>
        <div class="modal-body">
          <p>Usamos cookies e armazenamento local para melhorar sua experiência (login, preferências e performance). Ao continuar, você concorda com essa utilização.</p>
          <div class="actions">
            <button class="btn btn-primary" id="cookieAccept">Aceitar</button>
            <button class="btn btn-ghost" id="cookieLater">Agora não</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => { const t = e.target; if (t instanceof HTMLElement && t.dataset.close === 'true') modal.hidden = true; });
    document.getElementById('cookieClose')?.addEventListener('click', () => { modal.hidden = true; });
    return modal;
  }
  async function maybeAskCookieConsent(uid) {
    try {
      if (!uid) return;
      // already accepted in local markers?
      const localOk = getCookie(C_KEYS.cookieConsent) || LS.get(C_KEYS.cookieConsent, '') === '1';
      if (localOk) return;
      if (await hasAcceptedCookies(uid)) { setCookie(C_KEYS.cookieConsent, '1', 365); LS.set(C_KEYS.cookieConsent, '1'); return; }
      const modal = injectCookieModal();
      modal.hidden = false; document.body.style.overflow = 'hidden';
      const acceptBtn = document.getElementById('cookieAccept');
      const laterBtn = document.getElementById('cookieLater');
      acceptBtn?.addEventListener('click', async () => {
        try {
          await setDoc(doc(db, 'profiles', uid), { cookieAcceptedAt: serverTimestamp() }, { merge: true });
          setCookie(C_KEYS.cookieConsent, '1', 365); LS.set(C_KEYS.cookieConsent, '1');
        } catch {}
        modal.hidden = true; document.body.style.overflow = '';
      }, { once: true });
      laterBtn?.addEventListener('click', () => { modal.hidden = true; document.body.style.overflow = ''; }, { once: true });
    } catch {}
  }
})();


