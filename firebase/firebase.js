import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {
  GoogleAuthProvider,
  getAuth,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAdJDHUQaj8n8fr7etf-fs6XGzCJj9Jxuk",
  authDomain: "coding-ducks.firebaseapp.com",
  projectId: "coding-ducks",
  storageBucket: "coding-ducks.appspot.com",
  messagingSenderId: "860368859150",
  appId: "1:860368859150:web:cf7028f6fe11f67a3bcc5f",
  measurementId: "G-LNDQQ0RCC5",
};
// const firebaseConfig = {
//   apiKey: "AIzaSyBNxGSzXlVfHdUBodnNssbITxASlizlvXA",
//   authDomain: "hackoverflow-3e2f0.firebaseapp.com",
//   projectId: "hackoverflow-3e2f0",
//   storageBucket: "hackoverflow-3e2f0.appspot.com",
//   messagingSenderId: "770731497160",
//   appId: "1:770731497160:web:be9b01628bca737be7f7fd",
//   measurementId: "G-N7KM04BG24"
// };

const googleProvider = new GoogleAuthProvider();

const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
const auth = getAuth(app);
const signInWithGoogle = async () => {
  try {
    const res = await signInWithPopup(auth, googleProvider);
    const user = res.user;
    return user;
  } catch (err) {
    console.error(err);
    // alert(err.message);
  }
};

const logInWithEmailAndPassword = async (email, password) => {
  return new Promise(async (resolve, reject) => {
    try {
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      console.error(err);
      reject(err.message);
    }
  });
};
const registerWithEmailAndPassword = async (email, password) => {
  try {
    return await createUserWithEmailAndPassword(auth, email, password);
  } catch (err) {
    console.error(err);
    alert(err.message);
  }
};
const sendPasswordReset = async (email) => {
  return new Promise(async (resolve, reject)=>{
    try {
      return resolve(await sendPasswordResetEmail(auth, email))
    } catch (err) {
      reject(err.message);
    }
  })
};
const logout = () => {
  console.log("logging out");
  signOut(auth);
};

export {
  signInWithGoogle,
  logInWithEmailAndPassword,
  registerWithEmailAndPassword,
  sendPasswordReset,
  logout,
  auth,
};
