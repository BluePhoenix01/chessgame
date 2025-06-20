import { useEffect, useState } from "react";
import { Chessboard } from "react-chessboard";
import { useNavigate } from "react-router";
import useLocalStorage from "./hooks/useLocalStorage";
import Navbar from "./components/Navbar";
import "./DashBoard.css";

function Dashboard() {
  const startingPosition =
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
  const navigate = useNavigate();
  const [token, setToken] = useLocalStorage("token");
  const [user, setUser] = useState(null);
  const [games, setGames] = useState([]);
  const [lastPage, setLastPage] = useState(false);
  const [page, setPage] = useState(1);
  const [fen, setFen] = useState(startingPosition);
  const [roomIdInput, setRoomIdInput] = useState("");

  useEffect(() => {
    fetch("/user", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then(setUser);
  }, [token]);

  useEffect(() => {
    fetch(`/user/games?page=${page}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setLastPage(data.lastPage);
        setGames(data.games || []);
      });
  }, [page, token]);

  const createRoom = async () => {
    const res = await fetch("/createroom", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    navigate(`/room/${data.roomId}`);
  };

  const joinRoom = () => {
    if (roomIdInput.trim()) navigate(`/room/${roomIdInput}`);
  };

  return (
    <>
      <Navbar />
      <div className="dashboard">
        <div className="top-panel">
          <div className="room-actions">
            <input
              type="text"
              placeholder="Enter Room ID"
              value={roomIdInput}
              onChange={(e) => setRoomIdInput(e.target.value)}
            />
            <button onClick={joinRoom}>Join Room</button>
            <button onClick={createRoom}>Create Room</button>
          </div>
        </div>

        <div className="main-section">
          <div className="chess-freeplay">
            <h3>Freeplay Board</h3>
            <Chessboard
              position={fen}
              onPieceDrop={(s, t) => {
                // simulate move without backend
                setFen((prev) => {
                  try {
                    const { Chess } = require("chess.js");
                    const game = new Chess(prev);
                    game.move({ from: s, to: t, promotion: "q" });
                    return game.fen();
                  } catch {
                    return prev;
                  }
                });
                return true;
              }}
            />
            <button className="reset-button" onClick={() => setFen(startingPosition)}>
              Reset Board
            </button>
          </div>

          <div className="game-history">
            <h3>Your Game History</h3>
            <ul>
              {games.map((game, i) => (
                <li key={i}>
                  {game.white_username} vs {game.black_username} - {game.result}
                  <button onClick={() => setFen(game.fen)}>View</button>
                </li>
              ))}
            </ul>
            <div className="pagination">
              <button onClick={() => setPage(page - 1)} disabled={page === 1}>
                Prev
              </button>
              <span>Page {page}</span>
              <button onClick={() => setPage(page + 1)} disabled={lastPage}>
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Dashboard;
