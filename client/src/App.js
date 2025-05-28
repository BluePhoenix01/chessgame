import { useEffect, useRef, useState } from 'react';
import './App.css';
import { Chessboard } from "react-chessboard";

function App() {
  const [position, setPosition] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  const ws = useRef(); 
  useEffect(() => {
    ws.current = new WebSocket('ws://localhost:3001/room');
    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.fen) {
        setPosition(data.fen)
      }
    } 
  }, []) 
  function onPieceDrop(sourceSquare, targetSquare){
    ws.current.send(JSON.stringify({
      from: sourceSquare,
      to: targetSquare,
      promotion: "q", // always promote to a queen for example simplicity
    }));
  }
  return (
    <div className="App">
      <div className='chessboard'>
        <Chessboard id="BasicBoard" position={position} onPieceDrop={onPieceDrop}/>
      </div>
      <div className="container">
        <button>Create Room</button>

        <div className="join-section">
          <input type="text" placeholder="Enter Room Code" />
          <div className="join-buttons">
            <button>Join Room</button>
          </div>
        </div>
      </div>
    </div>

  );
}

export default App;
