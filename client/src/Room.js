import { useEffect, useRef, useState } from 'react';
import './Room.css';
import { Chessboard } from "react-chessboard";
import { useParams } from 'react-router';
import useLocalStorage from './hooks/useLocalStorage';
import { useNavigate } from 'react-router';
import Navbar from './components/Navbar';

function Room() {
  let navigate = useNavigate();
  const [token, setToken] = useLocalStorage("token");
  const [position, setPosition] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  const [side, setSide] = useState('white');
  const ws = useRef(); 
  let { roomId } = useParams();
  useEffect(() => {
    if (ws.current != null) {
      return;
    }
    fetch("http://localhost:3001/verify", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
      mode: "cors",
    })
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
        if (data.accessToken) {
          setToken(data.accessToken);
          return;
        }
        navigate("/login");
      });
    ws.current = new WebSocket(`ws://localhost:3001/room?roomId=${roomId}`);
    ws.current.onopen = () => {
      ws.current.send(JSON.stringify({ type: "auth", token }));
    }
    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.fen) {
        setPosition(data.fen)
      }
      else if (data.side) {
        if (data.side === "w") {
          setSide("white");
        }
        else if(data.side === "b") {
          setSide("black");
        }
        console.log(data.side);
      }
    };
  }, [roomId, token]); 
  function onPieceDrop(sourceSquare, targetSquare){
    ws.current.send(JSON.stringify({
      from: sourceSquare,
      to: targetSquare,
      promotion: "q", // always promote to a queen for example simplicity
    }));
    return true;
  }
  return (
    <div className="Room">
      <Navbar />
      <div className='chessboard'>
        <Chessboard boardWidth={800} position={position} onPieceDrop={onPieceDrop} boardOrientation={side}/>
      </div>
    </div>

  );
}

export default Room;
