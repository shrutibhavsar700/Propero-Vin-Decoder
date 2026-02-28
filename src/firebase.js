// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";      
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAwd6uKfPFH_-CmfsFSq4xniv1nB0bRfvU",
  authDomain: "propero-vin-decoder.firebaseapp.com",
  projectId: "propero-vin-decoder",
  storageBucket: "propero-vin-decoder.firebasestorage.app",
  messagingSenderId: "829289297734",
  appId: "1:829289297734:web:a0c035e7918e69b9f09747",
  measurementId: "G-4LS6YNV0HB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
//const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const db = getFirestore(app);
//export const analytics = getAnalytics(app);
export default app;