// firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyB3iCFbKQ_UI6NbLlIPZ-BIEZQg-hf31dg",
  authDomain: "vyhao-e4c83.firebaseapp.com",
  databaseURL: "https://vyhao-e4c83-default-rtdb.firebaseio.com",
  projectId: "vyhao-e4c83",
  storageBucket: "vyhao-e4c83.appspot.com",
  messagingSenderId: "1089773270749",
  appId: "1:1089773270749:web:ccb1f37ef09287e5ea0d34",
  measurementId: "G-WZX5F28H1G"
};
// Khởi tạo Firebase App
// Khởi tạo Firebase App
const firebaseApp = initializeApp(firebaseConfig);

// Lấy đối tượng auth từ Firebase
const auth = getAuth(firebaseApp);

export { auth, firebaseApp };
