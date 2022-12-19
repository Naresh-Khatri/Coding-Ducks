import { useRouter } from "next/router";
import { createContext, useContext, Context, useState, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import {
  signInWithGoogle,
  auth,
  logout as logoutFromFirebase,
} from "../firebase/firebase";
import axios from "../utils/axios";

export const userContext = createContext({
  user: null,
  loading: null,
  error: null,
  logout: null,
  signInWithGoogle: null,
  logout: null,
  updateUser: null,
  loadUser: null,
});

const saveInCookie = (user) => {
  //save user in cookie on client side
  if (typeof window !== "undefined") {
    document.cookie = `token=${user.accessToken}; path=/`;
    // console.log("cookie", user.accessToken);
    // console.log("cookie", document.cookie);
  }
};

export function AuthUserProvider({ children }) {
  const router = useRouter();
  const [user, loading, error] = useAuthState(auth);
  const [completeUser, setCompleteUser] = useState({});

  const updateUser = async (updatedUser) => {
    try {
      const res = await axios.patch(`/users/`, {
        ...updatedUser,
        googleUID: user.googleUID || user.uid,
      });
      setCompleteUser(res.data);
    } catch (error) {
      console.log(error);
      reject(error);
    }
  };

  const makeUserObject = async (user) => {
    const obj = {
      id: user.id || null,
      roll: user.roll,
      fullname: user.fullname,
      username: user.username,
      email: user.email,
      followedBy: user.followedBy,
      following: user.following,
      photoURL: user.photoURL,
      googleUID: user.uid || user.googleUID,
      isAdmin: user.isAdmin || false,
      registeredAt: user.registeredAt,
      lastLoginAt: user.lastLoginAt,
    };
    setCompleteUser(obj);
  };
  useEffect(() => {
    loadUser();
  }, [user, loading]);
  const loadUser = async () => {
    try {
      if (!loading) {
        // check if user is stored in db
        if (user) {
          saveInCookie(user);
          axios
            .get(`/users/${user.uid}`)
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
        } else {
          console.log("user is null");
          router.push("/login");
        }
      }
    } catch (err) {}
  };

  const logout = () => {
    logoutFromFirebase();
    setCompleteUser({});
    axios.get(`/users/${user.uid}`);
  };

  return (
    <userContext.Provider
      value={{
        user: completeUser,
        firebaseUser: user,
        loading,
        error,
        signInWithGoogle,
        logout,
        updateUser,
        loadUser,
      }}
    >
      {children}
    </userContext.Provider>
  );
}
// custom hook to use the userContext and access authUser and loading
export const useAuth = () => useContext(userContext);
