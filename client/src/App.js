import { useEffect, useState } from "react";
import "./App.css";
import { useNavigate } from "react-router";
import useLocalStorage from "./hooks/useLocalStorage";
import Navbar from "./components/Navbar";

function App() {
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [token, setToken] = useLocalStorage("token");

  useEffect(() => {
    fetch("/auth/verify", {
      headers: { Authorization: `Bearer ${token}` },
      credentials: "include",
      mode: "cors",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.accessToken) {
          setToken(data.accessToken);
        } else {
          navigate("/login");
        }
      });
  }, [token, navigate, setToken]);

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate(`/room/${text}`);
  };

  const handleCreate = () => {
    fetch("/createroom", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      credentials: "include",
      mode: "cors",
    })
      .then((res) => res.json())
      .then((data) => navigate(`/room/${data.roomId}`));
  };

  return (
    <>
      <Navbar />
      <div className="App">
        <div className="form-container">
          <h2>Join or Create a Room</h2>
          <form onSubmit={handleSubmit} className="room-form">
            <input
              type="text"
              placeholder="Enter Room Code"
              value={text}
              onChange={(e) => setText(e.target.value)}
              required
            />
            <div className="buttons">
              <button
                type="submit"
                className="btn primary"
                disabled={!text.trim()}
              >
                Join Room
              </button>
              <button
                type="button"
                className="btn secondary"
                onClick={handleCreate}
              >
                Create Room
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default App;
