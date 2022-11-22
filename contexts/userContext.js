import { createContext, useContext, Context } from "react";
// import useFirebaseAuth from '../hooks/useFirebase';

export const userContext = createContext({
  authUser: null,
  loading: true,
});

export function AuthUserProvider({ children }) {
  // const auth = useFirebaseAuth();
  return (
    <userContext.Provider value={{}}>{children}</userContext.Provider>
  );
}
// custom hook to use the userContext and access authUser and loading
export const useAuth = () => useContext(userContext);
