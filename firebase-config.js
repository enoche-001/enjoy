// Shared Firebase initialization for the vault app.
// Loaded as a module by every page: import { auth, db, IMGBB_API_KEY } from './firebase-config.js'

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyC-mgFHlVaGXdD7ueyghDA3sBA1nHyNtO4",
  authDomain: "enjoy-a73a8.firebaseapp.com",
  projectId: "enjoy-a73a8",
  storageBucket: "enjoy-a73a8.firebasestorage.app",
  messagingSenderId: "468341987336",
  appId: "1:468341987336:web:0940d335b5b572465999bd"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Persistent local cache (IndexedDB): entries already seen load instantly from
// disk on the next visit instead of waiting on a fresh network round-trip, and
// still stay live-updated via onSnapshot once the network catches up. Works
// across multiple tabs of the same browser.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
});

// Your ImgBB API key — used to upload photos and get back a hosted URL.
export const IMGBB_API_KEY = "e77f866b202faec034d5307eae323cf6";

// Compresses an image file in-browser before upload (keeps ImgBB uploads small & fast).
export function compressImage(file, maxDim = 1400, quality = 0.75) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = (e) => { img.src = e.target.result; };
    reader.onerror = reject;
    img.onload = () => {
      let { width, height } = img;
      if (width > height && width > maxDim) { height *= maxDim / width; width = maxDim; }
      else if (height > maxDim) { width *= maxDim / height; height = maxDim; }
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', quality);
    };
    img.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Uploads a (compressed) image blob to ImgBB and returns the hosted URL.
export async function uploadToImgBB(blob) {
  const formData = new FormData();
  formData.append('image', blob);
  const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
    method: 'POST',
    body: formData
  });
  const data = await res.json();
  if (!data.success) throw new Error('ImgBB upload failed');
  return data.data.url;
}

// Generates a random URL-safe token for share links.
export function generateToken(length = 24) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let out = '';
  const arr = new Uint32Array(length);
  crypto.getRandomValues(arr);
  for (let i = 0; i < length; i++) out += chars[arr[i] % chars.length];
  return out;
}
