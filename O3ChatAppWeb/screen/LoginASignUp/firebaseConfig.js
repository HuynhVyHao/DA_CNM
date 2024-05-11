import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

const firebaseConfig = {
  apiKey : "AIzaSyB3YLnBXhT2xOT_hCt8R_v2tZhUPRE7Pv4" , 
  authDomain : "otp-vyhao.firebaseapp.com" , 
  projectId : "otp-vyhao" , 
  storageBucket : "otp-vyhao.appspot.com" , 
  messagingSenderId : "448813187392" , 
  appId : "1:448813187392:web:60965d840994f5872b7aa5" , 
  measurementId : "G-PLXWDJHG1F" 
};
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
} else {
  firebase.app();
}
export { firebaseConfig };

