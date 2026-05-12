import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { RemoteProvider } from './context/RemoteContext.tsx';
import { SettingsProvider } from './context/SettingsContext.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SettingsProvider>
      <RemoteProvider>
        <App />
      </RemoteProvider>
    </SettingsProvider>
  </StrictMode>,
);
