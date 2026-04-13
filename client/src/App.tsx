import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { AuthGate } from './components/AuthGate';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './pages/Dashboard';
import { Agents } from './pages/Agents';
import { Sessions } from './pages/Sessions';
import { Terminal } from './pages/Terminal';
import { Files } from './pages/Files';
import { Cron } from './pages/Cron';
import { Analytics } from './pages/Analytics';

const TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/agents': 'Agents',
  '/sessions': 'Sessions',
  '/terminal': 'Terminal',
  '/files': 'Files',
  '/cron': 'Cron Jobs',
  '/analytics': 'Analytics'
};

function AppContent() {
  const { user: authUser, logout } = useAuth();
  const user = authUser || undefined;
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const title = TITLES[location.pathname] || 'Hermes Control';

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={user}
        onLogout={logout}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Header
          title={title}
          user={user}
          onLogout={logout}
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        />

        <main style={{ flex: 1, overflowY: 'auto', backgroundColor: 'var(--color-bg)' }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/agents" element={<Agents />} />
            <Route path="/sessions" element={<Sessions />} />
            <Route path="/terminal" element={<Terminal />} />
            <Route path="/files" element={<Files />} />
            <Route path="/cron" element={<Cron />} />
            <Route path="/analytics" element={<Analytics />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthGate>
        <AppContent />
      </AuthGate>
    </Router>
  );
}

export default App;
