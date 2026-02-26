import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAMLsBF9DtL0JA4ydw3zqVx5xKDwuEgFBg",
  authDomain: "caron-676c5.firebaseapp.com",
  projectId: "caron-676c5",
  storageBucket: "caron-676c5.firebasestorage.app",
  messagingSenderId: "475474718737",
  appId: "1:475474718737:web:e3d82d6a09a13ca7e641b0",
  measurementId: "G-JN69X50RXR"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ── Collections ──
const carsCol = collection(db, 'cars');
const inquiriesCol = collection(db, 'inquiries');

// ── Cars ──
export function subscribeCars(callback) {
  const q = query(carsCol, orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    const cars = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(cars);
  }, (err) => {
    console.error('Cars subscription error:', err);
  });
}

export async function addCar(data) {
  const docRef = await addDoc(carsCol, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return docRef.id;
}

export async function updateCar(id, data) {
  const ref = doc(db, 'cars', id);
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
}

export async function deleteCar(id) {
  await deleteDoc(doc(db, 'cars', id));
}

// ── Inquiries ──
export function subscribeInquiries(callback) {
  const q = query(inquiriesCol, orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(items);
  }, (err) => {
    console.error('Inquiries subscription error:', err);
  });
}

export async function addInquiry(data) {
  const docRef = await addDoc(inquiriesCol, {
    ...data,
    createdAt: serverTimestamp()
  });
  return docRef.id;
}

export async function updateInquiry(id, data) {
  const ref = doc(db, 'inquiries', id);
  await updateDoc(ref, data);
}

export async function deleteInquiry(id) {
  await deleteDoc(doc(db, 'inquiries', id));
}
