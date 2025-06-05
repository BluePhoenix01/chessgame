import React, { useState } from "react";
import { useNavigate } from "react-router";

function Login() {
  let navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });

  const toggleForm = () => {
    setIsSignup(!isSignup);
    setFormData({ username: "", email: "", password: "" }); // reset fields
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSignup) {
      fetch("http://localhost:3001/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      }).then((res) => {
        if (res.ok) {
          navigate("/");
        } else {
          navigate("/login");
        }
      });
    } else {
      fetch("http://localhost:3001/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      }).then((res) => {
        if (res.ok) {
          navigate("/");
        } else {
          navigate("/login");
        }
      });
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "auto", marginTop: "100px" }}>
      <h2>{isSignup ? "Sign Up" : "Login"}</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "10px" }}>
          <label>Username:</label>
          <br />
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
          />
        </div>

        {isSignup && (
          <div style={{ marginBottom: "10px" }}>
            <label>Email:</label>
            <br />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
        )}

        <div style={{ marginBottom: "10px" }}>
          <label>Password:</label>
          <br />
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>

        <button type="submit">{isSignup ? "Sign Up" : "Login"}</button>
      </form>

      <p style={{ marginTop: "10px" }}>
        {isSignup ? "Already have an account?" : "Don’t have an account?"}{" "}
        <button
          onClick={toggleForm}
          style={{
            color: "blue",
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
        >
          {isSignup ? "Login" : "Sign Up"}
        </button>
      </p>
    </div>
  );
}

export default Login;
