import { createContext, useContext, Context } from 'react'
// import useFirebaseAuth from '../hooks/useFirebase';

const authUserContext = createContext({
  authUser: null,
  loading: true
});

export function AuthUserProvider({ children }) {
  // const auth = useFirebaseAuth();
  return <authUserContext.Provider value={{}}>{children}</authUserContext.Provider>;
}
// custom hook to use the authUserContext and access authUser and loading
export const useAuth = () => useContext(authUserContext);