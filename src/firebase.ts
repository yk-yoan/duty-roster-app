// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyD5GAQT_Ov5m7CSMKPUvuDoI9yq-tPgJ9M",
    authDomain: "duty-roster-app.firebaseapp.com",
    projectId: "duty-roster-app",
    storageBucket: "duty-roster-app.firebasestorage.app",
    messagingSenderId: "293877166747",
    appId: "1:293877166747:web:88eaf175a36e2501d84c3e",
    measurementId: "G-WBCT959705"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);