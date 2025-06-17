import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import Room from './Room';
import Login from './Login';
import DashBoard from './DashBoard';
import { BrowserRouter, Routes, Route} from 'react-router';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<App />}/>
        <Route path='/room/:roomId' element={<Room />}/>
        <Route path='/login' element={<Login isLogin={true}/>}/>
        <Route path='/signup' element={<Login isLogin={false} />}/>
        <Route path="/DashBoard" element={<DashBoard />} />
      </Routes>
    </BrowserRouter>
);
