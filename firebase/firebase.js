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

import {
  getFirestore,
  query,
  getDocs,
  collection,
  where,
  addDoc,
} from "firebase/firestore";

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
const db = getFirestore(app);

const signInWithGoogle = async () => {
  try {
    const res = await signInWithPopup(auth, googleProvider);
    const user = res.user;
    // console.log(user);

    // const q = query(collection(db, "users"), where("uid", "==", user.uid));
    // const docs = await getDocs(q);
    // console.log(docs);
    // if (docs.docs.length === 0) {
    //   await addDoc(collection(db, "users"), {
    //     uid: user.uid,
    //     photoURL: user.photoURL,
    //     name: user.displayName,
    //     authProvider: "google",
    //     email: user.email,
    //   });
    // }
  } catch (err) {
    console.error(err);
    // alert(err.message);
  }
};

const logInWithEmailAndPassword = async (email, password) => {
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (err) {
    console.error(err);
    alert(err.message);
  }
};
const registerWithEmailAndPassword = async (name, email, password) => {
  try {
    const res = await createUserWithEmailAndPassword(auth, email, password);
    const user = res.user;
    await addDoc(collection(db, "users"), {
      uid: user.uid,
      name,
      authProvider: "local",
      email,
    });
  } catch (err) {
    console.error(err);
    alert(err.message);
  }
};
const sendPasswordReset = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    alert("Password reset link sent!");
  } catch (err) {
    console.error(err);
    alert(err.message);
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
