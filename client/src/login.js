import { useState } from "react";
import { useNavigate } from "react-router";
import useLocalStorage from "./hooks/useLocalStorage";
import Navbar from "./components/Navbar";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./Login.css";

function Login({ isLogin }) {
  const [token, setToken] = useLocalStorage("token");
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(!isLogin);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });

  const toggleForm = () => {
    setIsSignup(!isSignup);
    setFormData({ username: "", email: "", password: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const endpoint = isSignup ? "/auth/signup" : "/auth/login";
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        mode: "cors",
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorJson = await res.json();
        toast.error(errorJson.message || "Incorrect username or password", {
          position: "top-right",
          autoClose: 5000,
        });
        setToken({}); // ensure no stale token
        return {};
      }

      const data = await res.json();
      setToken(data.accessToken);
      navigate("/");
    } catch (err) {
      toast.error("Network error, please try again", {
        position: "top-right",
        autoClose: 5000,
      });
      setToken({});
      return {};
    }
  };

  return (
    <>
      <Navbar />
      <div className="Login">
        <ToastContainer />
        <div className="auth-container">
          <h2>{isSignup ? "Sign Up" : "Login"}</h2>
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                name="username"
                value={formData.username}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, username: e.target.value }))
                }
                required
              />
            </div>

            {isSignup && (
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                name="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, password: e.target.value }))
                }
                required
              />
            </div>

            <button type="submit" className="btn primary">
              {isSignup ? "Sign Up" : "Login"}
            </button>
          </form>

          <p className="switch-text">
            {isSignup ? "Already have an account?" : "Don’t have one?"}{" "}
            <button type="button" onClick={toggleForm} className="link-btn">
              {isSignup ? "Login" : "Sign Up"}
            </button>
          </p>
        </div>
      </div>
    </>
  );
}

export default Login;