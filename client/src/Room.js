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
  const [side, setSide] = useState("white");
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const ws = useRef(null);

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
        } else if (data.type === "position") setPosition(data.fen);
        else if (data.type === "chat") {
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
          <div className="player-label top">Player: Opponent</div>
          <Chessboard
            boardWidth={600}
            position={position}
            onPieceDrop={onPieceDrop}
            boardOrientation={side}
            animationDuration={0}
          />
          <div className="player-label bottom">Player: You</div>
          <ResignConfirm ws={ws}/>
        </div>

        <aside className="room-chat">
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
