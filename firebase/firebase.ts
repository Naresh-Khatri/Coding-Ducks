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
  User,
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

const googleProvider = new GoogleAuthProvider();

const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
const auth = getAuth(app);
const signInWithGoogle = async (): Promise<User> => {
  try {
    const res = await signInWithPopup(auth, googleProvider);
    const user = res.user as User;
    return user;
  } catch (err) {
    console.error(err);
    return err;
  }
};

const logInWithEmailAndPassword = async (
  email: string,
  password: string
): Promise<User> => {
  return new Promise(async (resolve, reject) => {
    try {
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      console.error(err);
      reject(err.message);
    }
  });
};
const registerWithEmailAndPassword = async (
  email: string,
  password: string
) => {
  try {
    return await createUserWithEmailAndPassword(auth, email, password);
  } catch (err) {
    console.error(err);
    alert(err.message);
  }
};
const sendPasswordReset = async (email: string): Promise<void> => {
  try {
    return await sendPasswordResetEmail(auth, email);
  } catch (err) {
    return err.message;
  }
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
