import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'

const LandingPage = () => {

  return (
    <div className="landing-page">
      <header>
        <h1>Assassins Assistant</h1>
        <p>Welcome to the ultimate Assassins game management app!</p>
      </header>
      <main>
        <p>
          Join games, receive your target, eliminate opponents, and climb the leaderboard!
        </p>
        <div className="auth-buttons">
          <Link to="/login">
            <button className="login-button">Log In</button>
          </Link>
          <Link to="/register">
            <button className="register-button">Register</button>
          </Link>
        </div>
      </main>
    </div>
  );
};

export default LandingPage;
