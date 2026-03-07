import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

import './styles/index.css';

import 'leaflet/dist/leaflet.css';
import './utils/leaflet-config';

import './services/api.interceptor.ts';

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);