(function () {
  'use strict';

  const htmlEl = document.documentElement;
  const navToggle = document.getElementById('navToggle');
  const primaryNav = document.getElementById('primaryNav');
  const ctaForm = document.getElementById('ctaForm');
  const formNote = document.getElementById('formNote');
  const yearEl = document.getElementById('year');

  // Set current year
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // If redirected with auth=1, open auth modal after load
  const qp = new URLSearchParams(window.location.search);
  if (qp.get('auth') === '1') {
    const open = () => document.getElementById('openAuthBtn')?.dispatchEvent(new Event('click'));
    if (document.readyState === 'complete') open(); else window.addEventListener('load', open, { once: true });
  }

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

  // Simple carousel controls
  document.addEventListener('click', (e) => {
    const prev = e.target instanceof HTMLElement && e.target.closest('[data-prev]');
    const next = e.target instanceof HTMLElement && e.target.closest('[data-next]');
    if (!prev && !next) return;
    const carousel = (prev || next)?.closest('[data-carousel]');
    if (!carousel) return;
    const track = carousel.querySelector('[data-track]');
    if (!(track instanceof HTMLElement)) return;
    const delta = track.clientWidth * 0.9;
    track.scrollBy({ left: prev ? -delta : delta, behavior: 'smooth' });
  });

  // Theme toggle removed

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


