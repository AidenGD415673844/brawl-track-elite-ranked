import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import { ThemeProvider } from '@/lib/ThemeContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import Home from './pages/Home';
import Settings from './pages/Settings';
import SquadDashboard from './pages/SquadDashboard';
import BrawlSpaces from './pages/BrawlSpaces';

const AuthenticatedApp = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/brawlspaces" element={<BrawlSpaces />} />
      <Route path="/squad" element={<SquadDashboard />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {

  return (
    <ErrorBoundary>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <ThemeProvider>
              <ScrollToTop />
              <AuthenticatedApp />
            </ThemeProvider>
          </Router>
          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
