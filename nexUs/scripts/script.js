(function () {
  'use strict';

  const htmlEl = document.documentElement;
  const navToggle = document.getElementById('navToggle');
  const primaryNav = document.getElementById('primaryNav');
  const siteHeader = document.querySelector('.site-header');
  const ctaForm = document.getElementById('ctaForm');
  const formNote = document.getElementById('formNote');
  const yearEl = document.getElementById('year');
  // Brand logo: default NexUs -U.jpg on desktop, swap to NexUsLogo.png on hover.
  // On mobile, always show NexUsLogo.png (no hover behavior).
  const brandLogos = Array.from(document.querySelectorAll('.brand-logo'));
  const DEFAULT_LOGO_SRC = 'assets/NexUs -U.jpg';
  const HOVER_LOGO_SRC = 'assets/NexUsLogo.png';
  function isMobileLike() { return window.matchMedia('(max-width: 919px)').matches; }
  function useMobileLogo(el) { el.setAttribute('src', HOVER_LOGO_SRC); }
  function swapWithFade(el, toHover) {
    el.classList.add('swap-fade');
    const doSwap = () => { el.setAttribute('src', toHover ? HOVER_LOGO_SRC : DEFAULT_LOGO_SRC); };
    setTimeout(() => { doSwap(); el.classList.remove('swap-fade'); }, 120);
  }
  brandLogos.forEach((img) => {
    if (isMobileLike()) {
      img.src = HOVER_LOGO_SRC;
    } else {
      img.src = DEFAULT_LOGO_SRC;
      img.addEventListener('mouseenter', () => { if (!isMobileLike()) { img.classList.add('hovering'); swapWithFade(img, true); } });
      img.addEventListener('mouseleave', () => { if (!isMobileLike()) { img.classList.remove('hovering'); swapWithFade(img, false); } });
    }
  });
  window.addEventListener('resize', () => {
    brandLogos.forEach((img) => { img.src = isMobileLike() ? HOVER_LOGO_SRC : DEFAULT_LOGO_SRC; });
    adjustHeaderOffset();
  });

  // Set current year
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // Global user dropdown handling (delegated) so it works even if elements mount later
  function setUserDropdownExpanded(expanded) {
    const btn = document.getElementById('userAvatarBtn');
    if (btn) btn.setAttribute('aria-expanded', String(expanded));
  }
  function toggleUserDropdownDelegated() {
    const dd = document.getElementById('userDropdown');
    if (!dd) return;
    const willOpen = dd.hidden;
    dd.hidden = !willOpen;
    setUserDropdownExpanded(willOpen);
  }
  function closeUserDropdownDelegated() {
    const dd = document.getElementById('userDropdown');
    if (dd && !dd.hidden) { dd.hidden = true; setUserDropdownExpanded(false); }
  }
  document.addEventListener('click', (e) => {
    const target = e.target instanceof HTMLElement ? e.target : null;
    if (!target) return;
    const avatarBtn = target.closest('#userAvatarBtn');
    if (avatarBtn) { e.stopPropagation(); toggleUserDropdownDelegated(); return; }
    const dd = document.getElementById('userDropdown');
    if (!dd || dd.hidden) return;
    const inside = target.closest('#userDropdown') || target.closest('#userAvatarBtn');
    if (!inside) closeUserDropdownDelegated();
  });

  // Adjust body offset for fixed header to avoid content jump/overlap
  function adjustHeaderOffset() {
    const header = siteHeader instanceof HTMLElement ? siteHeader : null;
    if (!header) return;
    const h = header.getBoundingClientRect().height;
    document.documentElement.style.setProperty('--header-h', h + 'px');
    document.body.style.paddingTop = h + 'px';
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', adjustHeaderOffset, { once: true });
  } else {
    adjustHeaderOffset();
  }

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
      // Hide inline close button after closing
      const closeBtn = primaryNav.querySelector('.nav-close');
      if (closeBtn instanceof HTMLElement) closeBtn.style.display = '';
    };
    if (primaryNav.classList.contains('open')) {
      // Keep 'open' class to preserve transition properties, only remove after transition ends
      primaryNav.classList.add('closing');
      const onEnd = (ev) => {
        if (ev.propertyName !== 'transform') return;
        primaryNav.removeEventListener('transitionend', onEnd);
        primaryNav.classList.remove('open');
        end();
      };
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


