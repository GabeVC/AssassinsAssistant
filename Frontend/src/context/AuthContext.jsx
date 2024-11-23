import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../firebaseConfig';
import { onAuthStateChanged, signOut } from 'firebase/auth';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

/**
 * This component handles providing the rest of the application with the authentication status of the current user
 * 
 * @param {Component} children - The children components the application is trying to display
 * @returns {React.JSX.Element} A React element that displays children to authenticated users.
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen to authentication state changes
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const logout = () => {
    signOut(auth);
  };

  const value = {
    user,
    loading,
    logout,
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};
