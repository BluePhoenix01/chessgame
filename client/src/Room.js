import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router";
import useLocalStorage from "./hooks/useLocalStorage";
import Navbar from "./components/Navbar";
import { Chessboard } from "react-chessboard";
import "./Room.css";
import ResignConfirm from "./components/ResignConfirm";

function Room() {
  const navigate = useNavigate();
  const { roomId } = useParams();
  const [token, setToken] = useLocalStorage("token");
  const [position, setPosition] = useState(
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
  );
  const [users, setUsers] = useState({
    white: null,
    black: null,
  });
  const [side, setSide] = useState("white");
  const [moveHistory, setMoveHistory] = useState([]);
  const [currentFen, setCurrentFen] = useState(null);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const ws = useRef(null);

  const groupedMoves = moveHistory.reduce((acc, move, index) => {
    const turnIndex = Math.floor(index / 2);
    if (!acc[turnIndex])
      acc[turnIndex] = { number: turnIndex + 1, white: null, black: null };
    if (index % 2 === 0) acc[turnIndex].white = { ...move, index };
    else acc[turnIndex].black = { ...move, index };
    return acc;
  }, []);

  useEffect(() => {
    if (!ws.current) {
      fetch("/auth/verify", {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
        mode: "cors",
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.accessToken) {
            setToken(data.accessToken);
          } else {
            navigate("/login");
          }
        });

      ws.current = new WebSocket(`ws://localhost:3001/room?roomId=${roomId}`);
      ws.current.onopen = () =>
        ws.current.send(JSON.stringify({ type: "auth", token }));
      ws.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === "join") {
          setSide(data.side === "w" ? "white" : "black");
          setPosition(data.fen);
        } else if (data.type === "players") {
          setUsers((prev) => ({
            white: data.whitePlayer,
            black: data.blackPlayer,
          }));
        } else if (data.type === "position") {
          setPosition(data.fen);
          setCurrentFen(data.fen);
          if (data.result?.san) {
            setMoveHistory((prev) => [
              ...prev,
              { fen: data.fen, san: data.result.san },
            ]);
          }
        } else if (data.type === "chat") {
          setChatMessages((messages) => [...messages, data]);
        }
      };
    }
  }, [roomId]);

  const onPieceDrop = (sourceSquare, targetSquare) => {
    ws.current.send(
      JSON.stringify({
        type: "move",
        move: { from: sourceSquare, to: targetSquare, promotion: "q" },
      })
    );
    return true;
  };
  const sendChat = (event) => {
    event.preventDefault();
    if (!chatInput.trim()) return;
    ws.current.send(JSON.stringify({ type: "chat", text: chatInput.trim() }));
    setChatInput("");
  };

  return (
    <>
      <Navbar />
      <div className="room-grid">
        <aside className="room-sidebar">
          <h3>Room ID</h3>
          <p>{roomId}</p>
          <p>Playing as: {side}</p>
        </aside>

        <div className="board-container">
          <div className="player-label top">Player: {(side === "black" ? users.white : users.black) || "Opponent"}</div>
          <Chessboard
            boardWidth={600}
            position={position}
            onPieceDrop={onPieceDrop}
            boardOrientation={side}
            animationDuration={0}
          />
          <div className="player-label bottom">Player: {(side === "black" ? users.black : users.white) || "You"}</div>
          <ResignConfirm ws={ws} />
        </div>

        <aside className="room-chat">
          <h3>Moves</h3>
          <div className="move-history">
            {groupedMoves.map((turn) => (
              <div key={turn.number} className="move-row">
                <span className="turn-num">{turn.number}.</span>
                <span
                  className="move white"
                  onClick={() => setPosition(moveHistory[turn.white.index].fen)}
                >
                  {turn.white?.san}
                </span>
                <span
                  className="move black"
                  onClick={() =>
                    turn.black && setPosition(moveHistory[turn.black.index].fen)
                  }
                >
                  {turn.black?.san}
                </span>
              </div>
            ))}
            {position !== currentFen && (
              <button
                className="back-to-live"
                onClick={() => setPosition(currentFen)}
                style={{ marginTop: "10px" }}
              >
                Back to Live
              </button>
            )}
          </div>
          <h3>Chat</h3>
          <div className="chat-panel">
            <div className="messages">
              {chatMessages.map((m, i) => (
                <div key={i} className={`message self`}>
                  <span className="sender">{m.username}:</span> {m.text}
                </div>
              ))}
            </div>
            <form onSubmit={sendChat} className="chat-form">
              <input
                type="text"
                placeholder="Type a message..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
              />
              <button type="submit">Send</button>
            </form>
          </div>
        </aside>
      </div>
    </>
  );
}

export default Room;
