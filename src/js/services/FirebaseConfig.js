// Firebase configuration for Game Hub

// Using the Firebase imports from the window object
// This ensures compatibility with the CDN approach
let initializeApp, getDatabase;
if (window.firebaseImports) {
  initializeApp = window.firebaseImports.initializeApp;
  getDatabase = window.firebaseImports.getDatabase;
} else {
  console.error("Firebase imports not available on window object");
}

// Firebase configuration for a demo project
// This is using a public demo project - for production, you should replace with your own Firebase project
const firebaseConfig = {
  apiKey: "AIzaSyDGNTZh4kBS23TSlaSXPQGRQQHBr5tzRCk",
  authDomain: "gamehub-demo.firebaseapp.com",
  databaseURL: "https://gamehub-demo-default-rtdb.firebaseio.com",
  projectId: "gamehub-demo",
  storageBucket: "gamehub-demo.appspot.com",
  messagingSenderId: "309027550957",
  appId: "1:309027550957:web:5c8e3ecc9eb610f2a60cb3"
};

// Initialize Firebase
let app;
let database;

try {
  if (initializeApp && getDatabase) {
    app = initializeApp(firebaseConfig);
    database = getDatabase(app);
    console.log("Firebase initialized successfully");
  } else {
    throw new Error("Firebase SDK functions not available");
  }
} catch (error) {
  console.error("Error initializing Firebase:", error);
  // Create a fallback object to prevent app crashes
  database = {
    _isFallback: true
  };
}

export { database };