import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { RunProvider, useRuns } from './context/RunContext';
import Layout from './components/Layout';
import LogRun from './pages/LogRun';
import RoutesPage from './pages/Routes';
import Stats from './pages/Stats';
import Trends from './pages/Trends';
import RunHistory from './pages/RunHistory';
import ImportRuns from './pages/ImportRuns';
import Auth from './pages/Auth';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children }) => {
  const { session, isLoading } = useRuns();

  if (isLoading) {
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Loader2 className="spin" /></div>;
  }

  if (!session) {
    return <Navigate to="/auth" />;
  }

  return <Layout>{children}</Layout>;
};

function App() {
  return (
    <RunProvider>
      <Router>
        <Routes>
          <Route path="/auth" element={<Auth />} />

          <Route path="/" element={<ProtectedRoute><LogRun /></ProtectedRoute>} />
          <Route path="/routes" element={<ProtectedRoute><RoutesPage /></ProtectedRoute>} />
          <Route path="/stats" element={<ProtectedRoute><Stats /></ProtectedRoute>} />
          <Route path="/trends" element={<ProtectedRoute><Trends /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><RunHistory /></ProtectedRoute>} />
          <Route path="/import" element={<ProtectedRoute><ImportRuns /></ProtectedRoute>} />
        </Routes>
      </Router>
    </RunProvider>
  );
}

export default App;
