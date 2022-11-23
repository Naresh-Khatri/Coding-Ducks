import axios from "axios";
import { useRouter } from "next/router";
import { createContext, useContext, Context, useState, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { signInWithGoogle, auth, logout } from "../firebase/firebase";

export const userContext = createContext({
  user: null,
  loading: null,
  error: null,
  logout: null,
  signInWithGoogle: null,
  updateUser: null,
});

export function AuthUserProvider({ children }) {
  const router = useRouter();
  const [user, loading, error] = useAuthState(auth);
  const [completeUser, setCompleteUser] = useState({});

  const updateUser = async (updatedUser) => {
    try {
      const res = await axios.patch(`http://localhost:3333/users/`, {
        ...updatedUser,
        googleUID: user.googleUID || user.uid,
      });
      console.log(res.data);
      setCompleteUser(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  const makeUserObject = async (user) => {
    const obj = {
      id: user.id || null,
      roll: user.roll,
      fullname: user.fullname,
      username: user.username,
      email: user.email,
      photoURL: user.photoURL,
      googleUID: user.uid || user.googleUID,
      isAdmin: user.isAdmin || false,
      registeredAt: user.registeredAt,
      lastLoginAt: user.lastLoginAt,
    };
    setCompleteUser(obj);
  };
  useEffect(() => {
    // check if user is stored in db
    if (user) {
      axios
        .get(`http://localhost:3333/users/${user.uid}`)
        .then((res) => {
          console.log("user changed", res.data);

          if (res.data.length == 0) {
            // if user doesnt exist, redirect to setup-profile
            router.push("/setup-profile");
          } else {
            // if user exist in db then set completeUser to the user object
            // console.log(res.data)
            makeUserObject(res.data);
          }
        })
        .catch((err) => {
          console.log(err);
        });
    }
  }, [user, loading]);

  return (
    <userContext.Provider
      value={{
        user: completeUser,
        firebaseUser: user,
        loading,
        error,
        logout,
        signInWithGoogle,
        updateUser,
      }}
    >
      {children}
    </userContext.Provider>
  );
}
// custom hook to use the userContext and access authUser and loading
export const useAuth = () => useContext(userContext);
