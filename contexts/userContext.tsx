import { User, UserCredential } from "firebase/auth";
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
import { useRouter as useOldRouter } from "next/router";
import { useRouter as useNewRouter, useSearchParams } from "next/navigation";

interface userContextProps {
  user: IUser | null;
  loading: boolean;
  userLoaded: boolean;
  error: any;
  firebaseUser: User;
  logout: () => void;
  signInWithGoogle: () => Promise<User>;
  registerWithEmailAndPassword: (
    email: string,
    password: string
  ) => Promise<UserCredential | undefined>;
  logInWithEmailAndPassword: (email: string, password: string) => Promise<User>;
  sendPasswordReset: (email: string) => Promise<void>;
  updateUser: (updatedUser: any) => Promise<void>;
  loadUser: () => void;
}
export const userContext = createContext({} as userContextProps);

export function AuthUserProvider({ children }: { children: ReactNode }) {
  const [user, loading, error] = useAuthState(auth);
  const [completeUser, setCompleteUser] = useState<IUser | null>(null);
  const [userLoaded, setUserLoaded] = useState(false);

  // const oldRouter = useOldRouter();
  const newRouter = useNewRouter();
  const fromRoute = useSearchParams()?.get("from");
  const updateUser = async (updatedUser) => {
    try {
      if (!user) return;
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

  const makeUserObject = (user) => {
    return {
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
  };
  const loadUser = async () => {
    try {
      if (!loading) {
        // check if user is stored in db
        if (user) {
          // console.log("firebase user", user);
          try {
            const { data } = await axios.get(`/users/${user.uid}`);
            if (data.length == 0) {
              // if user doesnt exist, redirect to setup-profile
              // if(oldRouter) oldRouter.push("/setup-profile");
              if (newRouter) {
                if (fromRoute)
                  newRouter.push("/setup-profile/?from=" + fromRoute);
                else newRouter.push("/setup-profile");
              }
            } else {
              // if user exist in db then set completeUser to the user object
              // console.log(res.data)
              const usr = makeUserObject(data);
              setCompleteUser(usr);
            }
          } catch (err) {
            console.log(err);
          } finally {
            setUserLoaded(true);
          }
        } else {
          console.log("user is null");
          setUserLoaded(true);
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
    setCompleteUser(null);
  };

  return (
    <userContext.Provider
      value={{
        user: completeUser,
        firebaseUser: user as any,
        loading,
        userLoaded,
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
