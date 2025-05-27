import logo from './logo.svg';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
      <div className="container">
        <button>Create Room</button>

        <div className="join-section">
          <input type="text" placeholder="Enter Room Code" />
          <div className="join-buttons">
            <button>Join</button>
            <button>Cancel</button>
          </div>
        </div>
      </div>
    </div>

  );
}

export default App;
