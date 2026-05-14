import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyCAS2cHo75fQSQr6xA6pN9xzE4utKJ_WjA",
    authDomain: "udayan-smp.firebaseapp.com",
    projectId: "udayan-smp",
    storageBucket: "udayan-smp.firebasestorage.app",
    messagingSenderId: "1020263527496",
    appId: "1:1020263527496:web:9bdadcb6f9d6f23ce3147d"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;