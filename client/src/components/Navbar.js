import React, { useEffect, useState } from 'react';
import './Navbar.css';
import useLocalStorage from '../hooks/useLocalStorage';
import { useNavigate } from 'react-router';
import { Link } from 'react-router';

function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useLocalStorage("token");
  const navigate = useNavigate();
  
  const handleAuthClick = () => {
    if (isLoggedIn) {
      setToken('');
      fetch('/auth/logout', {
        method: "POST",
        credentials: "include",
        mode: "cors",
      }).then(() => {
        setIsLoggedIn(false);
        navigate('/login');
      });
     } else {
      if (token && token !== "") {
        setIsLoggedIn(true);
      }
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
        <li><Link href="/">Home</Link></li>
      </ul>
      <button className="auth-button" onClick={handleAuthClick}>
        {isLoggedIn ? 'Logout' : 'Login'}
      </button>
    </nav>
  );
};

export default Navbar;