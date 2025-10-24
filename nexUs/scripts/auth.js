// Auth module using Firebase Web SDK (ESM) — works on GitHub Pages
// Steps: add your Firebase config in scripts/firebase-config.js

import { app, auth, db } from './firebase-config.js';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, updateDoc, getDocs } from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js';
import {
  browserLocalPersistence,
  setPersistence,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
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
          await Promise.all([
            addDoc(collection(db, 'friends'), { owner: user.uid, friendId: from, createdAt: serverTimestamp() }),
            addDoc(collection(db, 'friends'), { owner: from, friendId: user.uid, createdAt: serverTimestamp() })
          ]);
        }
        await deleteDoc(doc(db, 'notifications', id));
      }
      if (action === 'notif-decline' && id) {
        await deleteDoc(doc(db, 'notifications', id));
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
    try {
      await signInWithEmailAndPassword(auth, email, password);
      authNote && (authNote.textContent = '');
      closeModal();
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

  function mapFirebaseError(err) {
    const code = (err && err.code) || '';
    switch (code) {
      case 'auth/invalid-email': return 'Email inválido.';
      case 'auth/user-disabled': return 'Usuário desativado.';
      case 'auth/user-not-found': return 'Usuário não encontrado.';
      case 'auth/wrong-password': return 'Senha incorreta.';
      case 'auth/weak-password': return 'Senha muito fraca (mínimo 6 caracteres).';
      case 'auth/email-already-in-use': return 'Email já cadastrado.';
      default: return 'Ocorreu um erro. Tente novamente.';
    }
  }
})();


