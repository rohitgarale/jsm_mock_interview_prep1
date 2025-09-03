import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyD27ASgkMLjysEeM137JPkqUsvzKZtgr6U",
    authDomain: "prepai-16cb7.firebaseapp.com",
    projectId: "prepai-16cb7",
    storageBucket: "prepai-16cb7.firebasestorage.app",
    messagingSenderId: "671603887068",
    appId: "1:671603887068:web:4f7435d8994204e2231d19",
    measurementId: "G-L0JWKJZE4D",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
