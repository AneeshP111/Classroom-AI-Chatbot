import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check local storage for existing session
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const email = localStorage.getItem('email');
    const name = localStorage.getItem('name');
    const points = parseInt(localStorage.getItem('points') || '0', 10);
    if (token && role && email) {
      setUser({ token, role, email, name, points });
    }
  }, []);

  const login = (token, role, email, name, points) => {
    localStorage.setItem('token', token);
    localStorage.setItem('role', role);
    localStorage.setItem('email', email);
    if (name) localStorage.setItem('name', name);
    localStorage.setItem('points', points || 0);
    setUser({ token, role, email, name, points: points || 0 });
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  const updateProfileName = (newName) => {
    if (user) {
      if (newName) {
        localStorage.setItem('name', newName);
      } else {
        localStorage.removeItem('name');
      }
      setUser(prev => ({ ...prev, name: newName }));
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateProfileName }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
