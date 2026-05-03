import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDh4qQ5o0-ya3BeJpLX9smE9NfXYuZCsgo",
  authDomain: "equest-8c97a.firebaseapp.com",
  projectId: "equest-8c97a",
  storageBucket: "equest-8c97a.firebasestorage.app",
  messagingSenderId: "7265902165",
  appId: "1:7265902165:web:cdf8e87a081b3f506c3edc",
  measurementId: "G-QL55G2BJ51"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
