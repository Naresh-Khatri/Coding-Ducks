import { User, UserCredential } from "firebase/auth";
import { useRouter } from "next/router";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import {
  signInWithGoogle,
  auth,
  logout as logoutFromFirebase,
  registerWithEmailAndPassword,
  logInWithEmailAndPassword,
  sendPasswordReset,
} from "../firebase/firebase";
import axios from "../lib/axios";
import { IUser } from "../types";

interface userContextProps {
  user: IUser;
  loading: boolean;
  error: any;
  firebaseUser: User;
  logout: () => void;
  signInWithGoogle: () => Promise<User>;
  registerWithEmailAndPassword: (
    email: string,
    password: string
  ) => Promise<UserCredential>;
  logInWithEmailAndPassword: (email: string, password: string) => Promise<User>;
  sendPasswordReset: (email: string) => Promise<void>;
  updateUser: (updatedUser: any) => Promise<void>;
  loadUser: () => void;
}
export const userContext = createContext({} as userContextProps);

export function AuthUserProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, loading, error] = useAuthState(auth);
  const [completeUser, setCompleteUser] = useState({});

  const updateUser = async (updatedUser) => {
    try {
      const res = await axios.patch(`/users/`, {
        ...updatedUser,
        googleUID: user.uid,
      });
      setCompleteUser(res.data);
    } catch (error) {
      console.log(error);
      // reject(error);
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
      isNoob: user.isNoob,
      registeredAt: user.registeredAt,
      lastLoginAt: user.lastLoginAt,
    };
    setCompleteUser(obj);
  };
  const loadUser = async () => {
    try {
      if (!loading) {
        // check if user is stored in db
        if (user) {
          // console.log('firebase user', user)
          axios
            .get(`/users/${user.uid}`)
            .then((res) => {
              // console.log("user changed", res.data);
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
          // if (router.pathname !== "/") router.push("/login");
        }
      }
    } catch (err) {}
  };
  useEffect(() => {
    loadUser();
  }, [user, loading]);

  const logout = () => {
    logoutFromFirebase();
    setCompleteUser({});
  };

  return (
    <userContext.Provider
      value={{
        user: completeUser as IUser,
        firebaseUser: user as any,
        loading,
        error,
        signInWithGoogle,
        registerWithEmailAndPassword,
        logInWithEmailAndPassword,
        sendPasswordReset,
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
