import React, { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebaseConfig";
import { Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import LandingPage from "./components/LandingPage";
import LoginPage from "./components/LoginPage";
import RegisterPage from "./components/RegisterPage";
import HomePage from "./components/HomePage";
import ProfilePage from "./components/Profile";
import JoinGame from "./components/JoinGame";
import ProtectedRoute from "./components/ProtectedRoute";
import GamePage from "./components/GamePage";
import GameFeed from "./components/GameFeed";
import "./styles/globals.css";

/**
 * The application itself
 *
 * @returns {React.JSX.Element} The rest of the application.
 */
const App = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user); // Set the authenticated user
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="App">
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/home"
            element={
              <ProtectedRoute user={user}>
                <HomePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="//profile"
            element={
              <ProtectedRoute user={user}>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/games/:gameId"
            element={
              <ProtectedRoute user={user}>
                <GamePage />
              </ProtectedRoute>
            }
          />
          <Route path="/join/:gameId?" element={<JoinGame />} />
          <Route
            path="/gamefeed/:gameId"
            element={
              <ProtectedRoute user={user}>
                <GameFeed />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </div>
  );
};

export default App;
