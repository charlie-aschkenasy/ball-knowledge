// ===========================================================================
// App shell. Auth gate: signed-out users see the login screen; signed-in users
// see the real, server-backed play flow. No localStorage, no bots.
// ===========================================================================

import Atmosphere from './components/Atmosphere';
import { AuthProvider, useAuth } from './auth/AuthProvider';
import Login from './screens/Login';
import PlayApp from './play/PlayApp';

function Shell() {
  const { session, loading } = useAuth();

  return (
    <div className="app">
      <Atmosphere />
      {loading ? null : session ? <PlayApp /> : <Login />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Shell />
    </AuthProvider>
  );
}
