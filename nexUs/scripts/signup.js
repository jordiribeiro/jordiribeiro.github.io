import { auth, db } from './firebase-config.js';
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js';
import { doc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js';

(function(){
  'use strict';
  try { auth.languageCode = 'pt'; } catch {}

  function escapeHtml(s) { return String(s || '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function getEmailConfig() {
    try { const cfg = window && window.NEXUS_LOCAL_CONFIG; return { endpoint: (cfg && cfg.emailEndpoint) || '', apiKey: (cfg && cfg.emailApiKey) || '' }; } catch { return { endpoint: '', apiKey: '' }; }
  }
  async function sendWelcomeEmail(to, name) {
    const { endpoint, apiKey } = getEmailConfig();
    if (!to) return false;
    if (!endpoint) {
      console.warn('[welcome-email] Nenhum endpoint configurado (window.NEXUS_LOCAL_CONFIG.emailEndpoint). Usando fallback de verificação do Firebase, se disponível.');
      return false;
    }
    const subject = 'Bem-vindo(a) ao NexUS!';
    const firstName = String(name || '').split(' ')[0] || 'empreendedor(a)';
    const html = `
      <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,Helvetica Neue,Arial,sans-serif;line-height:1.5;color:#0b1220">
        <h2 style="margin:0 0 8px 0">Olá, ${escapeHtml(firstName)}! 👋</h2>
        <p>Seja muito bem-vindo(a) ao <strong>NexUS</strong>! Estamos felizes em ter você com a gente.</p>
        <p>A partir de agora você tem acesso à comunidade, mentorias e ferramentas para acelerar seu negócio.</p>
        <p style="margin:16px 0 8px 0"><a href="https://nexus.app/members.html" style="display:inline-block;background:#0E5CF0;color:#fff;padding:10px 14px;border-radius:10px;text-decoration:none">Acessar área do membro</a></p>
        <p style="color:#5a6173">Dica: complete seu perfil e comece a se conectar com outros membros.</p>
        <hr style="border:0;border-top:1px solid #e2e6f0;margin:16px 0" />
        <p style="font-size:12px;color:#5a6173;margin:0">Se não foi você quem realizou o cadastro, ignore este email.</p>
      </div>`;
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {}) },
        body: JSON.stringify({ to, subject, html })
      });
      if (!res.ok) {
        const t = await res.text().catch(() => '');
        console.error('[welcome-email] Falha no endpoint', res.status, t);
        return false;
      }
      return true;
    } catch (e) {
      console.error('[welcome-email] Erro ao enviar', e);
      return false;
    }
  }
  const form = document.getElementById('signupForm');
  const note = document.getElementById('signupNote');
  const pw = document.getElementById('suPassword');
  const bar = document.getElementById('pwBar');
  const inner = document.getElementById('pwBarInner');

  function calcStrength(s) {
    const str = String(s || '');
    let score = 0;
    if (str.length >= 8) score += 1; // min length
    if (/[A-Z]/.test(str)) score += 1; // uppercase
    if (/[^A-Za-z0-9]/.test(str)) score += 1; // special char
    if (/[0-9]/.test(str)) score += 1; // digit
    return score; // 0..4
  }
  function updateBar() {
    if (!(bar && inner && pw)) return;
    const score = calcStrength(pw.value);
    const pct = Math.min(100, Math.max(0, (score / 4) * 100));
    inner.style.width = pct + '%';
    // color: 0-1 weak (red), 2 medium (yellow), 3-4 strong (green)
    let color = getComputedStyle(document.documentElement).getPropertyValue('--danger') || '#dc2626';
    if (score >= 3) color = '#16a34a';
    else if (score === 2) color = '#f59e0b';
    inner.style.backgroundColor = color.trim();
    bar.setAttribute('aria-hidden', 'false');
    // validity message for policy
    const ok = (pw.value.length >= 8) && /[A-Z]/.test(pw.value) && /[^A-Za-z0-9]/.test(pw.value);
    try { pw.setCustomValidity(ok ? '' : 'Senha precisa de 8+ caracteres, 1 maiúscula e 1 caractere especial.'); } catch {}
  }
  pw?.addEventListener('input', updateBar);
  pw?.addEventListener('focus', updateBar);
  pw?.addEventListener('blur', updateBar);
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const email = String(data.get('email') || '').trim();
    const password = String(data.get('password') || '');
    const name = String(data.get('name') || '').trim();
    if (!email || !password) { note && (note.textContent = 'Preencha email e senha.'); return; }
    // enforce policy
    if (!(password.length >= 8 && /[A-Z]/.test(password) && /[^A-Za-z0-9]/.test(password))) {
      note && (note.textContent = 'Senha fora do padrão: 8+ caracteres, 1 maiúscula e 1 caractere especial.');
      pw && pw.focus();
      return;
    }
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (name) { try { await updateProfile(cred.user, { displayName: name }); } catch {} }
      // create base profile doc
      await setDoc(doc(db, 'profiles', cred.user.uid), { uid: cred.user.uid, displayName: name || '', createdAt: serverTimestamp(), active: true }, { merge: true });
      // tentar enviar email de boas-vindas; se não houver endpoint, envia verificação do Firebase como fallback
      let sent = false;
      try { sent = await sendWelcomeEmail(email, name); } catch {}
      if (!sent) {
        try { await sendEmailVerification(cred.user); } catch (e) { console.warn('[welcome-email] fallback verificação falhou', e); }
      }
      note && (note.textContent = sent ? 'Conta criada com sucesso! Enviamos um email de boas-vindas.' : 'Conta criada com sucesso! Enviamos um email para verificar seu endereço.');
      setTimeout(() => { location.href = 'members.html'; }, 800);
    } catch (err) {
      let msg = 'Erro ao cadastrar.';
      const code = (err && err.code) || '';
      const raw = (err && err.message) || '';
      if (code === 'auth/email-already-in-use' || /EMAIL_EXISTS/i.test(raw)) {
        msg = 'Você já possui uma conta com este e-mail. Faça login ou recupere a senha.';
      } else if (code === 'auth/invalid-email') {
        msg = 'Email inválido. Verifique e tente novamente.';
      } else if (code === 'auth/weak-password') {
        msg = 'Senha fraca. Use 8+ caracteres, 1 maiúscula e 1 caractere especial.';
      }
      note && (note.textContent = msg);
      console.error('signup error', err);
    }
  });
})();


