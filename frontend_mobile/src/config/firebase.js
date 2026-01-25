import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCLAJf2jzx-CT6AgQWkKu0iTymukdRz5iM",
  authDomain: "crayai.firebaseapp.com",
  projectId: "crayai",
  storageBucket: "crayai.firebasestorage.app",
  messagingSenderId: "89631301641",
  appId: "1:89631301641:web:3a296a566be56a4ab398d8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize and Export the services
export const auth = getAuth(app); 
export const db = getFirestore(app); 
export const storage = getStorage(app);