// ════ App.tsx ════
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { LiffProvider } from './contexts/LiffContext';
import { LiffErrorBoundary, LiffLoadingSkeleton, ExternalBrowserWarning } from './components/LiffErrorBoundary';

// Pages
import Home from './pages/Home';
import Register from './pages/Register';
import Board from './pages/Board';
import CreateMatch from './pages/CreateMatch';
import Billing from './pages/Billing';
import Stats from './pages/Stats';
import AdminDashboard from './pages/AdminDashboard';

function App(): React.ReactElement {
  const [isInClient, setIsInClient] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    // Check if running in LINE
    import('@line/liff').then(({ default: liff }) => {
      liff.init({ liffId: import.meta.env.VITE_LIFF_ID || '' }).then(() => {
        setIsInClient(liff.isInClient());
      });
    });
  }, []);

  if (isInClient === null) {
    return <LiffLoadingSkeleton />;
  }

  if (!isInClient) {
    return <ExternalBrowserWarning />;
  }

  return (
    <LiffErrorBoundary>
      <LiffProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/register/:sessionId" element={<Register />} />
            <Route path="/board/:sessionId" element={<Board />} />
            <Route path="/create-match/:sessionId" element={<CreateMatch />} />
            <Route path="/billing/:sessionId" element={<Billing />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/stats/player/:userId" element={<Stats />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Routes>
        </BrowserRouter>
        <Toaster 
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#333',
              color: '#fff',
            },
          }}
        />
      </LiffProvider>
    </LiffErrorBoundary>
  );
}

export default App;
