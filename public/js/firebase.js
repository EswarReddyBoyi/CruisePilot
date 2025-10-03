// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB9XUb5zPy7ejyjARL7fT7oIJ9tYTnMkPw",
  authDomain: "cruise-ship-management-a1839.firebaseapp.com",
  projectId: "cruise-ship-management-a1839",
  storageBucket: "cruise-ship-management-a1839.firebasestorage.app",
  messagingSenderId: "270396828481",
  appId: "1:270396828481:web:e962273aa5eed6c0334fc0",
  measurementId: "G-9J7NGXMM40"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
