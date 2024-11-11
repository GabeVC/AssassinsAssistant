import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

import './Navbar.css';

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