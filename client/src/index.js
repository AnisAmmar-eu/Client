// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // You can keep this minimal or empty, App.css handles most global styles
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);