import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

import './Navbar.css';

/**
 * This component handles the navigation bar
 * 
 * @returns {React.JSX.Element} A React element that allows users to return to the previous page
 */
const Navbar = () => {
    const navigate = useNavigate();
  return (
    <nav>
    
      <button className="back-button" onClick={() => navigate('/')}>Home</button>
      <img className="logo" src="https://imgur.com/QWvbAwI.png"></img>
    </nav>
  );
};

export default Navbar;