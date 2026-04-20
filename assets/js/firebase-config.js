import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore }  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth }       from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey:            "AIzaSyD9DjzvAxR_ST_4liqaLM-zngkI1K9AYwk",
  authDomain:        "bloodlink-781c4.firebaseapp.com",
  projectId:         "bloodlink-781c4",
  storageBucket:     "bloodlink-781c4.firebasestorage.app",
  messagingSenderId: "565462585503",
  appId:             "1:565462585503:web:1d1877ee58066d50ad92aa"
};

const app = initializeApp(firebaseConfig);
export const db   = getFirestore(app);
export const auth = getAuth(app);
