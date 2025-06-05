import { useState } from 'react';
import './App.css';
import { useNavigate } from "react-router";

function App() {
  let navigate = useNavigate();
  const [text, setText] = useState('');
  return (
    <div className="App">
      <div className="container">
        <div className="join-section">
          <input type="text" placeholder="Enter Room Code" value = {text} onChange={(e) => setText(e.target.value)}/>
          <div className="join-buttons">
            <button onClick={() => navigate(`/room/${text}`)}>Join Room</button>
          </div>
        </div>
        <button onClick={() => {
          let roomId = "";
          fetch('http://localhost:3001/createroom', { method: 'POST' }).then((res) => res.json()).then((data) => navigate(`/room/${data.roomId}`));
        }}>Create Room</button>
      </div>
    </div>
  );
}


export default App;
