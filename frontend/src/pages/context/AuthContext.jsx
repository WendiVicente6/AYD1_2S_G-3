import { createContext, useContext, useEffect, useState } from "react";
import { getMe, getStoredUser, login as loginRequest, logout as logoutRequest } from "../../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({children}) {
  const [user, setUser] = useState(getStoredUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function validate() {
      if (!getStoredUser()) { setLoading(false); return; }
      try { setUser(await getMe()); }
      catch { logoutRequest(); setUser(null); }
      finally { setLoading(false); }
    }
    validate();
  }, []);

  async function login(correo, password) {
    const currentUser = await loginRequest(correo, password);
    setUser(currentUser);
    return currentUser;
  }
  function logout() { logoutRequest(); setUser(null); }

  return <AuthContext.Provider value={{user, loading, login, logout}}>{children}</AuthContext.Provider>;
}
export function useAuth() { return useContext(AuthContext); }
