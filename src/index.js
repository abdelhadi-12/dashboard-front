import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// ✅ Importer uniquement Bootstrap depuis node_modules
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

// 🚫 Ne PAS importer ici les fichiers du dossier public (sb-admin, jquery, etc.)
// Ceux-ci doivent être chargés dans public/index.html

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Optionnel : mesurer les performances
reportWebVitals();
