import React from 'react';
import Profile from './components/Profile';
import Landing from './components/Landing';
import { SolanaPaywallDemo } from './components/SolanaPaywallDemo';

const App: React.FC = () => {
  const path = typeof window !== 'undefined' ? window.location.pathname : '/';

  if (path === '/') {
    return (
      <div className="App">
        <Landing />
      </div>
    );
  }

  if (path === '/Nino8291') {
    return (
      <div className="App">
        <Profile />
      </div>
    );
  }

  if (path === '/solana-demo') {
    return (
      <div className="App">
        <SolanaPaywallDemo />
      </div>
    );
  }

  return (
    <div className="App" style={{ padding: 24, fontFamily: 'sans-serif' }}>
      <h2>Not Found</h2>
      <p>
        Try <a href="/">/</a> for the landing page or <a href="/Nino8291">/Nino8291</a> for the
        profile.
      </p>
    </div>
  );
};

export default App;
