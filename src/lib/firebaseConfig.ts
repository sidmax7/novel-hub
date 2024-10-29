import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBWaLClR-ku8oX8107XTYnRsEaxnY91Rs8",
  authDomain: "novellize-prod.firebaseapp.com",
  projectId: "novellize-prod",
  storageBucket: "novellize-prod.appspot.com",
  messagingSenderId: "181449929359",
  appId: "1:181449929359:web:148da2fee21b293dfdf6fa",
  measurementId: "G-H19YC33XEH"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

