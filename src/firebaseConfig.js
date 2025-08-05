// src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";



const firebaseConfig = {
  apiKey: "AIzaSyA_2MX1zGPAcmH7gkEyeg3uuIBm4nXa-lg",
  authDomain: "lab-reports-f8033.firebaseapp.com",
  projectId: "lab-reports-f8033",
  storageBucket: "lab-reports-f8033.appspot.com",
  messagingSenderId: "883860381287",
  appId: "1:883860381287:web:e7fb8a5963d8d29a74bec2",
  measurementId: "G-EQFYZ22R8N"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
