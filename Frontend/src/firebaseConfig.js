import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: "AIzaSyB4y3yfS6tJJCpRXVe949pi7leApKZiDYU",
    authDomain: "assassin-assistant.firebaseapp.com",
    projectId: "assassin-assistant",
    storageBucket: "assassin-assistant.firebasestorage.app",
    appId: "1:952299863654:web:8427f055abc34562ddf7a7",
    measurementId: "G-6Z3NGK0QX5"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app); 
export const db = getFirestore(app);
export const storage = getStorage(app);

