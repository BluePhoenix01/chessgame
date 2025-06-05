import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import Room from './Room';
import Login from './login';
import { BrowserRouter, Routes, Route} from 'react-router';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<App />}/>
        <Route path='/room/:roomId' element={<Room />}/>
        <Route path='/login' element={<Login />}/>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
