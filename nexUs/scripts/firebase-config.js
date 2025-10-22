// Replace with your Firebase project values
// How to get: Firebase Console > Project settings > Your apps (Web)

import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js';
import { getAnalytics, isSupported } from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-analytics.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js';

export const firebaseConfig = {
  apiKey: 'AIzaSyBh10Uz8cpf_QZOK5z3rNFbomceh4EM-fM',
  authDomain: 'nexus-ac6fd.firebaseapp.com',
  projectId: 'nexus-ac6fd',
  storageBucket: 'nexus-ac6fd.firebasestorage.app',
  messagingSenderId: '216685400293',
  appId: '1:216685400293:web:a5dbbf3f1c4e783986c40c',
  measurementId: 'G-H17ZHW0DRK',
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Initialize Analytics only if supported (prevents errors on unsupported environments like some browsers)
export let analytics;
try {
  isSupported().then((supported) => {
    if (supported) analytics = getAnalytics(app);
  }).catch(() => {});
} catch {}

// AI planner Cloud Function endpoint (configure after deploy)
// Para desenvolvimento local, você pode usar um endpoint local do emulador/functions, por exemplo:
// export const aiPlannerEndpoint = 'http://localhost:5001/SEU_PROJETO/us-central1/ai/plan';
export const aiPlannerEndpoint = '';


