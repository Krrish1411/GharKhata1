import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { VaultProvider, useVault } from './context/VaultContext';
import OnboardingPage from './pages/OnboardingPage';
import UnlockPage from './pages/UnlockPage';
import DashboardPage from './pages/DashboardPage';
import Layout from './components/Layout';
import './index.css';

function AppContent() {
  const { vaults, isUnlocked } = useVault();

  if (vaults.length === 0) {
    return <OnboardingPage />;
  }

  if (!isUnlocked) {
    return <UnlockPage />;
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<DashboardPage />} />
        <Route path="dashboard" element={<Navigate to="/" replace />} />
        <Route path="accounts" element={<div className="p-8">Accounts Page - Coming Soon</div>} />
        <Route path="transactions" element={<div className="p-8">Transactions Page - Coming Soon</div>} />
        <Route path="categories" element={<div className="p-8">Categories Page - Coming Soon</div>} />
        <Route path="settings" element={<div className="p-8">Settings Page - Coming Soon</div>} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <HashRouter>
      <VaultProvider>
        <AppContent />
      </VaultProvider>
    </HashRouter>
  );
}

export default App;
