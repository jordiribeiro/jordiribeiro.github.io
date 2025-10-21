(function () {
  'use strict';

  const htmlEl = document.documentElement;
  const navToggle = document.getElementById('navToggle');
  const primaryNav = document.getElementById('primaryNav');
  const themeToggle = document.getElementById('themeToggle');
  const ctaForm = document.getElementById('ctaForm');
  const formNote = document.getElementById('formNote');
  const yearEl = document.getElementById('year');

  // Set current year
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // Mobile nav toggle
  function closeNav() {
    if (!primaryNav) return;
    primaryNav.classList.remove('open');
    navToggle?.setAttribute('aria-expanded', 'false');
  }
  function openNav() {
    if (!primaryNav) return;
    primaryNav.classList.add('open');
    navToggle?.setAttribute('aria-expanded', 'true');
  }
  navToggle?.addEventListener('click', () => {
    const isOpen = primaryNav?.classList.contains('open');
    if (isOpen) closeNav(); else openNav();
  });
  // Close on link click (mobile)
  primaryNav?.addEventListener('click', (e) => {
    const target = e.target;
    if (target instanceof HTMLElement && target.tagName === 'A') closeNav();
  });
  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeNav();
  });

  // Smooth scroll and focus management
  document.addEventListener('click', (e) => {
    const link = e.target instanceof Element ? e.target.closest('a[href^="#"]') : null;
    if (!link) return;
    const href = link.getAttribute('href');
    if (!href || href === '#' || href.length < 2) return;
    const target = document.querySelector(href);
    if (!(target instanceof HTMLElement)) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // move focus after scroll
    setTimeout(() => {
      if (typeof target.tabIndex !== 'number' || target.tabIndex < 0) target.tabIndex = -1;
      target.focus({ preventScroll: true });
    }, 300);
  });

  // Theme toggle with localStorage
  const THEME_KEY = 'nexus.theme';
  function applyTheme(theme) {
    if (theme === 'light' || theme === 'dark') {
      htmlEl.setAttribute('data-theme', theme);
      themeToggle?.setAttribute('aria-pressed', String(theme === 'dark'));
    } else {
      htmlEl.setAttribute('data-theme', 'auto');
      themeToggle?.setAttribute('aria-pressed', 'false');
    }
  }
  function initTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark') applyTheme(saved);
    else applyTheme('auto');
  }
  themeToggle?.addEventListener('click', () => {
    const current = htmlEl.getAttribute('data-theme') || 'auto';
    let next = 'dark';
    if (current === 'dark') next = 'light';
    else if (current === 'light') next = 'auto';
    else next = 'dark';
    applyTheme(next);
    if (next === 'auto') localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, next);
  });
  initTheme();

  // Simple form handling (demo only)
  ctaForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(ctaForm);
    const email = String(data.get('email') || '').trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      formNote && (formNote.textContent = 'Digite um email válido.');
      formNote && (formNote.style.color = 'var(--danger)');
      return;
    }
    formNote && (formNote.textContent = 'Obrigado! Em breve entraremos em contato.');
    formNote && (formNote.style.color = 'var(--accent)');
    ctaForm.reset();
  });
})();


