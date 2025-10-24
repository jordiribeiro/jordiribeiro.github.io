import { auth, db } from './firebase-config.js';
import { createUserWithEmailAndPassword, updateProfile } from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js';
import { doc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js';

(function(){
  'use strict';
  const form = document.getElementById('signupForm');
  const note = document.getElementById('signupNote');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const email = String(data.get('email') || '').trim();
    const password = String(data.get('password') || '');
    const name = String(data.get('name') || '').trim();
    if (!email || !password) { note && (note.textContent = 'Preencha email e senha.'); return; }
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (name) { try { await updateProfile(cred.user, { displayName: name }); } catch {} }
      // create base profile doc
      await setDoc(doc(db, 'profiles', cred.user.uid), { uid: cred.user.uid, displayName: name || '', createdAt: serverTimestamp() }, { merge: true });
      note && (note.textContent = 'Conta criada com sucesso!');
      setTimeout(() => { location.href = 'members.html'; }, 800);
    } catch (err) {
      note && (note.textContent = 'Erro ao cadastrar.');
      console.error('signup error', err);
    }
  });
})();


