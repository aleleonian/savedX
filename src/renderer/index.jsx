import React from 'react';
import ReactDOM from 'react-dom/client';

import './index.css';
import { Application } from './components/Application';
import { AppProvider } from '../context/AppContext';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
    <AppProvider>
        <Application />
    </AppProvider>
);
