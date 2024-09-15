import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: "AIzaSyDNLW6B1Twtz--zRNIhxyJ8ercYUtMRdPU",

  authDomain: "novel-hub-34b1b.firebaseapp.com",

  projectId: "novel-hub-34b1b",

  storageBucket: "novel-hub-34b1b.appspot.com",

  messagingSenderId: "76649685525",

  appId: "1:76649685525:web:3c3c98bfbbbcf394f4641c"

};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);


