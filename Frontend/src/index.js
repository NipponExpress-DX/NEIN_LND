import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { AgendaProvider } from './components/Admin/Agenda/AgendaContext';
import { BrowserRouter } from 'react-router-dom';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter basename="/NEIN-LND">
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <AgendaProvider>
          <App />
        </AgendaProvider>
      </LocalizationProvider>
    </BrowserRouter>
  </React.StrictMode>
);