import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
// Bootstrap CSS - Import FIRST for proper cascading
import 'bootstrap/dist/css/bootstrap.min.css';
// Bootstrap JS
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
// Your custom theme (will override Bootstrap defaults)
import './assets/scss/_theme.scss';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);