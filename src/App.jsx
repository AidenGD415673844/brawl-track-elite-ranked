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
import DeservedRank from './pages/DeservedRank';
import BrawlerLab from './pages/BrawlerLab';
import SeasonVault from './pages/SeasonVault';
import Auth from './pages/Auth';
import { ensureDefaultSpace } from '@/lib/brawlSpaces';

// Guarantee a default BrawlSpace exists before any page renders so the
// multi-account UI is never empty on a brand-new install.
try { ensureDefaultSpace(); } catch { /* localStorage may be unavailable */ }

const AuthenticatedApp = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/brawlspaces" element={<BrawlSpaces />} />
      <Route path="/squad" element={<SquadDashboard />} />
      <Route path="/deserved-rank" element={<DeservedRank />} />
      <Route path="/brawler-lab" element={<BrawlerLab />} />
      <Route path="/vault" element={<SeasonVault />} />
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
