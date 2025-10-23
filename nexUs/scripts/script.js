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
  let navBackdrop = null;
  let focusTrapHandler = null;

  function removeBackdrop() {
    if (!navBackdrop) return;
    navBackdrop.classList.remove('show');
    const toRemove = navBackdrop;
    navBackdrop = null;
    setTimeout(() => { toRemove.remove(); }, 180);
  }

  function closeNav() {
    if (!primaryNav) return;
    const end = () => {
      primaryNav.classList.remove('closing');
      navToggle?.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      if (focusTrapHandler) { document.removeEventListener('keydown', focusTrapHandler); focusTrapHandler = null; }
      removeBackdrop();
    };
    if (primaryNav.classList.contains('open')) {
      primaryNav.classList.remove('open');
      primaryNav.classList.add('closing');
      const onEnd = (ev) => { if (ev.propertyName === 'transform') { primaryNav.removeEventListener('transitionend', onEnd); end(); } };
      primaryNav.addEventListener('transitionend', onEnd);
    } else {
      end();
    }
  }
  function openNav() {
    if (!primaryNav) return;
    // backdrop
    if (!navBackdrop) {
      navBackdrop = document.createElement('div');
      navBackdrop.className = 'nav-backdrop';
      navBackdrop.addEventListener('click', closeNav);
      document.body.appendChild(navBackdrop);
      requestAnimationFrame(() => navBackdrop && navBackdrop.classList.add('show'));
    }
    // animate in
    primaryNav.classList.add('opening');
    navToggle?.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => {
      primaryNav.classList.remove('opening');
      primaryNav.classList.add('open');
      // ensure close button exists inside overlay
      let closeBtn = primaryNav.querySelector('.nav-close');
      if (!(closeBtn instanceof HTMLElement)) {
        closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'nav-close';
        closeBtn.setAttribute('aria-label', 'Fechar menu');
        closeBtn.textContent = '×';
        closeBtn.addEventListener('click', closeNav);
        primaryNav.insertBefore(closeBtn, primaryNav.firstChild);
      }
      // focus close button for a11y
      closeBtn && closeBtn.focus();
    });
    // focus trap inside nav while open
    focusTrapHandler = (e) => {
      if (e.key !== 'Tab' || !primaryNav.classList.contains('open')) return;
      const focusables = Array.from(primaryNav.querySelectorAll('a, button, [tabindex]:not([tabindex="-1"])'))
        .filter(el => el instanceof HTMLElement && !el.hasAttribute('disabled'));
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (e.shiftKey) {
        if (active === first) { e.preventDefault(); last.focus(); }
      } else {
        if (active === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', focusTrapHandler);
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

  // Close menu if viewport switches to desktop
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 920) closeNav();
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


