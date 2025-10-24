import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, updateProfile } from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js';
import { doc, getDoc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js';

(function() {
  'use strict';

  const pfForm = document.getElementById('pfForm');
  const pfNote = document.getElementById('pfNote');
  const pfAvatarFile = document.getElementById('pfAvatarFile');
  const pfAvatarSave = document.getElementById('pfAvatarSave');
  const pfAvatarRemove = document.getElementById('pfAvatarRemove');
  const pfAvatarPreview = document.getElementById('pfAvatarPreview');
  const DEFAULT_AVATAR = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><rect width="128" height="128" fill="%23e5e7eb"/><circle cx="64" cy="48" r="24" fill="%239ca3af"/><rect x="24" y="80" width="80" height="32" rx="16" fill="%239ca3af"/></svg>';

  // Helper: resize and encode image into compact data URL to store in Firestore
  async function fileToDataUrlResized(file, maxSize = 360, preferredMime = 'image/webp', quality = 0.85) {
    const bitmap = await createImageBitmap(file).catch(async () => {
      return await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
      });
    });
    const w = bitmap.width, h = bitmap.height;
    const scale = Math.min(1, maxSize / Math.max(w, h));
    const outW = Math.max(1, Math.round(w * scale));
    const outH = Math.max(1, Math.round(h * scale));
    const canvas = document.createElement('canvas');
    canvas.width = outW; canvas.height = outH;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas não suportado.');
    ctx.drawImage(bitmap, 0, 0, outW, outH);
    let mime = preferredMime; let q = quality;
    let dataUrl = canvas.toDataURL(mime, q);
    let tries = 0;
    while (dataUrl.length > 380000 && tries < 3) { // ~370KB
      q = Math.max(0.6, q - 0.1);
      dataUrl = canvas.toDataURL(mime, q);
      tries++;
    }
    if (dataUrl.length > 1000000) { // fallback to jpeg if still too big
      mime = 'image/jpeg'; q = 0.8; tries = 0;
      dataUrl = canvas.toDataURL(mime, q);
      while (dataUrl.length > 380000 && tries < 4) {
        q = Math.max(0.5, q - 0.1);
        dataUrl = canvas.toDataURL(mime, q);
        tries++;
      }
    }
    return dataUrl;
  }

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.replace('index.html?auth=1');
      return;
    }
    // Load existing profile
    try {
      const snap = await getDoc(doc(db, 'profiles', user.uid));
      const data = snap.exists() ? snap.data() : {};
      const dn = document.getElementById('pfDisplayName'); if (dn) dn.value = data.displayName || user.displayName || '';
      const co = document.getElementById('pfCompany'); if (co) co.value = data.company || '';
      const bio = document.getElementById('pfBio'); if (bio) bio.value = data.bio || '';
      const site = document.getElementById('pfSite'); if (site) site.value = data.site || '';
      if (pfAvatarPreview instanceof HTMLImageElement) pfAvatarPreview.src = data.photoData || data.photoURL || DEFAULT_AVATAR;
      // Also reflect in header avatar if present
      const userAvatar = document.getElementById('userAvatar');
      if (userAvatar instanceof HTMLImageElement) userAvatar.src = data.photoData || data.photoURL || DEFAULT_AVATAR;
    } catch {}
  });

  pfAvatarFile?.addEventListener('change', () => {
    const file = pfAvatarFile.files && pfAvatarFile.files[0];
    if (!file || !(pfAvatarPreview instanceof HTMLImageElement)) return;
    const reader = new FileReader();
    reader.onload = () => { pfAvatarPreview.src = String(reader.result || ''); };
    reader.readAsDataURL(file);
  });

  pfAvatarSave?.addEventListener('click', async () => {
    const user = auth.currentUser; if (!user) return;
    const file = pfAvatarFile && pfAvatarFile.files && pfAvatarFile.files[0];
    if (!file) { pfNote && (pfNote.textContent = 'Selecione uma imagem.'); return; }
    try {
      // Resize/encode and save data to Firestore
      const dataUrl = await fileToDataUrlResized(file, 360, 'image/webp', 0.85);
      await setDoc(doc(db, 'profiles', user.uid), {
        uid: user.uid,
        photoData: dataUrl,
        updatedAt: serverTimestamp()
      }, { merge: true });
      // Update UI
      const userAvatar = document.getElementById('userAvatar');
      if (userAvatar instanceof HTMLImageElement) userAvatar.src = dataUrl;
      if (pfAvatarPreview instanceof HTMLImageElement) pfAvatarPreview.src = dataUrl;
      pfNote && (pfNote.textContent = 'Foto atualizada.');
    } catch (err) {
      pfNote && (pfNote.textContent = 'Erro ao enviar imagem.');
      console.error('avatar upload error', err);
    }
  });

  pfAvatarRemove?.addEventListener('click', async () => {
    const user = auth.currentUser; if (!user) return;
    try {
      // Remove photo data
      await setDoc(doc(db, 'profiles', user.uid), { photoData: '', photoURL: '', updatedAt: serverTimestamp() }, { merge: true });
      try { await updateProfile(user, { photoURL: '' }); } catch {}
      const userAvatar = document.getElementById('userAvatar');
      if (userAvatar instanceof HTMLImageElement) userAvatar.src = DEFAULT_AVATAR;
      if (pfAvatarPreview instanceof HTMLImageElement) pfAvatarPreview.src = DEFAULT_AVATAR;
      pfNote && (pfNote.textContent = 'Foto removida.');
    } catch (err) {
      pfNote && (pfNote.textContent = 'Erro ao remover foto.');
      console.error('avatar remove error', err);
    }
  });

  pfForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = auth.currentUser; if (!user) return;
    const data = new FormData(pfForm);
    const displayName = String(data.get('displayName') || '').trim();
    const company = String(data.get('company') || '').trim();
    const bio = String(data.get('bio') || '').trim();
    const site = String(data.get('site') || '').trim();
    try {
      await setDoc(doc(db, 'profiles', user.uid), {
        uid: user.uid,
        displayName, company, bio, site,
        updatedAt: serverTimestamp()
      }, { merge: true });
      try { if (displayName) await updateProfile(user, { displayName }); } catch {}
      pfNote && (pfNote.textContent = 'Perfil atualizado.');
    } catch (err) {
      pfNote && (pfNote.textContent = 'Erro ao salvar perfil.');
      console.error('profile save error', err);
    }
  });
})();


