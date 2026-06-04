import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { useBKStore } from './db/store';

import './styles/tokens.css';
import './styles/global.css';
import './styles/atmosphere.css';
import './styles/components.css';
import './styles/screens.css';

// Boot the DB before React renders. On first run this seeds 40 bots + groups
// + question stats; subsequent runs load the persisted blob.
useBKStore.getState().boot();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
