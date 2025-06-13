import React, { useEffect, useState } from "react";
import "./Navbar.css";
import useLocalStorage from "../hooks/useLocalStorage";
import { useNavigate } from "react-router";
import { Link } from "react-router";

function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useLocalStorage("token");
  const navigate = useNavigate();

  const handleAuthClick = () => {
    if (isLoggedIn) {
      setToken("");
      fetch("/auth/logout", {
        method: "POST",
        credentials: "include",
        mode: "cors",
      }).then(() => {
        setIsLoggedIn(false);
        navigate("/login");
      });
    } else {
      if (token && token !== "") {
        setIsLoggedIn(true);
      }
      navigate("/login");
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
      <Link to="/" className="home-link">
        <div className="navbar-logo">ChessMate</div>
      </Link>
      <ul className="navbar-links">
        <button className="auth-button" onClick={handleAuthClick}>
          {isLoggedIn ? "Logout" : "Login"}
        </button>
      </ul>
    </nav>
  );
}

export default Navbar;