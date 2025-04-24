// Firebase configuration for Game Hub
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyABC123_REPLACE_WITH_YOUR_ACTUAL_KEY",
  authDomain: "game-hub-users.firebaseapp.com",
  projectId: "game-hub-users",
  storageBucket: "game-hub-users.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abc123def456ghi789jkl",
  databaseURL: "https://game-hub-users-default-rtdb.firebaseio.com"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { database };