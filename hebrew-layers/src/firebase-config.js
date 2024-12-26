import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyA8E0_5d6qg0Ymu88LhwsMlmBbS2VQo4vs",
  authDomain: "revadim-dc24c.firebaseapp.com",
  databaseURL: "https://revadim-dc24c-default-rtdb.firebaseio.com",
  projectId: "revadim-dc24c",
  storageBucket: "revadim-dc24c.firebasestorage.app",
  messagingSenderId: "2601721759",
  appId: "1:2601721759:web:9c5bf41cea9484086c67aa",
  measurementId: "G-CMM6E9N0W8"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);