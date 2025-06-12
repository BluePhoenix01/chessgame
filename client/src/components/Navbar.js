import React, { useEffect, useState } from 'react';
import './Navbar.css';
import useLocalStorage from '../hooks/useLocalStorage';
import { useNavigate } from 'react-router';

function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useLocalStorage("token");
  const navigate = useNavigate();
  
  const handleAuthClick = () => {
    setIsLoggedIn(prev => !prev);
    if (isLoggedIn) {
      setToken('');
      fetch('/auth/logout', {
        method: "POST",
        credentials: "include",
        mode: "cors",
      }).then(() => {
        navigate('/login');
      });
     } else {
      navigate('/login');
    }
  };

  useEffect(() => {
    if (token && token !== "") {
      setIsLoggedIn(true);
    } else {
      setIsLoggedIn(false);
    }
  }, [token]);
  
  return (
    <nav className="navbar">
      <div className="navbar-logo">ChessMate</div>
      <ul className="navbar-links">
        <li><a href="/">Home</a></li>
      </ul>
      <button className="auth-button" onClick={handleAuthClick}>
        {isLoggedIn ? 'Logout' : 'Login'}
      </button>
    </nav>
  );
};

export default Navbar;