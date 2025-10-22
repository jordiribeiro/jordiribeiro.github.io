// Auth module using Firebase Web SDK (ESM) — works on GitHub Pages
// Steps: add your Firebase config in scripts/firebase-config.js

import { app, auth } from './firebase-config.js';
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
  const logoutBtn = document.getElementById('logoutBtn');
  const membersSection = document.querySelector('[data-members-only]');

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
    // Navbar controls
    if (userMenu) {
      userMenu.hidden = !isLogged;
    }
    if (openAuthBtn) {
      openAuthBtn.hidden = isLogged;
    }
    if (userEmailEl) {
      userEmailEl.textContent = isLogged ? (user.email || '') : '';
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
    if (!authForm) return;
    const data = new FormData(authForm);
    const email = String(data.get('email') || '').trim();
    const password = String(data.get('password') || '');
    if (!email || !password) {
      authNote && (authNote.textContent = 'Preencha email e senha.');
      return;
    }
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      authNote && (authNote.textContent = 'Conta criada! Você já está logado.');
      setTimeout(closeModal, 600);
    } catch (err) {
      authNote && (authNote.textContent = mapFirebaseError(err));
    }
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


