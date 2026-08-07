import React, { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (token && userData) {
      try {
        const parsed = JSON.parse(userData);
        // Attach a compatibility getIdToken method (mimics Firebase API)
        const shaped = {
          ...parsed,
          getIdToken: async (force) => token,
          uid: parsed.id || parsed._id || parsed.uid || null,
          displayName: parsed.name || parsed.displayName || '',
          phoneNumber: parsed.phone || parsed.phoneNumber || '',
          email: parsed.email || parsed.email || ''
        };
        setUser(shaped);
      } catch (err) {
        setUser(null);
      }
    }

    setLoading(false);
  }, []);

  const login = (token, user) => {
    localStorage.setItem("token", token);
    const shapedUser = {
      ...user,
      getIdToken: async (force) => token,
      uid: user.id || user._id || user.uid || null,
      displayName: user.name || user.displayName || '',
      phoneNumber: user.phone || user.phoneNumber || '',
      email: user.email || user.email || ''
    };
    localStorage.setItem("user", JSON.stringify(user));
    setUser(shapedUser);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isLoggedIn: !!user,
        login,
        logout,
        // Convenience method for components to get the current token
        getToken: async () => {
          try {
            if (user && typeof user.getIdToken === 'function') return await user.getIdToken();
            const t = localStorage.getItem('token');
            return t;
          } catch (e) {
            return null;
          }
        }
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};
