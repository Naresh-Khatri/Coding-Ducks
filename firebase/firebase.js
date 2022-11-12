import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth'
import { getAnalytics } from "firebase/analytics";
const firebaseConfig = {
  apiKey: "AIzaSyAdJDHUQaj8n8fr7etf-fs6XGzCJj9Jxuk",
  authDomain: "coding-ducks.firebaseapp.com",
  projectId: "coding-ducks",
  storageBucket: "coding-ducks.appspot.com",
  messagingSenderId: "860368859150",
  appId: "1:860368859150:web:cf7028f6fe11f67a3bcc5f",
  measurementId: "G-LNDQQ0RCC5"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app)
const googleProvider = new GoogleAuthProvider();

const signInWithGoogle = async () => {
  try {
    const res = await signInWithPopup(auth, googleProvider)
    console.log(res)
    //TODO: save user to db
  } catch (err) {
    console.log(err)
  }
}

const logout = () => {
  signOut(auth);
}

export {
  auth,
  signInWithGoogle,
  logout,
};