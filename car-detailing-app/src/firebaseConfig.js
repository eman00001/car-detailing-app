// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCiB45-U0TBrNa9idRQ5uFbSlykzPnswd8",
    authDomain: "car-detailing-app-17a18.firebaseapp.com",
    projectId: "car-detailing-app-17a18",
    storageBucket: "car-detailing-app-17a18.firebasestorage.app",
    messagingSenderId: "808892731878",
    appId: "1:808892731878:web:19d97bc7198fddf298c627"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const firebase_auth = getAuth(app);
export const db = getFirestore(app);