import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, updateProfile } from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js';
import { doc, getDoc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-storage.js';

(function() {
  'use strict';

  const pfForm = document.getElementById('pfForm');
  const pfNote = document.getElementById('pfNote');
  const pfAvatarFile = document.getElementById('pfAvatarFile');
  const pfAvatarSave = document.getElementById('pfAvatarSave');
  const pfAvatarRemove = document.getElementById('pfAvatarRemove');
  const pfAvatarPreview = document.getElementById('pfAvatarPreview');
  const DEFAULT_AVATAR = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><rect width="128" height="128" fill="%23e5e7eb"/><circle cx="64" cy="48" r="24" fill="%239ca3af"/><rect x="24" y="80" width="80" height="32" rx="16" fill="%239ca3af"/></svg>';

  const storage = getStorage();

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
      if (pfAvatarPreview instanceof HTMLImageElement) pfAvatarPreview.src = data.photoURL || DEFAULT_AVATAR;
      // Also reflect in header avatar if present
      const userAvatar = document.getElementById('userAvatar');
      if (userAvatar instanceof HTMLImageElement) userAvatar.src = data.photoURL || DEFAULT_AVATAR;
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
      // Path: avatars/{uid}/{timestamp}.ext
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
      const cleanExt = ['jpg','jpeg','png','webp','gif','bmp','avif'].includes(ext) ? ext : 'jpg';
      const key = `avatars/${user.uid}/${Date.now()}.${cleanExt}`;
      const r = ref(storage, key);
      const uploaded = await uploadBytes(r, file, { contentType: file.type || `image/${cleanExt}` });
      const url = await getDownloadURL(uploaded.ref);
      // Save profile doc
      await setDoc(doc(db, 'profiles', user.uid), {
        uid: user.uid,
        photoURL: url,
        updatedAt: serverTimestamp()
      }, { merge: true });
      // Update auth profile (optional)
      try { await updateProfile(user, { photoURL: url }); } catch {}
      // Update header and preview
      const userAvatar = document.getElementById('userAvatar');
      if (userAvatar instanceof HTMLImageElement) userAvatar.src = url;
      if (pfAvatarPreview instanceof HTMLImageElement) pfAvatarPreview.src = url;
      pfNote && (pfNote.textContent = 'Foto atualizada.');
    } catch (err) {
      pfNote && (pfNote.textContent = 'Erro ao enviar imagem.');
      console.error('avatar upload error', err);
    }
  });

  pfAvatarRemove?.addEventListener('click', async () => {
    const user = auth.currentUser; if (!user) return;
    try {
      // Remove photoURL reference (mantém versões antigas salvas para não quebrar referências externas)
      await setDoc(doc(db, 'profiles', user.uid), { photoURL: '', updatedAt: serverTimestamp() }, { merge: true });
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


