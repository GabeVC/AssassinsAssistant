import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const HomePage = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Failed to log out:", error);
    }
  };

return (
    <div className="home-page">
        <h1>Welcome to Assassins Assistant!</h1>

    
    <div className="navigation-buttons"> 
        <Link to="/profile">
        <button>Profile</button>
        </Link>
        <Link to="/games"> 
        <button>Games</button>
        </Link>
        <button onClick={handleLogout}>Logout</button>
      
        
    </div>
        <div>
            Active Games
        </div>
        <Link to ="/createGame">
            <button>Create new Game</button>
        </Link>
    </div>
    );
};

export default HomePage;
