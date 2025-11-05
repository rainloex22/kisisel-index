// firebase-config.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-auth.js";
// Firestore'dan EK ALANLAR EKLENDİ
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, updateDoc } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js";


// firebase-config.js dosyanızın içindeki bu kısmı kontrol edin!

const firebaseConfig = {
  apiKey: "AIzaSyATqhJsWJGv3AxdvLmCKS-T9UlDycwhXys", // EN KRİTİK ALAN!
  authDomain: "baki-s2-hosting.firebaseapp.com",
  projectId: "baki-s2-hosting",
  storageBucket: "baki-s2-hosting.firebasestorage.app",
  messagingSenderId: "1096636788468",
  appId: "1:1096636788468:web:ef3365f47930ab98a738a1",
  // measurementId alanı olmasa da olur
};


// Firebase Servislerini Başlat
const app = initializeApp(firebaseConfig);
const auth = getAuth(app); 
const db = getFirestore(app); 


// Gerekli tüm fonksiyonları ve servisleri dışa aktar
export { 
    app, 
    auth, 
    db, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged, 
    doc, 
    setDoc,
    getDoc,
    // YENİ EKLENEN Firestore Fonksiyonları:
    collection, 
    getDocs, 
    updateDoc 
};
